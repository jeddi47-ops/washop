import os
import jwt
import bcrypt
import secrets
from datetime import datetime, timezone, timedelta
from fastapi import Request, HTTPException, Depends
from functools import wraps
from database import db

JWT_ALGORITHM = "HS256"


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh"
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


async def _decode_and_fetch_user(request: Request) -> dict:
    """Decode JWT and fetch user from DB, WITHOUT checking status.
    Shared by get_current_user (strict) and get_user_any_status (lenient)."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Type de token invalide")
        from bson import ObjectId
        user = await db.users.find_one({"_id": ObjectId(payload["sub"]), "deleted_at": None})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        user["id"] = str(user["_id"])
        del user["_id"]
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Erreur d'authentification")


async def get_current_user(request: Request) -> dict:
    """Strict: blocks banned and suspended users from ALL protected actions."""
    user = await _decode_and_fetch_user(request)
    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Compte banni")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Compte suspendu")
    return user


async def get_user_any_status(request: Request) -> dict:
    """Lenient: returns user regardless of status (active/suspended/banned).
    Used ONLY by /auth/me so that the frontend can display a dedicated
    ban/suspension screen while keeping the session intact."""
    return await _decode_and_fetch_user(request)


def role_required(*roles):
    """Dependency factory for role-based access control."""
    async def dependency(request: Request):
        user = await get_current_user(request)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Accès non autorisé pour ce rôle")
        return user
    return dependency


async def check_brute_force(ip: str, email: str):
    """Check for brute force login attempts."""
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt and attempt.get("count", 0) >= 5:
        locked_until = attempt.get("locked_until")
        if locked_until and datetime.now(timezone.utc) < locked_until:
            raise HTTPException(
                status_code=429,
                detail="Trop de tentatives. Réessayez dans 15 minutes."
            )
        else:
            await db.login_attempts.delete_one({"identifier": identifier})


async def record_failed_attempt(ip: str, email: str):
    """Record a failed login attempt."""
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier}, {"_id": 0})
    if attempt:
        new_count = attempt.get("count", 0) + 1
        update = {"$set": {"count": new_count, "last_attempt": datetime.now(timezone.utc)}}
        if new_count >= 5:
            update["$set"]["locked_until"] = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.login_attempts.update_one({"identifier": identifier}, update)
    else:
        await db.login_attempts.insert_one({
            "identifier": identifier,
            "count": 1,
            "last_attempt": datetime.now(timezone.utc)
        })


async def clear_failed_attempts(ip: str, email: str):
    """Clear failed login attempts on successful login."""
    identifier = f"{ip}:{email}"
    await db.login_attempts.delete_many({"identifier": identifier})

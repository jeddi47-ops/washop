from fastapi import APIRouter, HTTPException, Request, Response, Depends
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import secrets

from database import db
from middleware.auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    get_current_user, get_user_any_status, check_brute_force, record_failed_attempt, clear_failed_attempts,
    get_jwt_secret, JWT_ALGORITHM
)
from models.schemas import (
    RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest,
    UserResponse, UserRole
)
from utils.helpers import success_response, error_response, utc_now
import jwt
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Authentification"])


@router.post("/register")
async def register(data: RegisterRequest, response: Response):
    existing = await db.users.find_one({"email": data.email, "deleted_at": None})
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    if data.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Impossible de créer un compte admin")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password_hash": hash_password(data.password),
        "address": data.address,
        "role": data.role.value,
        "status": "active",
        "created_at": utc_now(),
        "deleted_at": None
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # If registering as vendor, create vendor profile with 7-day trial
    if data.role == UserRole.vendor:
        from utils.helpers import generate_slug
        import uuid
        now = utc_now()
        slug = generate_slug(data.name + "-shop")
        # Ensure unique slug
        existing_slug = await db.vendors.find_one({"shop_slug": slug})
        if existing_slug:
            slug = f"{slug}-{str(uuid.uuid4())[:8]}"

        vendor_doc = {
            "user_id": user_id,
            "shop_name": f"{data.name}'s Shop",
            "shop_slug": slug,
            "description": "",
            "whatsapp_number": "",
            "subscription_type": "basic",
            "subscription_duration": None,
            "subscription_started_at": None,
            "subscription_expires_at": None,
            "trial_started_at": now,
            "trial_expires_at": now + timedelta(days=7),
            "is_verified": False,
            "is_paused": False,
            "is_active": True,
            "avg_product_rating": 0.0,
            "avg_vendor_rating": 0.0,
            "social_links": {},
            "created_at": now,
            "deleted_at": None
        }
        await db.vendors.insert_one(vendor_doc)

    access_token = create_access_token(user_id, data.email, data.role.value)
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return success_response(
        data={"id": user_id, "name": data.name, "email": data.email, "role": data.role.value, "token": access_token},
        message="Inscription réussie"
    )


@router.post("/login")
async def login(data: LoginRequest, request: Request, response: Response):
    client_ip = request.client.host if request.client else "unknown"
    await check_brute_force(client_ip, data.email)

    user = await db.users.find_one({"email": data.email, "deleted_at": None})
    if not user:
        await record_failed_attempt(client_ip, data.email)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if not verify_password(data.password, user["password_hash"]):
        await record_failed_attempt(client_ip, data.email)
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    if user.get("status") == "banned":
        raise HTTPException(status_code=403, detail="Compte banni")
    if user.get("status") == "suspended":
        raise HTTPException(status_code=403, detail="Compte suspendu")

    await clear_failed_attempts(client_ip, data.email)

    user_id = str(user["_id"])
    access_token = create_access_token(user_id, user["email"], user["role"])
    refresh_token = create_refresh_token(user_id)

    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")

    return success_response(
        data={"id": user_id, "name": user["name"], "email": user["email"], "role": user["role"], "token": access_token},
        message="Connexion réussie"
    )


@router.post("/logout")
async def logout(response: Response, user=Depends(get_current_user)):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return success_response(message="Déconnexion réussie")


@router.get("/me")
async def get_me(user=Depends(get_user_any_status)):
    # Lenient: returns the user even if banned/suspended so that the frontend
    # can show a dedicated ban/suspension screen while the session stays alive.
    return success_response(data=user)


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Token de rafraîchissement manquant")

    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Type de token invalide")

        user = await db.users.find_one({"_id": ObjectId(payload["sub"]), "deleted_at": None})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")

        user_id = str(user["_id"])
        new_access = create_access_token(user_id, user["email"], user["role"])
        response.set_cookie(key="access_token", value=new_access, httponly=True, secure=False, samesite="lax", max_age=86400, path="/")

        return success_response(data={"token": new_access}, message="Token rafraîchi")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token de rafraîchissement expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token de rafraîchissement invalide")


@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    user = await db.users.find_one({"email": data.email, "deleted_at": None})
    if not user:
        # Don't reveal if email exists
        return success_response(message="Si cet email existe, un lien de réinitialisation a été envoyé")

    token = secrets.token_urlsafe(32)
    await db.password_reset_tokens.insert_one({
        "user_id": str(user["_id"]),
        "token": token,
        "expires_at": utc_now() + timedelta(hours=1),
        "used": False,
        "created_at": utc_now()
    })

    reset_link = f"/reset-password?token={token}"
    logger.info(f"Password reset link for {data.email}: {reset_link}")

    from utils.email_service import send_password_reset
    await send_password_reset(data.email, reset_link)

    return success_response(message="Si cet email existe, un lien de réinitialisation a été envoyé")


@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    token_doc = await db.password_reset_tokens.find_one({
        "token": data.token,
        "used": False,
        "expires_at": {"$gt": utc_now()}
    })
    if not token_doc:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")

    new_hash = hash_password(data.new_password)
    await db.users.update_one(
        {"_id": ObjectId(token_doc["user_id"])},
        {"$set": {"password_hash": new_hash}}
    )
    await db.password_reset_tokens.update_one(
        {"token": data.token},
        {"$set": {"used": True}}
    )

    return success_response(message="Mot de passe réinitialisé avec succès")

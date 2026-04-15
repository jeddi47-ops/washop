from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user, role_required, hash_password
from models.schemas import UserUpdate, UserRole, UserStatus
from utils.helpers import success_response, error_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/users", tags=["Utilisateurs"])


@router.get("/me")
async def get_profile(user=Depends(get_current_user)):
    return success_response(data=user)


@router.put("/me")
async def update_profile(data: UserUpdate, user=Depends(get_current_user)):
    update_fields = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update_fields})
    updated = await db.users.find_one({"_id": ObjectId(user["id"])}, {"_id": 0, "password_hash": 0})
    updated["id"] = user["id"]
    return success_response(data=updated, message="Profil mis à jour")


@router.get("")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: str = Query(None),
    status: str = Query(None),
    user=Depends(role_required("admin"))
):
    page, limit, skip = validate_pagination(page, limit)
    query = {"deleted_at": None}
    if role:
        query["role"] = role
    if status:
        query["status"] = status

    total = await db.users.count_documents(query)
    users = await db.users.find(query, {"password_hash": 0}).skip(skip).limit(limit).to_list(limit)

    result = []
    for u in users:
        u["id"] = str(u.pop("_id"))
        result.append(u)

    return paginated_response(result, total, page, limit)


@router.get("/{user_id}")
async def get_user(user_id: str, user=Depends(role_required("admin"))):
    try:
        target = await db.users.find_one({"_id": ObjectId(user_id), "deleted_at": None}, {"password_hash": 0})
    except Exception:
        raise HTTPException(status_code=400, detail="ID utilisateur invalide")
    if not target:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    target["id"] = str(target.pop("_id"))
    return success_response(data=target)


@router.put("/{user_id}/status")
async def update_user_status(user_id: str, status: UserStatus, user=Depends(role_required("admin"))):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id), "deleted_at": None},
            {"$set": {"status": status.value}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID utilisateur invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    # Log admin action
    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "update_user_status",
        "target_type": "user",
        "target_id": user_id,
        "description": f"Statut changé en {status.value}",
        "created_at": utc_now()
    })

    return success_response(message=f"Statut utilisateur changé en {status.value}")


@router.delete("/{user_id}")
async def soft_delete_user(user_id: str, user=Depends(role_required("admin"))):
    try:
        result = await db.users.update_one(
            {"_id": ObjectId(user_id), "deleted_at": None},
            {"$set": {"deleted_at": utc_now()}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID utilisateur invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "soft_delete_user",
        "target_type": "user",
        "target_id": user_id,
        "description": "Utilisateur supprimé (soft delete)",
        "created_at": utc_now()
    })

    return success_response(message="Utilisateur supprimé")

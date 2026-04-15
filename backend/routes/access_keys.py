from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import timedelta
import uuid
import secrets
import string

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import AccessKeyBulkCreate, AccessKeyActivate, SubscriptionType, SubscriptionAction
from utils.helpers import success_response, error_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/access-keys", tags=["Clés d'accès"])


def generate_key_code(length=16):
    """Generate a random access key code."""
    chars = string.ascii_uppercase + string.digits
    return '-'.join(
        ''.join(secrets.choice(chars) for _ in range(4))
        for _ in range(length // 4)
    )


@router.post("/generate")
async def generate_keys(data: AccessKeyBulkCreate, user=Depends(role_required("admin"))):
    """Admin: bulk generate access keys."""
    batch_id = str(uuid.uuid4())[:12]
    keys = []

    for _ in range(data.quantity):
        key_code = generate_key_code()
        # Ensure uniqueness
        while await db.access_keys.find_one({"key_code": key_code}):
            key_code = generate_key_code()

        key_doc = {
            "key_code": key_code,
            "type": data.type.value,
            "duration": data.duration.value,
            "is_used": False,
            "is_blacklisted": False,
            "used_by": None,
            "vendor_id": None,
            "used_at": None,
            "created_at": utc_now(),
            "batch_id": batch_id
        }
        result = await db.access_keys.insert_one(key_doc)
        key_doc["id"] = str(result.inserted_id)
        key_doc.pop("_id", None)
        keys.append(key_doc)

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "generate_access_keys",
        "target_type": "access_keys",
        "target_id": batch_id,
        "description": f"Généré {data.quantity} clés {data.type.value}/{data.duration.value} (batch: {batch_id})",
        "created_at": utc_now()
    })

    return success_response(
        data={"batch_id": batch_id, "count": len(keys), "keys": keys},
        message=f"{data.quantity} clé(s) générée(s)"
    )


@router.post("/activate")
async def activate_key(data: AccessKeyActivate, user=Depends(get_current_user)):
    """Vendor: activate an access key to start/extend/upgrade subscription."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Seuls les vendeurs peuvent activer des clés")

    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")

    key = await db.access_keys.find_one({"key_code": data.key_code})
    if not key:
        raise HTTPException(status_code=404, detail="Clé non trouvée")
    if key.get("is_used"):
        raise HTTPException(status_code=400, detail="Cette clé a déjà été utilisée")
    if key.get("is_blacklisted"):
        raise HTTPException(status_code=400, detail="Cette clé est sur liste noire")

    now = utc_now()
    vendor_id = str(vendor["_id"])
    key_type = key["type"]
    key_duration = key["duration"]
    duration_days = 365 if key_duration == "annual" else 30

    current_sub = vendor.get("subscription_type")
    current_expires = vendor.get("subscription_expires_at")

    # Determine action
    action = "new"
    type_hierarchy = {"basic": 1, "premium": 2, "extra": 3}

    if current_sub and current_expires and current_expires > now:
        # Active subscription exists
        if type_hierarchy.get(key_type, 0) > type_hierarchy.get(current_sub, 0):
            action = "upgrade"
        elif key_type == current_sub:
            action = "extension"
        else:
            action = "renewal"

    # Calculate dates
    if action == "extension" and current_expires and current_expires > now:
        # Extend from current expiry
        new_expires = current_expires + timedelta(days=duration_days)
        new_started = vendor.get("subscription_started_at", now)
    else:
        new_started = now
        new_expires = now + timedelta(days=duration_days)

    # Update vendor subscription
    await db.vendors.update_one(
        {"_id": vendor["_id"]},
        {"$set": {
            "subscription_type": key_type,
            "subscription_duration": key_duration,
            "subscription_started_at": new_started,
            "subscription_expires_at": new_expires,
            "is_active": True
        }}
    )

    # Mark key as used
    await db.access_keys.update_one(
        {"_id": key["_id"]},
        {"$set": {
            "is_used": True,
            "used_by": user["id"],
            "vendor_id": vendor_id,
            "used_at": now
        }}
    )

    # Log in subscription_history
    await db.subscription_history.insert_one({
        "vendor_id": vendor_id,
        "access_key_id": str(key["_id"]),
        "type": key_type,
        "duration": key_duration,
        "started_at": new_started,
        "expires_at": new_expires,
        "action": action,
        "created_at": now
    })

    # Log history
    await db.history.insert_one({
        "user_id": user["id"],
        "action_type": "activate_key",
        "description": f"Clé activée: {key_type}/{key_duration} ({action})",
        "entity_type": "access_key",
        "entity_id": str(key["_id"]),
        "created_at": now
    })

    return success_response(
        data={
            "action": action,
            "subscription_type": key_type,
            "subscription_duration": key_duration,
            "expires_at": new_expires.isoformat(),
            "is_active": True
        },
        message=f"Clé activée ({action}). Abonnement {key_type} jusqu'au {new_expires.strftime('%d/%m/%Y')}"
    )


@router.put("/{key_id}/blacklist")
async def blacklist_key(key_id: str, user=Depends(role_required("admin"))):
    """Admin: blacklist an access key."""
    try:
        result = await db.access_keys.update_one(
            {"_id": ObjectId(key_id)},
            {"$set": {"is_blacklisted": True}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID clé invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Clé non trouvée")

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "blacklist_key",
        "target_type": "access_key",
        "target_id": key_id,
        "description": "Clé mise sur liste noire",
        "created_at": utc_now()
    })

    return success_response(message="Clé mise sur liste noire")


@router.get("")
async def list_keys(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str = Query(None),
    duration: str = Query(None),
    status: str = Query(None),
    batch_id: str = Query(None),
    user=Depends(role_required("admin"))
):
    """Admin: list all access keys with filters."""
    page, limit, skip = validate_pagination(page, limit)
    query = {}

    if type:
        query["type"] = type
    if duration:
        query["duration"] = duration
    if batch_id:
        query["batch_id"] = batch_id
    if status:
        if status == "available":
            query["is_used"] = False
            query["is_blacklisted"] = False
        elif status == "used":
            query["is_used"] = True
        elif status == "blacklisted":
            query["is_blacklisted"] = True

    total = await db.access_keys.count_documents(query)
    keys = await db.access_keys.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for k in keys:
        k["id"] = str(k.pop("_id"))
        result.append(k)

    return paginated_response(result, total, page, limit)


@router.get("/history/{vendor_id}")
async def get_subscription_history(
    vendor_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    """Get subscription history for a vendor."""
    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != vendor_id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
    elif user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    page, limit, skip = validate_pagination(page, limit)
    query = {"vendor_id": vendor_id}

    total = await db.subscription_history.count_documents(query)
    history = await db.subscription_history.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for h in history:
        h["id"] = str(h.pop("_id"))
        result.append(h)

    return paginated_response(result, total, page, limit)

from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File, Path
from bson import ObjectId
from datetime import timedelta
import uuid

from database import db
from middleware.auth import get_current_user, role_required, require_vendor_subscription
from models.schemas import VendorCreate, VendorUpdate, VendorResponse
from utils.helpers import (
    success_response, error_response, paginated_response, validate_pagination,
    utc_now, generate_slug
)
from utils.cloudinary_service import upload_image, delete_image, validate_image_file

router = APIRouter(prefix="/vendors", tags=["Vendeurs"])


@router.post("")
async def create_or_update_vendor(data: VendorCreate, user=Depends(require_vendor_subscription)):
    """Create or update vendor profile for current user."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Seuls les vendeurs peuvent créer une boutique")

    existing = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})

    slug = generate_slug(data.shop_name)
    slug_exists = await db.vendors.find_one({"shop_slug": slug, "user_id": {"$ne": user["id"]}})
    if slug_exists:
        slug = f"{slug}-{str(uuid.uuid4())[:8]}"

    if existing:
        update_data = {
            "shop_name": data.shop_name,
            "shop_slug": slug,
            "description": data.description or "",
            "whatsapp_number": data.whatsapp_number,
            "social_links": data.social_links or {},
        }
        await db.vendors.update_one({"_id": existing["_id"]}, {"$set": update_data})
        vendor = await db.vendors.find_one({"_id": existing["_id"]}, {"_id": 0})
        vendor["id"] = str(existing["_id"])
        return success_response(data=vendor, message="Boutique mise à jour")
    else:
        now = utc_now()
        vendor_doc = {
            "user_id": user["id"],
            "shop_name": data.shop_name,
            "shop_slug": slug,
            "description": data.description or "",
            "whatsapp_number": data.whatsapp_number,
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
            "social_links": data.social_links or {},
            "created_at": now,
            "deleted_at": None
        }
        result = await db.vendors.insert_one(vendor_doc)
        vendor_doc["id"] = str(result.inserted_id)
        vendor_doc.pop("_id", None)
        return success_response(data=vendor_doc, message="Boutique créée avec essai gratuit de 7 jours")


@router.get("/me")
async def get_my_vendor(user=Depends(get_current_user)):
    """Get current user's vendor profile."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas vendeur")
    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
    vendor["id"] = str(vendor.pop("_id"))
    return success_response(data=vendor)


@router.put("/me")
async def update_my_vendor(data: VendorUpdate, user=Depends(require_vendor_subscription)):
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas vendeur")
    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")

    update_fields = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if "shop_name" in update_fields:
        slug = generate_slug(update_fields["shop_name"])
        slug_exists = await db.vendors.find_one({"shop_slug": slug, "_id": {"$ne": vendor["_id"]}})
        if slug_exists:
            slug = f"{slug}-{str(uuid.uuid4())[:8]}"
        update_fields["shop_slug"] = slug

    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    await db.vendors.update_one({"_id": vendor["_id"]}, {"$set": update_fields})
    updated = await db.vendors.find_one({"_id": vendor["_id"]}, {"_id": 0})
    updated["id"] = str(vendor["_id"])
    return success_response(data=updated, message="Boutique mise à jour")


@router.post("/me/image/{kind}")
async def upload_vendor_image(
    file: UploadFile = File(...),
    kind: str = Path(..., pattern="^(avatar|banner)$"),
    user=Depends(require_vendor_subscription),
):
    """Upload the current vendor's avatar (logo) or banner to Cloudinary and
    persist the resulting URL on the vendor document. The previous Cloudinary
    asset is deleted so we never accumulate orphan images."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas vendeur")
    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")

    content = await file.read()
    is_valid, err_msg = validate_image_file(file.content_type, len(content))
    if not is_valid:
        raise HTTPException(status_code=400, detail=err_msg)

    folder = f"washop/vendors/{str(vendor['_id'])}/{kind}"
    try:
        result = await upload_image(content, folder=folder)
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))

    url_field = f"{kind}_url"
    pid_field = f"{kind}_public_id"
    # Best-effort cleanup of the previous asset.
    old_public_id = vendor.get(pid_field)
    if old_public_id:
        try:
            delete_image(old_public_id)
        except Exception:
            pass

    await db.vendors.update_one(
        {"_id": vendor["_id"]},
        {"$set": {url_field: result["cloudinary_url"], pid_field: result["cloudinary_public_id"]}},
    )
    return success_response(
        data={"url": result["cloudinary_url"], "kind": kind},
        message=f"{kind.capitalize()} mis à jour",
    )


@router.delete("/me/image/{kind}")
async def delete_vendor_image(
    kind: str = Path(..., pattern="^(avatar|banner)$"),
    user=Depends(require_vendor_subscription),
):
    """Remove the vendor's avatar or banner."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Vous n'êtes pas vendeur")
    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
    url_field = f"{kind}_url"
    pid_field = f"{kind}_public_id"
    old_public_id = vendor.get(pid_field)
    if old_public_id:
        try:
            delete_image(old_public_id)
        except Exception:
            pass
    await db.vendors.update_one(
        {"_id": vendor["_id"]},
        {"$unset": {url_field: "", pid_field: ""}},
    )
    return success_response(message=f"{kind.capitalize()} supprimé")


@router.get("")
async def list_vendors(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    active_only: bool = Query(True),
    subscription_type: str = Query(None)
):
    """List all active vendors (public endpoint)."""
    page, limit, skip = validate_pagination(page, limit)
    query = {"deleted_at": None}
    if active_only:
        query["is_active"] = True
    if subscription_type:
        query["subscription_type"] = subscription_type

    total = await db.vendors.count_documents(query)
    vendors = await db.vendors.find(query).skip(skip).limit(limit).to_list(limit)

    result = []
    for v in vendors:
        v["id"] = str(v.pop("_id"))
        result.append(v)

    return paginated_response(result, total, page, limit)


@router.get("/{vendor_id}")
async def get_vendor(vendor_id: str):
    """Get vendor details (public)."""
    try:
        vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id), "deleted_at": None, "is_active": True})
    except Exception:
        raise HTTPException(status_code=400, detail="ID vendeur invalide")
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    vendor["id"] = str(vendor.pop("_id"))
    return success_response(data=vendor)


@router.get("/slug/{shop_slug}")
async def get_vendor_by_slug(shop_slug: str):
    """Get vendor by shop slug (public)."""
    vendor = await db.vendors.find_one({"shop_slug": shop_slug, "deleted_at": None, "is_active": True})
    if not vendor:
        raise HTTPException(status_code=404, detail="Boutique non trouvée")
    vendor["id"] = str(vendor.pop("_id"))
    return success_response(data=vendor)


@router.get("/{vendor_id}/stats")
async def get_vendor_stats(vendor_id: str, user=Depends(get_current_user)):
    """Get vendor statistics (vendor own or admin)."""
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id), "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")

    if user["role"] == "vendor" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    vid = str(vendor["_id"])
    total_orders = await db.orders.count_documents({"vendor_id": vid})
    total_products = await db.products.count_documents({"vendor_id": vid, "deleted_at": None})

    # Total clicks
    pipeline = [
        {"$match": {"vendor_id": vid, "deleted_at": None}},
        {"$group": {"_id": None, "total_clicks": {"$sum": "$click_count"}}}
    ]
    clicks_result = await db.products.aggregate(pipeline).to_list(1)
    total_clicks = clicks_result[0]["total_clicks"] if clicks_result else 0

    conversion_rate = (total_orders / total_clicks * 100) if total_clicks > 0 else 0

    # Best product by orders
    best_product_pipeline = [
        {"$match": {"vendor_id": vid}},
        {"$lookup": {"from": "order_items", "localField": "_id", "foreignField": "order_id", "as": "items"}},
    ]

    stats = {
        "total_orders": total_orders,
        "total_products": total_products,
        "total_clicks": total_clicks,
        "conversion_rate": round(conversion_rate, 2),
        "avg_product_rating": vendor.get("avg_product_rating", 0),
        "avg_vendor_rating": vendor.get("avg_vendor_rating", 0),
        "subscription_type": vendor.get("subscription_type"),
        "subscription_expires_at": vendor.get("subscription_expires_at"),
        "is_active": vendor.get("is_active", False)
    }

    return success_response(data=stats)


@router.put("/{vendor_id}/verify")
async def verify_vendor(vendor_id: str, user=Depends(role_required("admin"))):
    """Admin: verify a vendor."""
    try:
        result = await db.vendors.update_one(
            {"_id": ObjectId(vendor_id), "deleted_at": None},
            {"$set": {"is_verified": True}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID vendeur invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "verify_vendor",
        "target_type": "vendor",
        "target_id": vendor_id,
        "description": "Vendeur vérifié",
        "created_at": utc_now()
    })

    return success_response(message="Vendeur vérifié")


@router.put("/{vendor_id}/pause")
async def toggle_pause_vendor(vendor_id: str, user=Depends(get_current_user)):
    """Vendor can pause/unpause their own shop."""
    vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id), "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")
    if user["role"] == "vendor" and vendor["user_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    new_state = not vendor.get("is_paused", False)
    await db.vendors.update_one({"_id": vendor["_id"]}, {"$set": {"is_paused": new_state}})
    return success_response(message=f"Boutique {'en pause' if new_state else 'réactivée'}")


@router.delete("/{vendor_id}/hard")
async def hard_delete_vendor(vendor_id: str, user=Depends(role_required("admin"))):
    """Admin only: permanently delete vendor + cascade."""
    try:
        vendor = await db.vendors.find_one({"_id": ObjectId(vendor_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID vendeur invalide")
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")

    vid = str(vendor["_id"])

    # Delete product images from Cloudinary
    from utils.cloudinary_service import delete_images
    products = await db.products.find({"vendor_id": vid}).to_list(None)
    for product in products:
        pid = str(product["_id"])
        images = await db.product_images.find({"product_id": pid}).to_list(None)
        public_ids = [img["cloudinary_public_id"] for img in images if img.get("cloudinary_public_id")]
        if public_ids:
            delete_images(public_ids)
        await db.product_images.delete_many({"product_id": pid})

    # Cascade deletes
    await db.products.delete_many({"vendor_id": vid})
    await db.orders.delete_many({"vendor_id": vid})
    await db.reviews.delete_many({"target_id": vid, "type": "vendor"})
    await db.flash_sales.delete_many({"vendor_id": vid})
    await db.featured_products.delete_many({"vendor_id": vid})
    await db.subscription_history.delete_many({"vendor_id": vid})
    await db.vendors.delete_one({"_id": vendor["_id"]})

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "hard_delete_vendor",
        "target_type": "vendor",
        "target_id": vendor_id,
        "description": "Vendeur supprimé définitivement avec cascade",
        "created_at": utc_now()
    })

    return success_response(message="Vendeur et toutes ses données supprimés définitivement")

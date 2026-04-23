from fastapi import APIRouter, HTTPException, Depends, Query, UploadFile, File
from bson import ObjectId
from typing import List, Optional
import uuid

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import ProductCreate, ProductUpdate
from utils.helpers import success_response, error_response, paginated_response, validate_pagination, utc_now
from utils.cloudinary_service import (
    upload_image, delete_image, delete_images,
    validate_image_file, is_cloudinary_configured,
    MAX_IMAGES_PER_PRODUCT
)

router = APIRouter(prefix="/products", tags=["Produits"])


async def check_product_quota(vendor_id: str, vendor_sub_type: str):
    """Check if vendor can add more products (basic plan = max 15)."""
    if vendor_sub_type == "basic":
        count = await db.products.count_documents({"vendor_id": vendor_id, "deleted_at": None})
        if count >= 15:
            raise HTTPException(
                status_code=403,
                detail="Limite de 15 produits atteinte pour le plan basic. Passez au premium ou extra."
            )


@router.post("")
async def create_product(data: ProductCreate, user=Depends(get_current_user)):
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Seuls les vendeurs peuvent créer des produits")

    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
    if not vendor.get("is_active", False):
        raise HTTPException(status_code=403, detail="Votre boutique n'est pas active. Activez votre abonnement.")

    vendor_id = str(vendor["_id"])
    await check_product_quota(vendor_id, vendor.get("subscription_type", "basic"))

    # Validate category exists
    try:
        cat = await db.categories.find_one({"_id": ObjectId(data.category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID catégorie invalide")
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")

    product_doc = {
        "vendor_id": vendor_id,
        "category_id": data.category_id,
        "name": data.name,
        "description": data.description or "",
        "price": data.price,
        "stock": data.stock,
        "is_featured": data.is_featured,
        "is_active": True,
        "click_count": 0,
        "created_at": utc_now(),
        "deleted_at": None
    }
    result = await db.products.insert_one(product_doc)
    product_doc["id"] = str(result.inserted_id)
    product_doc.pop("_id", None)

    # Log history
    await db.history.insert_one({
        "user_id": user["id"],
        "action_type": "create_product",
        "description": f"Produit créé: {data.name}",
        "entity_type": "product",
        "entity_id": product_doc["id"],
        "created_at": utc_now()
    })

    return success_response(data=product_doc, message="Produit créé")


@router.get("")
async def list_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    vendor_id: str = Query(None),
    category_id: str = Query(None),
    is_featured: bool = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc")
):
    """List products with filters (public)."""
    page, limit, skip = validate_pagination(page, limit)
    query = {"deleted_at": None, "is_active": True}

    if vendor_id:
        query["vendor_id"] = vendor_id
    if category_id:
        query["category_id"] = category_id
    if is_featured is not None:
        query["is_featured"] = is_featured
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price

    # Only allow active vendor products
    active_vendors = await db.vendors.find({"is_active": True, "deleted_at": None}, {"_id": 1}).to_list(None)
    active_vendor_ids = [str(v["_id"]) for v in active_vendors]
    query["vendor_id"] = {"$in": active_vendor_ids} if not vendor_id else vendor_id

    sort_dir = -1 if sort_order == "desc" else 1
    allowed_sorts = {"created_at", "price", "click_count", "name"}
    if sort_by not in allowed_sorts:
        sort_by = "created_at"

    total = await db.products.count_documents(query)
    products = await db.products.find(query).sort(sort_by, sort_dir).skip(skip).limit(limit).to_list(limit)

    result = []
    for p in products:
        p["id"] = str(p.pop("_id"))
        # Fetch images
        images = await db.product_images.find(
            {"product_id": p["id"]}, {"_id": 0}
        ).sort("position", 1).to_list(MAX_IMAGES_PER_PRODUCT)
        for img in images:
            img["id"] = img.get("id", "")
        p["images"] = images
        result.append(p)

    return paginated_response(result, total, page, limit)


@router.get("/vendor/me")
async def list_my_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    """List vendor's own products (includes inactive)."""
    if user["role"] != "vendor":
        raise HTTPException(status_code=403, detail="Accès réservé aux vendeurs")

    vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
    if not vendor:
        raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")

    page, limit, skip = validate_pagination(page, limit)
    vendor_id = str(vendor["_id"])
    query = {"vendor_id": vendor_id, "deleted_at": None}

    total = await db.products.count_documents(query)
    products = await db.products.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for p in products:
        p["id"] = str(p.pop("_id"))
        images = await db.product_images.find({"product_id": p["id"]}, {"_id": 0}).sort("position", 1).to_list(5)
        p["images"] = images
        result.append(p)

    return paginated_response(result, total, page, limit)


@router.get("/{product_id}")
async def get_product(product_id: str, increment_click: bool = Query(False)):
    """Get product details (public). Optionally increment click count."""
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if increment_click:
        await db.products.update_one({"_id": ObjectId(product_id)}, {"$inc": {"click_count": 1}})
        product["click_count"] = product.get("click_count", 0) + 1

    product["id"] = str(product.pop("_id"))

    # Fetch images
    images = await db.product_images.find({"product_id": product["id"]}, {"_id": 0}).sort("position", 1).to_list(5)
    product["images"] = images

    # Check for active flash sale
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    flash = await db.flash_sales.find_one({
        "product_id": product["id"],
        "is_active": True,
        "starts_at": {"$lte": now},
        "ends_at": {"$gte": now}
    }, {"_id": 0})
    if flash:
        product["flash_sale"] = {
            "discount_percentage": flash["discount_percentage"],
            "discounted_price": flash["discounted_price"],
            "ends_at": flash["ends_at"]
        }

    return success_response(data=product)


@router.put("/{product_id}")
async def update_product(product_id: str, data: ProductUpdate, user=Depends(get_current_user)):
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != product["vendor_id"]:
            raise HTTPException(status_code=403, detail="Ce produit ne vous appartient pas")

    update_fields = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": update_fields})
    updated = await db.products.find_one({"_id": ObjectId(product_id)})
    updated["id"] = str(updated.pop("_id"))
    return success_response(data=updated, message="Produit mis à jour")


@router.delete("/{product_id}")
async def soft_delete_product(product_id: str, user=Depends(get_current_user)):
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != product["vendor_id"]:
            raise HTTPException(status_code=403, detail="Ce produit ne vous appartient pas")

    # Soft delete product
    await db.products.update_one({"_id": ObjectId(product_id)}, {"$set": {"deleted_at": utc_now()}})

    # Delete Cloudinary images
    images = await db.product_images.find({"product_id": product_id}).to_list(None)
    public_ids = [img["cloudinary_public_id"] for img in images if img.get("cloudinary_public_id")]
    if public_ids:
        delete_images(public_ids)

    return success_response(message="Produit supprimé")


# ============== PRODUCT IMAGES ==============

@router.post("/{product_id}/images")
async def upload_product_images(
    product_id: str,
    files: List[UploadFile] = File(...),
    user=Depends(get_current_user)
):
    """Upload images for a product (max 5 per product, max 2MB each)."""
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    try:
        product = await db.products.find_one({"_id": ObjectId(product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != product["vendor_id"]:
            raise HTTPException(status_code=403, detail="Ce produit ne vous appartient pas")

    # Check existing image count
    existing_count = await db.product_images.count_documents({"product_id": product_id})
    if existing_count + len(files) > MAX_IMAGES_PER_PRODUCT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_IMAGES_PER_PRODUCT} images par produit. Actuellement: {existing_count}"
        )

    uploaded = []
    uploaded_cloudinary_ids = []  # Track for rollback
    for i, file in enumerate(files):
        content = await file.read()
        is_valid, err_msg = validate_image_file(file.content_type, len(content))
        if not is_valid:
            if uploaded_cloudinary_ids:
                delete_images(uploaded_cloudinary_ids)
            raise HTTPException(status_code=400, detail=err_msg)

        try:
            result = await upload_image(content, folder=f"washop/products/{product_id}")
        except RuntimeError as e:
            # Upload failed — rollback all previously uploaded images in this batch
            if uploaded_cloudinary_ids:
                delete_images(uploaded_cloudinary_ids)
            raise HTTPException(status_code=502, detail=str(e))

        uploaded_cloudinary_ids.append(result["cloudinary_public_id"])

        img_doc = {
            "id": str(uuid.uuid4()),
            "product_id": product_id,
            "cloudinary_url": result["cloudinary_url"],
            "cloudinary_public_id": result["cloudinary_public_id"],
            "position": existing_count + i,
            "created_at": utc_now()
        }
        try:
            await db.product_images.insert_one(img_doc)
        except Exception:
            # DB insert failed — rollback Cloudinary upload
            delete_image(result["cloudinary_public_id"])
            uploaded_cloudinary_ids.remove(result["cloudinary_public_id"])
            raise HTTPException(
                status_code=500,
                detail="Echec sauvegarde en base. Image Cloudinary annulee."
            )
        uploaded.append({"cloudinary_url": result["cloudinary_url"], "position": existing_count + i})

    return success_response(data=uploaded, message=f"{len(uploaded)} image(s) uploadée(s)")


@router.delete("/{product_id}/images/{image_id}")
async def delete_product_image(product_id: str, image_id: str, user=Depends(get_current_user)):
    if user["role"] not in ("vendor", "admin"):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    image = await db.product_images.find_one({"id": image_id, "product_id": product_id})
    if not image:
        raise HTTPException(status_code=404, detail="Image non trouvée")

    if user["role"] == "vendor":
        product = await db.products.find_one({"_id": ObjectId(product_id), "deleted_at": None})
        if product:
            vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
            if not vendor or str(vendor["_id"]) != product["vendor_id"]:
                raise HTTPException(status_code=403, detail="Accès non autorisé")

    # Delete from Cloudinary
    if image.get("cloudinary_public_id"):
        delete_image(image["cloudinary_public_id"])

    await db.product_images.delete_one({"id": image_id})
    return success_response(message="Image supprimée")

from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import FlashSaleCreate, FeaturedProductCreate
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/flash-sales", tags=["Ventes flash"])


@router.post("")
async def create_flash_sale(data: FlashSaleCreate, user=Depends(role_required("admin"))):
    # Validate product
    try:
        product = await db.products.find_one({"_id": ObjectId(data.product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if data.starts_at >= data.ends_at:
        raise HTTPException(status_code=400, detail="La date de début doit être avant la date de fin")

    # Compute discounted price
    discounted_price = round(product["price"] * (1 - data.discount_percentage / 100), 2)

    flash_doc = {
        "product_id": data.product_id,
        "vendor_id": product["vendor_id"],
        "discount_percentage": data.discount_percentage,
        "discounted_price": discounted_price,
        "starts_at": data.starts_at,
        "ends_at": data.ends_at,
        "is_active": True,
        "created_by": user["id"],
        "created_at": utc_now()
    }
    result = await db.flash_sales.insert_one(flash_doc)
    flash_doc["id"] = str(result.inserted_id)
    flash_doc.pop("_id", None)

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "create_flash_sale",
        "target_type": "flash_sale",
        "target_id": flash_doc["id"],
        "description": f"Vente flash créée: {product['name']} -{data.discount_percentage}%",
        "created_at": utc_now()
    })

    return success_response(data=flash_doc, message="Vente flash créée")


@router.get("")
async def list_flash_sales(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    active_only: bool = Query(True)
):
    page, limit, skip = validate_pagination(page, limit)
    query = {}
    if active_only:
        now = datetime.now(timezone.utc)
        query = {"is_active": True, "starts_at": {"$lte": now}, "ends_at": {"$gte": now}}

    total = await db.flash_sales.count_documents(query)
    sales = await db.flash_sales.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for s in sales:
        s["id"] = str(s.pop("_id"))
        # Enrich with product info
        try:
            product = await db.products.find_one(
                {"_id": ObjectId(s["product_id"])},
                {"_id": 0, "name": 1, "price": 1}
            )
            s["product"] = product
        except Exception:
            s["product"] = None
        result.append(s)

    return paginated_response(result, total, page, limit)


@router.put("/{sale_id}/deactivate")
async def deactivate_flash_sale(sale_id: str, user=Depends(role_required("admin"))):
    try:
        result = await db.flash_sales.update_one(
            {"_id": ObjectId(sale_id)},
            {"$set": {"is_active": False}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID vente flash invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vente flash non trouvée")
    return success_response(message="Vente flash désactivée")


@router.delete("/{sale_id}")
async def delete_flash_sale(sale_id: str, user=Depends(role_required("admin"))):
    try:
        result = await db.flash_sales.delete_one({"_id": ObjectId(sale_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID vente flash invalide")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vente flash non trouvée")
    return success_response(message="Vente flash supprimée")


# ============== FEATURED PRODUCTS ==============

featured_router = APIRouter(prefix="/featured-products", tags=["Produits mis en avant"])


@featured_router.post("")
async def create_featured(data: FeaturedProductCreate, user=Depends(role_required("admin"))):
    try:
        product = await db.products.find_one({"_id": ObjectId(data.product_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    if data.starts_at >= data.ends_at:
        raise HTTPException(status_code=400, detail="La date de début doit être avant la date de fin")

    doc = {
        "product_id": data.product_id,
        "vendor_id": product["vendor_id"],
        "type": data.type.value,
        "starts_at": data.starts_at,
        "ends_at": data.ends_at,
        "created_at": utc_now()
    }
    result = await db.featured_products.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return success_response(data=doc, message="Produit mis en avant")


@featured_router.get("")
async def list_featured(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str = Query(None)
):
    page, limit, skip = validate_pagination(page, limit)
    now = datetime.now(timezone.utc)
    query = {"starts_at": {"$lte": now}, "ends_at": {"$gte": now}}
    if type:
        query["type"] = type

    total = await db.featured_products.count_documents(query)
    items = await db.featured_products.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for item in items:
        item["id"] = str(item.pop("_id"))
        try:
            product = await db.products.find_one(
                {"_id": ObjectId(item["product_id"])},
                {"_id": 0, "name": 1, "price": 1, "vendor_id": 1}
            )
            item["product"] = product
        except Exception:
            item["product"] = None
        result.append(item)

    return paginated_response(result, total, page, limit)


@featured_router.delete("/{featured_id}")
async def delete_featured(featured_id: str, user=Depends(role_required("admin"))):
    try:
        result = await db.featured_products.delete_one({"_id": ObjectId(featured_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID invalide")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit mis en avant non trouvé")
    return success_response(message="Produit retiré des mises en avant")

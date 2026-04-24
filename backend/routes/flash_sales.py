from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from bson import ObjectId
from datetime import datetime, timezone
import logging

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import FlashSaleCreate, FeaturedProductCreate
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now
from utils.email_service import send_flash_sale_announcement

logger = logging.getLogger(__name__)
FRONTEND_URL = __import__("os").environ.get("FRONTEND_URL", "https://washop.netlify.app")

router = APIRouter(prefix="/flash-sales", tags=["Ventes flash"])


async def _broadcast_flash_sale(flash_id: str, product_id: str, product_name: str,
                                 product_price: float, discounted_price: float,
                                 discount_percentage: int, ends_at: datetime,
                                 vendor_name: str):
    """Notify all active clients by email + in-app notification (runs in background)."""
    try:
        product_link = f"{FRONTEND_URL}/products/{product_id}"
        ends_at_str = ends_at.strftime("%d/%m/%Y %Hh%M")

        clients_cursor = db.users.find(
            {"role": "client", "deleted_at": None, "status": {"$ne": "banned"}},
            {"_id": 1, "email": 1, "name": 1}
        )
        message = f"Vente flash -{discount_percentage}% sur {product_name}"
        sent_count = 0
        failed_count = 0
        notif_docs = []
        now = utc_now()

        async for client in clients_cursor:
            client_id = str(client["_id"])
            notif_docs.append({
                "user_id": client_id,
                "message": message,
                "type": "flash_sale",
                "link": f"/products/{product_id}",
                "meta": {"flash_sale_id": flash_id, "product_id": product_id},
                "is_read": False,
                "created_at": now,
            })
            email = client.get("email")
            if not email:
                continue
            try:
                r = await send_flash_sale_announcement(
                    to_email=email,
                    product_name=product_name,
                    vendor_name=vendor_name,
                    original_price=product_price,
                    discounted_price=discounted_price,
                    discount_percentage=discount_percentage,
                    ends_at=ends_at_str,
                    product_link=product_link,
                )
                if r.get("sent"):
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                failed_count += 1
                logger.warning("Flash-sale email failed for %s: %s", email, e)

        if notif_docs:
            await db.notifications.insert_many(notif_docs)
        logger.info(
            "Flash sale broadcast done: flash_id=%s notifications=%d emails_sent=%d emails_failed=%d",
            flash_id, len(notif_docs), sent_count, failed_count,
        )
    except Exception as e:
        logger.exception("Flash sale broadcast error: %s", e)


@router.post("")
async def create_flash_sale(data: FlashSaleCreate, background_tasks: BackgroundTasks, user=Depends(role_required("admin"))):
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

    # Resolve vendor name for the email
    vendor_name = "un vendeur Washop"
    try:
        vendor = await db.vendors.find_one(
            {"_id": ObjectId(product["vendor_id"])},
            {"_id": 0, "shop_name": 1}
        )
        if vendor and vendor.get("shop_name"):
            vendor_name = vendor["shop_name"]
    except Exception:
        pass

    # Broadcast to all clients in background (emails + in-app notifications)
    background_tasks.add_task(
        _broadcast_flash_sale,
        flash_id=flash_doc["id"],
        product_id=data.product_id,
        product_name=product["name"],
        product_price=float(product["price"]),
        discounted_price=discounted_price,
        discount_percentage=data.discount_percentage,
        ends_at=data.ends_at,
        vendor_name=vendor_name,
    )

    return success_response(data=flash_doc, message="Vente flash créée. Notifications en cours d'envoi aux clients.")


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
                {"_id": 0, "name": 1, "price": 1, "images": 1}
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

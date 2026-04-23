from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId
from datetime import datetime, timezone

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import OrderCreate, OrderStatus
from utils.helpers import (
    success_response, error_response, paginated_response, validate_pagination,
    utc_now, generate_whatsapp_url
)

router = APIRouter(prefix="/orders", tags=["Commandes"])


@router.post("")
async def create_order(data: OrderCreate, user=Depends(get_current_user)):
    """Create order and generate WhatsApp redirect URL."""
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent passer des commandes")

    # Idempotency check
    existing = await db.orders.find_one({"idempotency_key": data.idempotency_key})
    if existing:
        existing["id"] = str(existing.pop("_id"))
        return success_response(data=existing, message="Commande déjà existante")

    # Validate vendor
    try:
        vendor = await db.vendors.find_one({"_id": ObjectId(data.vendor_id), "deleted_at": None, "is_active": True})
    except Exception:
        raise HTTPException(status_code=400, detail="ID vendeur invalide")
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé ou inactif")
    if not vendor.get("whatsapp_number"):
        raise HTTPException(status_code=400, detail="Ce vendeur n'a pas configuré son numéro WhatsApp")

    # Validate and collect items
    order_items = []
    whatsapp_items = []
    for item in data.items:
        try:
            product = await db.products.find_one({
                "_id": ObjectId(item.product_id),
                "vendor_id": data.vendor_id,
                "deleted_at": None,
                "is_active": True
            })
        except Exception:
            raise HTTPException(status_code=400, detail=f"ID produit invalide: {item.product_id}")
        if not product:
            raise HTTPException(status_code=404, detail=f"Produit non trouvé: {item.product_id}")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuffisant pour {product['name']}. Disponible: {product.get('stock', 0)}"
            )

        # Check flash sale price
        now = datetime.now(timezone.utc)
        flash = await db.flash_sales.find_one({
            "product_id": item.product_id,
            "is_active": True,
            "starts_at": {"$lte": now},
            "ends_at": {"$gte": now}
        })
        price = flash["discounted_price"] if flash else product["price"]

        order_items.append({
            "product_id": item.product_id,
            "quantity": item.quantity,
            "price_at_time": price,
            "product_name": product["name"]
        })
        whatsapp_items.append({
            "product_id": item.product_id,
            "name": product["name"],
            "quantity": item.quantity,
            "price": price
        })

    # Generate WhatsApp URL
    client_address = user.get("address", "")
    whatsapp_url = generate_whatsapp_url(
        vendor["whatsapp_number"],
        whatsapp_items,
        client_address
    )

    # Create order
    order_doc = {
        "client_id": user["id"],
        "vendor_id": data.vendor_id,
        "status": "pending",
        "whatsapp_url": whatsapp_url,
        "idempotency_key": data.idempotency_key,
        "whatsapp_redirected_at": None,
        "created_at": utc_now()
    }
    result = await db.orders.insert_one(order_doc)
    order_id = str(result.inserted_id)

    # Create order items
    for item in order_items:
        await db.order_items.insert_one({
            "order_id": order_id,
            "product_id": item["product_id"],
            "quantity": item["quantity"],
            "price_at_time": item["price_at_time"],
            "created_at": utc_now()
        })

    # Decrement stock
    for item in data.items:
        await db.products.update_one(
            {"_id": ObjectId(item.product_id)},
            {"$inc": {"stock": -item.quantity}}
        )

    # Notify vendor
    await db.notifications.insert_one({
        "user_id": vendor["user_id"],
        "message": f"Nouvelle commande de {user['name']}",
        "type": "new_order",
        "is_read": False,
        "created_at": utc_now()
    })

    order_doc["id"] = order_id
    order_doc.pop("_id", None)
    order_doc["items"] = order_items

    return success_response(data=order_doc, message="Commande créée. Redirigez vers WhatsApp.")


@router.put("/{order_id}/whatsapp-redirect")
async def mark_whatsapp_redirect(order_id: str, user=Depends(get_current_user)):
    """Mark order as redirected to WhatsApp."""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID commande invalide")
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    if order["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Cette commande ne vous appartient pas")

    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": "whatsapp_redirected", "whatsapp_redirected_at": utc_now()}}
    )
    return success_response(message="Commande marquée comme redirigée vers WhatsApp")


from pydantic import BaseModel

class OrderStatusUpdate(BaseModel):
    status: OrderStatus

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, data: OrderStatusUpdate, user=Depends(get_current_user)):
    """Update order status (vendor or admin)."""
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID commande invalide")
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != order["vendor_id"]:
            raise HTTPException(status_code=403, detail="Cette commande ne concerne pas votre boutique")
    elif user["role"] not in ("admin",):
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    await db.orders.update_one({"_id": ObjectId(order_id)}, {"$set": {"status": data.status.value}})

    # Notify client
    await db.notifications.insert_one({
        "user_id": order["client_id"],
        "message": f"Votre commande a été mise à jour: {data.status.value}",
        "type": "order_status_update",
        "is_read": False,
        "created_at": utc_now()
    })

    return success_response(message=f"Statut de commande mis à jour: {data.status.value}")


@router.get("/me")
async def list_my_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    user=Depends(get_current_user)
):
    """List orders for current user (client or vendor)."""
    page, limit, skip = validate_pagination(page, limit)

    if user["role"] == "client":
        query = {"client_id": user["id"]}
    elif user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor:
            raise HTTPException(status_code=404, detail="Profil vendeur non trouvé")
        query = {"vendor_id": str(vendor["_id"])}
    elif user["role"] == "admin":
        query = {}
    else:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if status:
        query["status"] = status

    total = await db.orders.count_documents(query)
    orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for o in orders:
        o["id"] = str(o.pop("_id"))
        # Fetch items
        items = await db.order_items.find({"order_id": o["id"]}, {"_id": 0}).to_list(100)
        o["items"] = items
        result.append(o)

    return paginated_response(result, total, page, limit)


@router.get("/{order_id}")
async def get_order(order_id: str, user=Depends(get_current_user)):
    try:
        order = await db.orders.find_one({"_id": ObjectId(order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID commande invalide")
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")

    # Access control
    if user["role"] == "client" and order["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if not vendor or str(vendor["_id"]) != order["vendor_id"]:
            raise HTTPException(status_code=403, detail="Accès non autorisé")

    order["id"] = str(order.pop("_id"))
    items = await db.order_items.find({"order_id": order["id"]}, {"_id": 0}).to_list(100)
    order["items"] = items

    return success_response(data=order)

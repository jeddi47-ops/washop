from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import ReviewCreate, ReviewUpdate, ReviewModerate, ReviewType, ReviewStatus
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/reviews", tags=["Avis"])


async def recalculate_ratings(target_id: str, review_type: str):
    """Recalculate average ratings after review approval (application-level trigger)."""
    pipeline = [
        {"$match": {"target_id": target_id, "type": review_type, "status": "approved"}},
        {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    avg = round(result[0]["avg_rating"], 2) if result else 0.0

    if review_type == "product":
        # Find the product's vendor and update avg_product_rating
        product = await db.products.find_one({"_id": ObjectId(target_id)})
        if product:
            vendor_id = product["vendor_id"]
            # Recalculate across all vendor's products
            vendor_products = await db.products.find(
                {"vendor_id": vendor_id, "deleted_at": None}, {"_id": 1}
            ).to_list(None)
            product_ids = [str(p["_id"]) for p in vendor_products]

            pipeline2 = [
                {"$match": {"target_id": {"$in": product_ids}, "type": "product", "status": "approved"}},
                {"$group": {"_id": None, "avg_rating": {"$avg": "$rating"}}}
            ]
            result2 = await db.reviews.aggregate(pipeline2).to_list(1)
            vendor_avg = round(result2[0]["avg_rating"], 2) if result2 else 0.0
            await db.vendors.update_one(
                {"_id": ObjectId(vendor_id)},
                {"$set": {"avg_product_rating": vendor_avg}}
            )
    elif review_type == "vendor":
        await db.vendors.update_one(
            {"_id": ObjectId(target_id)},
            {"$set": {"avg_vendor_rating": avg}}
        )


@router.post("")
async def create_review(data: ReviewCreate, user=Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent laisser des avis")

    # Validate order exists and belongs to client
    try:
        order = await db.orders.find_one({"_id": ObjectId(data.order_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID commande invalide")
    if not order:
        raise HTTPException(status_code=404, detail="Commande non trouvée")
    if order["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Cette commande ne vous appartient pas")

    # Validate target
    if data.type == ReviewType.product:
        try:
            product = await db.products.find_one({"_id": ObjectId(data.target_id), "deleted_at": None})
        except Exception:
            raise HTTPException(status_code=400, detail="ID produit invalide")
        if not product:
            raise HTTPException(status_code=404, detail="Produit non trouvé")
        # Check product is linked to the order
        order_item = await db.order_items.find_one({"order_id": str(order["_id"]), "product_id": data.target_id})
        if not order_item:
            raise HTTPException(status_code=400, detail="Ce produit ne fait pas partie de cette commande")

    elif data.type == ReviewType.vendor:
        if data.target_id != order["vendor_id"]:
            raise HTTPException(status_code=400, detail="Ce vendeur ne correspond pas à cette commande")

    # Check uniqueness constraint
    existing = await db.reviews.find_one({
        "client_id": user["id"],
        "order_id": data.order_id,
        "type": data.type.value
    })
    if existing:
        raise HTTPException(status_code=400, detail="Vous avez déjà laissé un avis de ce type pour cette commande")

    review_doc = {
        "client_id": user["id"],
        "order_id": data.order_id,
        "type": data.type.value,
        "target_id": data.target_id,
        "rating": data.rating,
        "comment": data.comment or "",
        "status": "pending",
        "moderated_by": None,
        "created_at": utc_now(),
        "updated_at": utc_now()
    }
    result = await db.reviews.insert_one(review_doc)
    review_doc["id"] = str(result.inserted_id)
    review_doc.pop("_id", None)

    return success_response(data=review_doc, message="Avis soumis, en attente de modération")


@router.put("/{review_id}")
async def update_review(review_id: str, data: ReviewUpdate, user=Depends(get_current_user)):
    """Client can edit their own review."""
    try:
        review = await db.reviews.find_one({"_id": ObjectId(review_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID avis invalide")
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")
    if review["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Cet avis ne vous appartient pas")

    update_fields = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    update_fields["updated_at"] = utc_now()
    update_fields["status"] = "pending"  # Re-submit for moderation

    await db.reviews.update_one({"_id": ObjectId(review_id)}, {"$set": update_fields})
    updated = await db.reviews.find_one({"_id": ObjectId(review_id)}, {"_id": 0})
    updated["id"] = review_id
    return success_response(data=updated, message="Avis mis à jour, en attente de modération")


@router.put("/{review_id}/moderate")
async def moderate_review(review_id: str, data: ReviewModerate, user=Depends(role_required("admin", "employee"))):
    """Admin/Employee: approve or reject a review."""
    try:
        review = await db.reviews.find_one({"_id": ObjectId(review_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID avis invalide")
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")

    await db.reviews.update_one(
        {"_id": ObjectId(review_id)},
        {"$set": {"status": data.status.value, "moderated_by": user["id"], "updated_at": utc_now()}}
    )

    # Recalculate ratings if approved
    if data.status == ReviewStatus.approved:
        await recalculate_ratings(review["target_id"], review["type"])

    # Notify client
    from utils.email_service import send_review_moderation_result
    client = await db.users.find_one({"_id": ObjectId(review["client_id"])}, {"email": 1})
    if client:
        await send_review_moderation_result(client["email"], data.status.value)

    await db.notifications.insert_one({
        "user_id": review["client_id"],
        "message": f"Votre avis a été {data.status.value}",
        "type": "review_moderation",
        "is_read": False,
        "created_at": utc_now()
    })

    return success_response(message=f"Avis {data.status.value}")


@router.delete("/{review_id}")
async def delete_review(review_id: str, user=Depends(role_required("admin"))):
    """Admin: permanently delete a review."""
    try:
        review = await db.reviews.find_one({"_id": ObjectId(review_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID avis invalide")
    if not review:
        raise HTTPException(status_code=404, detail="Avis non trouvé")

    await db.reviews.delete_one({"_id": ObjectId(review_id)})

    # Recalculate ratings
    await recalculate_ratings(review["target_id"], review["type"])

    await db.admin_logs.insert_one({
        "admin_id": user["id"],
        "action_type": "delete_review",
        "target_type": "review",
        "target_id": review_id,
        "description": "Avis supprimé définitivement",
        "created_at": utc_now()
    })

    return success_response(message="Avis supprimé définitivement")


@router.get("")
async def list_reviews(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    target_id: str = Query(None),
    type: str = Query(None),
    status: str = Query(None),
    user=Depends(get_current_user)
):
    page, limit, skip = validate_pagination(page, limit)
    query = {}

    # Employees can only see reviews for moderation
    if user["role"] == "employee":
        query["status"] = "pending"
    elif user["role"] == "client":
        query["client_id"] = user["id"]
    elif user["role"] == "vendor":
        vendor = await db.vendors.find_one({"user_id": user["id"], "deleted_at": None})
        if vendor:
            query["$or"] = [
                {"target_id": str(vendor["_id"]), "type": "vendor"},
            ]
            # Also include product reviews for vendor's products
            products = await db.products.find(
                {"vendor_id": str(vendor["_id"]), "deleted_at": None}, {"_id": 1}
            ).to_list(None)
            product_ids = [str(p["_id"]) for p in products]
            if product_ids:
                query["$or"].append({"target_id": {"$in": product_ids}, "type": "product"})

    if target_id:
        query["target_id"] = target_id
    if type:
        query["type"] = type
    if status and user["role"] in ("admin", "employee"):
        query["status"] = status

    total = await db.reviews.count_documents(query)
    reviews = await db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for r in reviews:
        r["id"] = str(r.pop("_id"))
        result.append(r)

    return paginated_response(result, total, page, limit)


@router.get("/product/{product_id}")
async def list_product_reviews(
    product_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Public: list approved reviews for a product."""
    page, limit, skip = validate_pagination(page, limit)
    query = {"target_id": product_id, "type": "product", "status": "approved"}

    total = await db.reviews.count_documents(query)
    reviews = await db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for r in reviews:
        r["id"] = str(r.pop("_id"))
        result.append(r)

    return paginated_response(result, total, page, limit)


@router.get("/vendor/{vendor_id}")
async def list_vendor_reviews(
    vendor_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    """Public: list approved reviews for a vendor."""
    page, limit, skip = validate_pagination(page, limit)
    query = {"target_id": vendor_id, "type": "vendor", "status": "approved"}

    total = await db.reviews.count_documents(query)
    reviews = await db.reviews.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for r in reviews:
        r["id"] = str(r.pop("_id"))
        result.append(r)

    return paginated_response(result, total, page, limit)

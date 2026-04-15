from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user
from models.schemas import WishlistAdd
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/wishlist", tags=["Liste de souhaits"])


@router.post("")
async def add_to_wishlist(data: WishlistAdd, user=Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent ajouter aux souhaits")

    # Validate product
    try:
        product = await db.products.find_one({"_id": ObjectId(data.product_id), "deleted_at": None, "is_active": True})
    except Exception:
        raise HTTPException(status_code=400, detail="ID produit invalide")
    if not product:
        raise HTTPException(status_code=404, detail="Produit non trouvé")

    # Check uniqueness
    existing = await db.wishlist.find_one({"client_id": user["id"], "product_id": data.product_id})
    if existing:
        raise HTTPException(status_code=400, detail="Produit déjà dans la liste de souhaits")

    doc = {
        "client_id": user["id"],
        "product_id": data.product_id,
        "created_at": utc_now()
    }
    result = await db.wishlist.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return success_response(data=doc, message="Produit ajouté à la liste de souhaits")


@router.delete("/{product_id}")
async def remove_from_wishlist(product_id: str, user=Depends(get_current_user)):
    result = await db.wishlist.delete_one({"client_id": user["id"], "product_id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit non trouvé dans la liste de souhaits")
    return success_response(message="Produit retiré de la liste de souhaits")


@router.get("")
async def get_wishlist(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(get_current_user)
):
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Accès réservé aux clients")

    page, limit, skip = validate_pagination(page, limit)
    query = {"client_id": user["id"]}

    total = await db.wishlist.count_documents(query)
    items = await db.wishlist.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for item in items:
        item["id"] = str(item.pop("_id"))
        # Enrich with product data
        try:
            product = await db.products.find_one(
                {"_id": ObjectId(item["product_id"]), "deleted_at": None},
                {"_id": 0, "name": 1, "price": 1, "is_active": 1}
            )
            item["product"] = product
        except Exception:
            item["product"] = None
        result.append(item)

    return paginated_response(result, total, page, limit)

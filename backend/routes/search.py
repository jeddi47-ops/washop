from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone

from database import db
from middleware.auth import get_current_user
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/search", tags=["Recherche"])


@router.get("")
async def search_products(
    q: str = Query(..., min_length=1, max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: str = Query(None),
    min_price: float = Query(None),
    max_price: float = Query(None)
):
    """Full-text search on products with vendor ranking (Extra > Premium > Basic)."""
    page, limit, skip = validate_pagination(page, limit)

    # Build search query using MongoDB text search
    query = {
        "$text": {"$search": q},
        "deleted_at": None,
        "is_active": True
    }

    if category_id:
        query["category_id"] = category_id
    if min_price is not None:
        query.setdefault("price", {})["$gte"] = min_price
    if max_price is not None:
        query.setdefault("price", {})["$lte"] = max_price

    # Only show products from active vendors
    active_vendors = await db.vendors.find(
        {"is_active": True, "deleted_at": None},
        {"_id": 1, "subscription_type": 1}
    ).to_list(None)

    vendor_map = {}
    for v in active_vendors:
        vendor_map[str(v["_id"])] = v.get("subscription_type", "basic")

    active_vendor_ids = list(vendor_map.keys())
    query["vendor_id"] = {"$in": active_vendor_ids}

    total = await db.products.count_documents(query)

    # Get results with text score
    products = await db.products.find(
        query,
        {"score": {"$meta": "textScore"}}
    ).sort([("score", {"$meta": "textScore"})]).skip(skip).limit(limit).to_list(limit)

    # Rank by subscription type then text score
    type_rank = {"extra": 0, "premium": 1, "basic": 2}

    result = []
    for p in products:
        p["id"] = str(p.pop("_id"))
        p["text_score"] = p.pop("score", 0)
        p["vendor_rank"] = type_rank.get(vendor_map.get(p.get("vendor_id"), "basic"), 2)

        # Fetch images
        images = await db.product_images.find(
            {"product_id": p["id"]}, {"_id": 0}
        ).sort("position", 1).to_list(5)
        p["images"] = images

        # Check flash sale
        now = datetime.now(timezone.utc)
        flash = await db.flash_sales.find_one({
            "product_id": p["id"],
            "is_active": True,
            "starts_at": {"$lte": now},
            "ends_at": {"$gte": now}
        }, {"_id": 0})
        if flash:
            p["flash_sale"] = {
                "discount_percentage": flash["discount_percentage"],
                "discounted_price": flash["discounted_price"]
            }

        result.append(p)

    # Sort: Extra vendors first, then Premium, then Basic, then by text score
    result.sort(key=lambda x: (x.get("vendor_rank", 2), -x.get("text_score", 0)))

    # Remove internal ranking fields
    for p in result:
        p.pop("vendor_rank", None)
        p.pop("text_score", None)

    # If no results, save to search_misses
    if total == 0:
        trimmed_query = q.strip().lower()
        existing_miss = await db.search_misses.find_one({
            "search_query": trimmed_query,
            "searched_at": {"$gte": utc_now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
        if not existing_miss:
            await db.search_misses.insert_one({
                "search_query": trimmed_query,
                "client_id": None,
                "searched_at": utc_now()
            })

    return paginated_response(result, total, page, limit)


@router.get("/suggestions")
async def search_suggestions(q: str = Query(..., min_length=1, max_length=100)):
    """Get search suggestions based on existing product names."""
    pipeline = [
        {"$match": {
            "deleted_at": None,
            "is_active": True,
            "name": {"$regex": q, "$options": "i"}
        }},
        {"$group": {"_id": "$name"}},
        {"$limit": 10}
    ]
    results = await db.products.aggregate(pipeline).to_list(10)
    suggestions = [r["_id"] for r in results]
    return success_response(data=suggestions)

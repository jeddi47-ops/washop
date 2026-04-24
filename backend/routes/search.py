from fastapi import APIRouter, HTTPException, Depends, Query, Request
from datetime import datetime, timezone
from typing import Optional

from database import db
from middleware.auth import get_current_user
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now
import jwt as pyjwt
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/search", tags=["Recherche"])


def _extract_user_id_optional(request: Request) -> Optional[str]:
    """Try to extract user_id from token without raising — returns None if not authenticated."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        return None
    try:
        payload = pyjwt.decode(token, os.environ["JWT_SECRET"], algorithms=["HS256"])
        return payload.get("sub") if payload.get("type") == "access" else None
    except Exception:
        return None


@router.get("")
async def search_products(
    request: Request,
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

    # If no results, save to search_misses with client_id if authenticated
    if total == 0:
        trimmed_query = q.strip().lower()
        client_id = _extract_user_id_optional(request)
        existing_miss = await db.search_misses.find_one({
            "search_query": trimmed_query,
            "searched_at": {"$gte": utc_now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
        if not existing_miss:
            await db.search_misses.insert_one({
                "search_query": trimmed_query,
                "client_id": client_id,
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


@router.get("/shops")
async def search_shops(
    q: str = Query(..., min_length=1, max_length=200),
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=50),
):
    """Case-insensitive search on vendor shop_name and description.
    Only returns active, non-suspended shops. Ranked by subscription plan
    (Extra > Premium > Basic) so that paying vendors get more visibility."""
    page, limit, skip = validate_pagination(page, limit)

    # Escape user input so regex special chars don't break the query.
    import re
    safe = re.escape(q.strip())
    pattern = {"$regex": safe, "$options": "i"}

    query = {
        "deleted_at": None,
        "is_active": True,
        "$or": [
            {"shop_name": pattern},
            {"description": pattern},
        ],
    }
    total = await db.vendors.count_documents(query)
    shops = await db.vendors.find(query).skip(skip).limit(limit).to_list(limit)

    type_rank = {"extra": 0, "premium": 1, "basic": 2}
    result = []
    for v in shops:
        vid = str(v.pop("_id"))
        # Product counter is expensive per-row but cheap enough at this volume;
        # if it ever becomes a bottleneck we can precompute in the vendor doc.
        product_count = await db.products.count_documents({
            "vendor_id": vid, "deleted_at": None, "is_active": True
        })
        result.append({
            "id": vid,
            "shop_name": v.get("shop_name"),
            "shop_slug": v.get("shop_slug"),
            "description": v.get("description"),
            "avatar_url": v.get("avatar_url"),
            "banner_url": v.get("banner_url"),
            "is_verified": bool(v.get("is_verified")),
            "subscription_type": v.get("subscription_type", "basic"),
            "avg_product_rating": float(v.get("avg_product_rating") or 0),
            "product_count": product_count,
            "_rank": type_rank.get(v.get("subscription_type", "basic"), 2),
        })
    result.sort(key=lambda x: x["_rank"])
    for r in result:
        r.pop("_rank", None)

    return paginated_response(result, total, page, limit)

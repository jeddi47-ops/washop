from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import role_required
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/logs")
async def list_admin_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    action_type: str = Query(None),
    user=Depends(role_required("admin"))
):
    page, limit, skip = validate_pagination(page, limit)
    query = {}
    if action_type:
        query["action_type"] = action_type

    total = await db.admin_logs.count_documents(query)
    logs = await db.admin_logs.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for log in logs:
        log["id"] = str(log.pop("_id"))
        result.append(log)

    return paginated_response(result, total, page, limit)


@router.get("/history")
async def list_history(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user_id: str = Query(None),
    action_type: str = Query(None),
    user=Depends(role_required("admin"))
):
    page, limit, skip = validate_pagination(page, limit)
    query = {}
    if user_id:
        query["user_id"] = user_id
    if action_type:
        query["action_type"] = action_type

    total = await db.history.count_documents(query)
    items = await db.history.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for item in items:
        item["id"] = str(item.pop("_id"))
        result.append(item)

    return paginated_response(result, total, page, limit)


@router.get("/dashboard")
async def admin_dashboard(user=Depends(role_required("admin"))):
    """Admin dashboard with key metrics."""
    total_users = await db.users.count_documents({"deleted_at": None})
    total_vendors = await db.vendors.count_documents({"deleted_at": None})
    active_vendors = await db.vendors.count_documents({"is_active": True, "deleted_at": None})
    total_products = await db.products.count_documents({"deleted_at": None})
    total_orders = await db.orders.count_documents({})
    open_claims = await db.claims.count_documents({"status": {"$in": ["open", "in_progress"]}})
    pending_reviews = await db.reviews.count_documents({"status": "pending"})
    total_keys = await db.access_keys.count_documents({})
    used_keys = await db.access_keys.count_documents({"is_used": True})
    active_flash_sales = await db.flash_sales.count_documents({"is_active": True})

    # Subscription breakdown
    basic_vendors = await db.vendors.count_documents({"subscription_type": "basic", "is_active": True, "deleted_at": None})
    premium_vendors = await db.vendors.count_documents({"subscription_type": "premium", "is_active": True, "deleted_at": None})
    extra_vendors = await db.vendors.count_documents({"subscription_type": "extra", "is_active": True, "deleted_at": None})

    return success_response(data={
        "total_users": total_users,
        "total_vendors": total_vendors,
        "active_vendors": active_vendors,
        "total_products": total_products,
        "total_orders": total_orders,
        "open_claims": open_claims,
        "pending_reviews": pending_reviews,
        "total_keys": total_keys,
        "used_keys": used_keys,
        "active_flash_sales": active_flash_sales,
        "subscription_breakdown": {
            "basic": basic_vendors,
            "premium": premium_vendors,
            "extra": extra_vendors
        }
    })


@router.get("/search-misses")
async def list_search_misses(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    user=Depends(role_required("admin"))
):
    """Admin: view search misses aggregated."""
    page, limit, skip = validate_pagination(page, limit)

    pipeline = [
        {"$group": {
            "_id": {"$toLower": "$search_query"},
            "count": {"$sum": 1},
            "last_searched": {"$max": "$searched_at"}
        }},
        {"$sort": {"count": -1}},
        {"$skip": skip},
        {"$limit": limit}
    ]
    results = await db.search_misses.aggregate(pipeline).to_list(limit)
    total_pipeline = [
        {"$group": {"_id": {"$toLower": "$search_query"}}},
        {"$count": "total"}
    ]
    total_result = await db.search_misses.aggregate(total_pipeline).to_list(1)
    total = total_result[0]["total"] if total_result else 0

    data = [{"query": r["_id"], "count": r["count"], "last_searched": r["last_searched"]} for r in results]

    return paginated_response(data, total, page, limit)

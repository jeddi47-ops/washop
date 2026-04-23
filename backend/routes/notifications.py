from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = Query(False),
    user=Depends(get_current_user)
):
    page, limit, skip = validate_pagination(page, limit)
    query = {"user_id": user["id"]}
    if unread_only:
        query["is_read"] = False

    total = await db.notifications.count_documents(query)
    notifs = await db.notifications.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for n in notifs:
        n["id"] = str(n.pop("_id"))
        result.append(n)

    return paginated_response(result, total, page, limit)


@router.get("/unread-count")
async def get_unread_count(user=Depends(get_current_user)):
    count = await db.notifications.count_documents({"user_id": user["id"], "is_read": False})
    return success_response(data={"count": count})


@router.put("/{notification_id}/read")
async def mark_as_read(notification_id: str, user=Depends(get_current_user)):
    try:
        result = await db.notifications.update_one(
            {"_id": ObjectId(notification_id), "user_id": user["id"]},
            {"$set": {"is_read": True}}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID notification invalide")
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return success_response(message="Notification marquée comme lue")


@router.put("/read-all")
async def mark_all_as_read(user=Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user["id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    return success_response(message="Toutes les notifications marquées comme lues")


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, user=Depends(get_current_user)):
    try:
        result = await db.notifications.delete_one(
            {"_id": ObjectId(notification_id), "user_id": user["id"]}
        )
    except Exception:
        raise HTTPException(status_code=400, detail="ID notification invalide")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    return success_response(message="Notification supprimée")

from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import ClaimCreate, ClaimMessageCreate, ClaimStatus, SenderRole
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now

router = APIRouter(prefix="/claims", tags=["Réclamations"])


@router.post("")
async def create_claim(data: ClaimCreate, user=Depends(get_current_user)):
    if user["role"] != "client":
        raise HTTPException(status_code=403, detail="Seuls les clients peuvent ouvrir une réclamation")

    # Validate vendor
    try:
        vendor = await db.vendors.find_one({"_id": ObjectId(data.vendor_id), "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID vendeur invalide")
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendeur non trouvé")

    # Validate order if provided
    if data.order_id:
        try:
            order = await db.orders.find_one({"_id": ObjectId(data.order_id), "client_id": user["id"]})
        except Exception:
            raise HTTPException(status_code=400, detail="ID commande invalide")
        if not order:
            raise HTTPException(status_code=404, detail="Commande non trouvée")

    claim_doc = {
        "client_id": user["id"],
        "vendor_id": data.vendor_id,
        "order_id": data.order_id,
        "subject": data.subject,
        "message": data.message,
        "status": "open",
        "assigned_to": None,
        "created_at": utc_now()
    }
    result = await db.claims.insert_one(claim_doc)
    claim_id = str(result.inserted_id)

    # Create initial message
    await db.claim_messages.insert_one({
        "claim_id": claim_id,
        "sender_id": user["id"],
        "sender_role": "client",
        "message": data.message,
        "created_at": utc_now()
    })

    claim_doc["id"] = claim_id
    claim_doc.pop("_id", None)

    # Notify admins
    admins = await db.users.find({"role": "admin", "deleted_at": None}, {"_id": 1}).to_list(None)
    for admin in admins:
        await db.notifications.insert_one({
            "user_id": str(admin["_id"]),
            "message": f"Nouvelle réclamation: {data.subject}",
            "type": "new_claim",
            "is_read": False,
            "created_at": utc_now()
        })

    return success_response(data=claim_doc, message="Réclamation ouverte")


@router.post("/{claim_id}/messages")
async def add_claim_message(claim_id: str, data: ClaimMessageCreate, user=Depends(get_current_user)):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID réclamation invalide")
    if not claim:
        raise HTTPException(status_code=404, detail="Réclamation non trouvée")

    # Access control
    if user["role"] == "client" and claim["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if user["role"] == "employee" and claim.get("assigned_to") != user["id"]:
        raise HTTPException(status_code=403, detail="Cette réclamation ne vous est pas assignée")

    if claim["status"] == "closed":
        raise HTTPException(status_code=400, detail="Cette réclamation est fermée")

    sender_role = user["role"]
    if sender_role == "vendor":
        raise HTTPException(status_code=403, detail="Les vendeurs ne peuvent pas répondre aux réclamations")

    msg_doc = {
        "claim_id": claim_id,
        "sender_id": user["id"],
        "sender_role": sender_role,
        "message": data.message,
        "created_at": utc_now()
    }
    result = await db.claim_messages.insert_one(msg_doc)
    msg_doc["id"] = str(result.inserted_id)
    msg_doc.pop("_id", None)

    # Notify the other party
    notify_user_id = claim["client_id"] if user["role"] != "client" else None
    if notify_user_id:
        await db.notifications.insert_one({
            "user_id": notify_user_id,
            "message": f"Nouveau message sur votre réclamation: {claim.get('subject', '')}",
            "type": "claim_message",
            "is_read": False,
            "created_at": utc_now()
        })

    return success_response(data=msg_doc, message="Message ajouté")


@router.put("/{claim_id}/assign")
async def assign_claim(claim_id: str, employee_id: str, user=Depends(role_required("admin"))):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID réclamation invalide")
    if not claim:
        raise HTTPException(status_code=404, detail="Réclamation non trouvée")

    # Validate employee
    try:
        employee = await db.users.find_one({"_id": ObjectId(employee_id), "role": "employee", "deleted_at": None})
    except Exception:
        raise HTTPException(status_code=400, detail="ID employé invalide")
    if not employee:
        raise HTTPException(status_code=404, detail="Employé non trouvé")

    await db.claims.update_one(
        {"_id": ObjectId(claim_id)},
        {"$set": {"assigned_to": employee_id, "status": "in_progress"}}
    )

    # Notify employee
    await db.notifications.insert_one({
        "user_id": employee_id,
        "message": f"Réclamation assignée: {claim.get('subject', '')}",
        "type": "claim_assigned",
        "is_read": False,
        "created_at": utc_now()
    })

    return success_response(message="Réclamation assignée")


@router.put("/{claim_id}/status")
async def update_claim_status(claim_id: str, status: ClaimStatus, user=Depends(role_required("admin", "employee"))):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID réclamation invalide")
    if not claim:
        raise HTTPException(status_code=404, detail="Réclamation non trouvée")

    if user["role"] == "employee" and claim.get("assigned_to") != user["id"]:
        raise HTTPException(status_code=403, detail="Cette réclamation ne vous est pas assignée")

    await db.claims.update_one({"_id": ObjectId(claim_id)}, {"$set": {"status": status.value}})

    # Notify client
    await db.notifications.insert_one({
        "user_id": claim["client_id"],
        "message": f"Votre réclamation '{claim.get('subject', '')}' est maintenant: {status.value}",
        "type": "claim_status_update",
        "is_read": False,
        "created_at": utc_now()
    })

    return success_response(message=f"Statut mis à jour: {status.value}")


@router.get("")
async def list_claims(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: str = Query(None),
    user=Depends(get_current_user)
):
    page, limit, skip = validate_pagination(page, limit)
    query = {}

    if user["role"] == "client":
        query["client_id"] = user["id"]
    elif user["role"] == "employee":
        query["assigned_to"] = user["id"]
    elif user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    if status:
        query["status"] = status

    total = await db.claims.count_documents(query)
    claims = await db.claims.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    result = []
    for c in claims:
        c["id"] = str(c.pop("_id"))
        result.append(c)

    return paginated_response(result, total, page, limit)


@router.get("/{claim_id}")
async def get_claim(claim_id: str, user=Depends(get_current_user)):
    try:
        claim = await db.claims.find_one({"_id": ObjectId(claim_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID réclamation invalide")
    if not claim:
        raise HTTPException(status_code=404, detail="Réclamation non trouvée")

    # Access control
    if user["role"] == "client" and claim["client_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    if user["role"] == "employee" and claim.get("assigned_to") != user["id"]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")

    claim["id"] = str(claim.pop("_id"))

    # Fetch messages
    messages = await db.claim_messages.find({"claim_id": claim_id}).sort("created_at", 1).to_list(None)
    for m in messages:
        m["id"] = str(m.pop("_id"))
    claim["messages"] = messages

    return success_response(data=claim)

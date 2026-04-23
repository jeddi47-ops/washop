from fastapi import APIRouter, HTTPException, Depends, Query
from bson import ObjectId

from database import db
from middleware.auth import get_current_user, role_required
from models.schemas import CategoryCreate, CategoryUpdate
from utils.helpers import success_response, paginated_response, validate_pagination, utc_now, generate_slug

router = APIRouter(prefix="/categories", tags=["Catégories"])


@router.post("")
async def create_category(data: CategoryCreate, user=Depends(role_required("admin", "vendor"))):
    slug = generate_slug(data.name)
    existing = await db.categories.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=400, detail="Cette catégorie existe déjà")

    doc = {
        "name": data.name,
        "slug": slug,
        "created_by": user["id"],
        "created_at": utc_now()
    }
    result = await db.categories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return success_response(data=doc, message="Catégorie créée")


@router.get("")
async def list_categories(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    page, limit, skip = validate_pagination(page, limit)
    total = await db.categories.count_documents({})
    categories = await db.categories.find({}).skip(skip).limit(limit).to_list(limit)

    result = []
    for c in categories:
        c["id"] = str(c.pop("_id"))
        result.append(c)

    return paginated_response(result, total, page, limit)


@router.get("/{category_id}")
async def get_category(category_id: str):
    try:
        cat = await db.categories.find_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID catégorie invalide")
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    cat["id"] = str(cat.pop("_id"))
    return success_response(data=cat)


@router.put("/{category_id}")
async def update_category(category_id: str, data: CategoryUpdate, user=Depends(role_required("admin"))):
    try:
        cat = await db.categories.find_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID catégorie invalide")
    if not cat:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")

    update_fields = {}
    if data.name:
        update_fields["name"] = data.name
        update_fields["slug"] = generate_slug(data.name)

    if not update_fields:
        raise HTTPException(status_code=400, detail="Aucun champ à mettre à jour")

    await db.categories.update_one({"_id": ObjectId(category_id)}, {"$set": update_fields})
    updated = await db.categories.find_one({"_id": ObjectId(category_id)})
    updated["id"] = str(updated.pop("_id"))
    return success_response(data=updated, message="Catégorie mise à jour")


@router.delete("/{category_id}")
async def delete_category(category_id: str, user=Depends(role_required("admin"))):
    try:
        result = await db.categories.delete_one({"_id": ObjectId(category_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="ID catégorie invalide")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Catégorie non trouvée")
    return success_response(message="Catégorie supprimée")

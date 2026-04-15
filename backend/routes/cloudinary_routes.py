from fastapi import APIRouter, Depends, Query
from middleware.auth import get_current_user
from utils.cloudinary_service import generate_upload_signature, is_cloudinary_configured
from utils.helpers import success_response, error_response

router = APIRouter(prefix="/cloudinary", tags=["Cloudinary"])


@router.get("/signature")
async def get_upload_signature(
    folder: str = Query("washop/products"),
    user=Depends(get_current_user)
):
    """Get signed upload parameters for direct frontend upload to Cloudinary."""
    if not is_cloudinary_configured():
        return error_response(
            message="Cloudinary non configuré. Ajoutez les clés API dans .env",
            errors=["CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET requis"]
        )

    sig_data = generate_upload_signature(folder)
    if "error" in sig_data:
        return error_response(message=sig_data["error"])

    return success_response(data=sig_data)


@router.get("/status")
async def cloudinary_status():
    """Check if Cloudinary is configured."""
    return success_response(data={"configured": is_cloudinary_configured()})

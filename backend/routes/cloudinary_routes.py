from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, EmailStr

from middleware.auth import get_current_user, role_required
from utils.cloudinary_service import (
    generate_upload_signature, is_cloudinary_configured, test_cloudinary_upload,
    CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
)
from utils.email_service import is_email_configured, test_sendgrid, FROM_EMAIL
from utils.helpers import success_response, error_response
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cloudinary", tags=["Cloudinary"])


# ============== Signature ==============

@router.get("/signature")
async def get_upload_signature(
    folder: str = Query("washop/products"),
    user=Depends(get_current_user),
):
    """Get signed upload parameters for direct frontend upload to Cloudinary."""
    sig_data = generate_upload_signature(folder)
    return success_response(data=sig_data)


@router.get("/status")
async def cloudinary_status():
    """Check Cloudinary configuration status."""
    return success_response(data={
        "configured": is_cloudinary_configured(),
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key_prefix": CLOUDINARY_API_KEY[:6] + "***",
    })


# ============== Test Cloudinary ==============

@router.post("/test-cloudinary", tags=["Tests"])
async def route_test_cloudinary(user=Depends(role_required("admin"))):
    """
    Upload a 4x4 test PNG to Cloudinary, verify the URL, then delete it.
    Returns the real Cloudinary URL as proof.
    Admin only.
    """
    try:
        result = await test_cloudinary_upload()
        logger.info("Test Cloudinary OK: %s", result)
        return success_response(data=result, message="Cloudinary: OK")
    except Exception as e:
        logger.error("Test Cloudinary ECHOUE: %s", e)
        raise HTTPException(status_code=502, detail=f"Cloudinary: KO - {e}")


# ============== Test SendGrid ==============

class TestEmailRequest(BaseModel):
    to_email: str

@router.post("/test-email", tags=["Tests"])
async def route_test_email(data: TestEmailRequest, user=Depends(role_required("admin"))):
    """
    Send a real test email via SendGrid.
    Verifies status code 202.
    Admin only.
    """
    result = await test_sendgrid(data.to_email)
    logger.info("Test SendGrid: %s", result)
    if result["status"] == "OK":
        return success_response(data=result, message="SendGrid: OK (202 Accepted)")
    else:
        return error_response(
            message=f"SendGrid: KO (code {result['sendgrid_status_code']})",
            errors=[result["detail"], result.get("fix", "")]
        )


# ============== Diagnostic global ==============

@router.get("/diagnostic", tags=["Tests"])
async def diagnostic(user=Depends(role_required("admin"))):
    """Quick diagnostic of all external integrations."""
    return success_response(data={
        "cloudinary": {
            "configured": is_cloudinary_configured(),
            "cloud_name": CLOUDINARY_CLOUD_NAME,
        },
        "sendgrid": {
            "configured": is_email_configured(),
            "from_email": FROM_EMAIL,
        },
    })

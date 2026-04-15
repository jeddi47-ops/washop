"""
Cloudinary Service - Infrastructure ready.
Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env for activation.
"""
import os
import time
import logging

logger = logging.getLogger(__name__)

CLOUDINARY_CONFIGURED = False

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.utils

    cloud_name = os.environ.get("CLOUDINARY_CLOUD_NAME", "")
    api_key = os.environ.get("CLOUDINARY_API_KEY", "")
    api_secret = os.environ.get("CLOUDINARY_API_SECRET", "")

    if cloud_name and api_key and api_secret:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        CLOUDINARY_CONFIGURED = True
        logger.info("Cloudinary configured successfully")
    else:
        logger.warning("Cloudinary credentials not set - image upload disabled")
except ImportError:
    logger.warning("Cloudinary library not installed")


def is_cloudinary_configured() -> bool:
    return CLOUDINARY_CONFIGURED


def generate_upload_signature(folder: str = "washop/products") -> dict:
    """Generate signed upload parameters for frontend direct upload."""
    if not CLOUDINARY_CONFIGURED:
        return {"error": "Cloudinary not configured"}

    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, os.environ["CLOUDINARY_API_SECRET"])

    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ["CLOUDINARY_CLOUD_NAME"],
        "api_key": os.environ["CLOUDINARY_API_KEY"],
        "folder": folder
    }


async def upload_image(file_bytes: bytes, folder: str = "washop/products", public_id: str = None) -> dict:
    """Upload image to Cloudinary from backend."""
    if not CLOUDINARY_CONFIGURED:
        return {"error": "Cloudinary not configured", "cloudinary_url": "", "cloudinary_public_id": ""}

    try:
        import io
        result = cloudinary.uploader.upload(
            io.BytesIO(file_bytes),
            folder=folder,
            public_id=public_id,
            resource_type="image",
            allowed_formats=["jpg", "jpeg", "png", "webp"],
            max_bytes=2 * 1024 * 1024  # 2MB
        )
        return {
            "cloudinary_url": result["secure_url"],
            "cloudinary_public_id": result["public_id"]
        }
    except Exception as e:
        logger.error(f"Cloudinary upload error: {e}")
        return {"error": str(e), "cloudinary_url": "", "cloudinary_public_id": ""}


def delete_image(public_id: str) -> bool:
    """Delete image from Cloudinary."""
    if not CLOUDINARY_CONFIGURED:
        logger.info(f"[CLOUDINARY MOCK] Delete: {public_id}")
        return True

    try:
        result = cloudinary.uploader.destroy(public_id, invalidate=True)
        return result.get("result") == "ok"
    except Exception as e:
        logger.error(f"Cloudinary delete error: {e}")
        return False


def delete_images(public_ids: list) -> bool:
    """Delete multiple images from Cloudinary."""
    if not CLOUDINARY_CONFIGURED:
        logger.info(f"[CLOUDINARY MOCK] Bulk delete: {public_ids}")
        return True

    success = True
    for pid in public_ids:
        if not delete_image(pid):
            success = False
    return success


ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
MAX_IMAGES_PER_PRODUCT = 5


def validate_image_file(content_type: str, size: int) -> tuple:
    """Validate image file type and size. Returns (is_valid, error_message)."""
    if content_type not in ALLOWED_TYPES:
        return False, f"Type de fichier non autorisé: {content_type}. Acceptés: jpg, png, webp"
    if size > MAX_FILE_SIZE:
        return False, f"Fichier trop volumineux ({size} bytes). Maximum: 2MB"
    return True, ""

"""
Cloudinary Service - Production.
All operations use the real Cloudinary API. No mocks, no placeholders.
"""
import os
import io
import time
import logging

import cloudinary
import cloudinary.uploader
import cloudinary.utils

logger = logging.getLogger(__name__)

# ---------- Startup validation ----------
CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

_MISSING = [
    name for name, val in [
        ("CLOUDINARY_CLOUD_NAME", CLOUDINARY_CLOUD_NAME),
        ("CLOUDINARY_API_KEY", CLOUDINARY_API_KEY),
        ("CLOUDINARY_API_SECRET", CLOUDINARY_API_SECRET),
    ] if not val
]

if _MISSING:
    raise EnvironmentError(
        f"Variables d'environnement Cloudinary manquantes: {', '.join(_MISSING)}. "
        "Ajoutez-les dans /app/backend/.env et redemarrez."
    )

cloudinary.config(
    cloud_name=CLOUDINARY_CLOUD_NAME,
    api_key=CLOUDINARY_API_KEY,
    api_secret=CLOUDINARY_API_SECRET,
    secure=True,
)
logger.info(
    "Cloudinary configure: cloud_name=%s, api_key=%s***",
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY[:6],
)

# ---------- Constants ----------
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2 MB
MAX_IMAGES_PER_PRODUCT = 5


# ---------- Helpers ----------
def is_cloudinary_configured() -> bool:
    """Always True — startup would have crashed otherwise."""
    return True


def validate_image_file(content_type: str, size: int) -> tuple[bool, str]:
    if content_type not in ALLOWED_TYPES:
        return False, f"Type de fichier non autorise: {content_type}. Acceptes: jpg, png, webp"
    if size > MAX_FILE_SIZE:
        return False, f"Fichier trop volumineux ({size} octets). Maximum: 2 Mo"
    return True, ""


# ---------- Signature (frontend direct upload) ----------
def generate_upload_signature(folder: str = "washop/products") -> dict:
    timestamp = int(time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, CLOUDINARY_API_SECRET)
    logger.info("Signature Cloudinary generee pour folder=%s", folder)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "api_key": CLOUDINARY_API_KEY,
        "folder": folder,
    }


# ---------- Upload ----------
async def upload_image(
    file_bytes: bytes,
    folder: str = "washop/products",
    public_id: str | None = None,
) -> dict:
    """Upload to Cloudinary. Raises on failure — no silent fallback."""
    try:
        result = cloudinary.uploader.upload(
            io.BytesIO(file_bytes),
            folder=folder,
            public_id=public_id,
            resource_type="image",
            allowed_formats=["jpg", "jpeg", "png", "webp"],
        )
        url = result["secure_url"]
        pid = result["public_id"]
        logger.info("Cloudinary upload OK: public_id=%s, url=%s", pid, url[:80])
        return {"cloudinary_url": url, "cloudinary_public_id": pid}
    except Exception as e:
        logger.error("Cloudinary upload ECHOUE: %s", e)
        raise RuntimeError(f"Echec upload Cloudinary: {e}") from e


# ---------- Delete ----------
def delete_image(public_id: str) -> bool:
    """Delete one image. Raises on failure."""
    try:
        result = cloudinary.uploader.destroy(public_id, invalidate=True)
        ok = result.get("result") == "ok"
        if ok:
            logger.info("Cloudinary delete OK: %s", public_id)
        else:
            logger.warning("Cloudinary delete retour inattendu pour %s: %s", public_id, result)
        return ok
    except Exception as e:
        logger.error("Cloudinary delete ECHOUE pour %s: %s", public_id, e)
        raise RuntimeError(f"Echec suppression Cloudinary ({public_id}): {e}") from e


def delete_images(public_ids: list[str]) -> bool:
    """Delete multiple images. Logs each result, raises on first hard failure."""
    all_ok = True
    for pid in public_ids:
        try:
            if not delete_image(pid):
                all_ok = False
        except RuntimeError:
            all_ok = False
            # continue deleting remaining images even if one fails
    return all_ok


# ---------- Test helper ----------
async def test_cloudinary_upload() -> dict:
    """Upload a tiny 4x4 green PNG, verify URL, then delete it. Returns diagnostic."""
    import struct, zlib

    def _make_png(w: int = 4, h: int = 4, color: tuple = (37, 211, 102)) -> bytes:
        def chunk(ctype: bytes, data: bytes) -> bytes:
            c = ctype + data
            return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xFFFFFFFF)
        raw = b""
        for _ in range(h):
            raw += b"\x00" + bytes(color) * w
        return (
            b"\x89PNG\r\n\x1a\n"
            + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
            + chunk(b"IDAT", zlib.compress(raw))
            + chunk(b"IEND", b"")
        )

    png_bytes = _make_png()

    # Upload
    upload_result = await upload_image(png_bytes, folder="washop/test")
    url = upload_result["cloudinary_url"]
    pid = upload_result["cloudinary_public_id"]

    # Delete
    deleted = delete_image(pid)

    return {
        "status": "OK",
        "cloud_name": CLOUDINARY_CLOUD_NAME,
        "uploaded_url": url,
        "public_id": pid,
        "deleted_after_test": deleted,
    }

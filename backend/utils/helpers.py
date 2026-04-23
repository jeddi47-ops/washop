import re
import math
import urllib.parse
from datetime import datetime, timezone
from typing import Optional


def utc_now():
    return datetime.now(timezone.utc)


def generate_slug(text: str) -> str:
    """Generate URL-friendly slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r'[àáâãäå]', 'a', slug)
    slug = re.sub(r'[èéêë]', 'e', slug)
    slug = re.sub(r'[ìíîï]', 'i', slug)
    slug = re.sub(r'[òóôõö]', 'o', slug)
    slug = re.sub(r'[ùúûü]', 'u', slug)
    slug = re.sub(r'[ýÿ]', 'y', slug)
    slug = re.sub(r'[ñ]', 'n', slug)
    slug = re.sub(r'[ç]', 'c', slug)
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    slug = slug.strip('-')
    return slug


def success_response(data=None, message: str = "Succès"):
    """Standard success response format."""
    return {"success": True, "data": data, "message": message}


def error_response(message: str = "Erreur", errors: list = None):
    """Standard error response format."""
    return {"success": False, "message": message, "errors": errors or []}


def paginated_response(data: list, total: int, page: int, limit: int, message: str = "Succès"):
    """Standard paginated response format."""
    total_pages = math.ceil(total / limit) if limit > 0 else 0
    return {
        "success": True,
        "data": data,
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "message": message
    }


def sanitize_for_whatsapp(text: str) -> str:
    """Sanitize text for WhatsApp URL injection."""
    if not text:
        return ""
    text = re.sub(r'[<>"\']', '', str(text))
    text = text.strip()
    return text


def generate_whatsapp_url(
    whatsapp_number: str,
    items: list,
    client_address: str = "",
    product_url_base: str = ""
) -> str:
    """Generate WhatsApp deep link URL with pre-filled order message."""
    number = re.sub(r'[^0-9+]', '', whatsapp_number)
    if number.startswith('+'):
        number = number[1:]

    lines = [sanitize_for_whatsapp("Nouvelle commande Washop"), ""]
    for item in items:
        name = sanitize_for_whatsapp(item.get("name", ""))
        qty = item.get("quantity", 1)
        price = item.get("price", 0)
        product_id = item.get("product_id", "")
        lines.append(f"Produit : {name}")
        lines.append(f"Quantite : {qty}")
        lines.append(f"Prix : {price}$")
        if product_url_base and product_id:
            lines.append(f"Lien produit : {product_url_base}/products/{product_id}")
        lines.append("")

    if client_address:
        lines.append(f"Adresse client : {sanitize_for_whatsapp(client_address)}")

    message = "\n".join(lines)
    encoded_message = urllib.parse.quote(message)
    return f"https://wa.me/{number}?text={encoded_message}"


def sanitize_input(text: str) -> str:
    """Basic input sanitization to prevent XSS."""
    if not text:
        return text
    text = re.sub(r'<script[^>]*>.*?</script>', '', text, flags=re.IGNORECASE | re.DOTALL)
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&', '&amp;').replace('"', '&quot;')
    return text.strip()


def validate_pagination(page: int = 1, limit: int = 20) -> tuple:
    """Validate and normalize pagination parameters."""
    page = max(1, page)
    limit = min(max(1, limit), 100)
    skip = (page - 1) * limit
    return page, limit, skip

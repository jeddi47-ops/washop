"""
SendGrid Email Service - MOCKED
Infrastructure ready for SendGrid integration.
Replace mock functions with real SendGrid calls when API key is available.
"""
import os
import logging

logger = logging.getLogger(__name__)

SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY", "")


def is_email_configured() -> bool:
    return bool(SENDGRID_API_KEY)


async def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SendGrid or log if not configured."""
    if not is_email_configured():
        logger.info(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
        logger.info(f"[EMAIL MOCK] Content: {html_content[:200]}...")
        return True

    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail, Email, To, Content

        sg = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
        from_email = Email("noreply@washop.com")
        to = To(to_email)
        content = Content("text/html", html_content)
        mail = Mail(from_email, to, subject, content)
        response = sg.client.mail.send.post(request_body=mail.get())
        logger.info(f"Email sent to {to_email}: {response.status_code}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


async def send_product_promotion(vendor_name: str, product_name: str, product_image: str,
                                  price: float, product_link: str, subscriber_emails: list):
    """Send product promotion email to subscribed clients."""
    subject = f"Nouvelle offre de {vendor_name} sur Washop!"
    html = f"""
    <h2>Nouveau produit chez {vendor_name}</h2>
    <p><strong>{product_name}</strong></p>
    <img src="{product_image}" alt="{product_name}" style="max-width:300px"/>
    <p>Prix: {price}$</p>
    <a href="{product_link}">Voir le produit</a>
    """
    for email in subscriber_emails:
        await send_email(email, subject, html)


async def send_subscription_expiry_warning(vendor_email: str, vendor_name: str, expires_at: str):
    """Send subscription expiry warning 3 days before."""
    subject = "Votre abonnement Washop expire bientôt!"
    html = f"""
    <h2>Attention {vendor_name}!</h2>
    <p>Votre abonnement Washop expire le <strong>{expires_at}</strong>.</p>
    <p>Activez une nouvelle clé d'accès pour continuer à vendre sur Washop.</p>
    """
    await send_email(vendor_email, subject, html)


async def send_review_moderation_result(client_email: str, review_status: str, product_name: str = ""):
    """Notify client when review is approved or rejected."""
    status_text = "approuvé" if review_status == "approved" else "rejeté"
    subject = f"Votre avis a été {status_text}"
    html = f"""
    <h2>Résultat de modération</h2>
    <p>Votre avis{f' sur {product_name}' if product_name else ''} a été <strong>{status_text}</strong>.</p>
    """
    await send_email(client_email, subject, html)


async def send_monthly_stats(vendor_email: str, vendor_name: str, stats: dict):
    """Send monthly stats report to vendor."""
    subject = f"Rapport mensuel Washop - {vendor_name}"
    html = f"""
    <h2>Votre rapport mensuel</h2>
    <ul>
        <li>Commandes totales: {stats.get('total_orders', 0)}</li>
        <li>Clics totaux: {stats.get('total_clicks', 0)}</li>
        <li>Taux de conversion: {stats.get('conversion_rate', 0):.1f}%</li>
        <li>Meilleur produit: {stats.get('best_product', 'N/A')}</li>
    </ul>
    """
    await send_email(vendor_email, subject, html)


async def send_weekly_search_misses(vendor_email: str, vendor_name: str, misses: list):
    """Send weekly search misses report to Extra vendors."""
    subject = "Recherches non trouvées cette semaine - Washop"
    items_html = "".join([f"<li>{m['query']} ({m['count']} recherches)</li>" for m in misses])
    html = f"""
    <h2>Top recherches non trouvées cette semaine</h2>
    <p>Bonjour {vendor_name}, voici les produits les plus recherchés sans résultat:</p>
    <ol>{items_html}</ol>
    <p>Ajoutez ces produits à votre boutique pour attirer plus de clients!</p>
    """
    await send_email(vendor_email, subject, html)

"""
SendGrid Email Service - Production.
All operations use the real SendGrid API. No mocks, no silent fallbacks.
"""
import os
import logging

import sendgrid
from sendgrid.helpers.mail import Mail, Email, To, Content

logger = logging.getLogger(__name__)

# ---------- Startup validation ----------
SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY")

if not SENDGRID_API_KEY:
    raise EnvironmentError(
        "Variable d'environnement SENDGRID_API_KEY manquante. "
        "Ajoutez-la dans /app/backend/.env et redemarrez."
    )

FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "noreply@washop.com")

_sg_client = sendgrid.SendGridAPIClient(api_key=SENDGRID_API_KEY)
logger.info("SendGrid configure: api_key=%s***, from=%s", SENDGRID_API_KEY[:12], FROM_EMAIL)


def is_email_configured() -> bool:
    """Always True — startup would have crashed otherwise."""
    return True


# ============== CORE SEND ==============

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """
    Send an email via SendGrid.
    Returns {"status_code": int, "sent": bool, "detail": str}.
    """
    try:
        mail = Mail(
            from_email=Email(FROM_EMAIL),
            to_emails=To(to_email),
            subject=subject,
            html_content=Content("text/html", html_content),
        )
        response = _sg_client.client.mail.send.post(request_body=mail.get())
        code = response.status_code
        sent = code in (200, 201, 202)
        if sent:
            logger.info("SendGrid OK (%d) -> %s | %s", code, to_email, subject)
        else:
            logger.warning(
                "SendGrid reponse inattendue (%d) -> %s | body=%s",
                code, to_email, response.body,
            )
        return {"status_code": code, "sent": sent, "detail": f"HTTP {code}"}
    except Exception as e:
        # Extract SendGrid error body if available
        error_detail = str(e)
        if hasattr(e, "body"):
            try:
                import json as _json
                body = _json.loads(e.body)
                errors = body.get("errors", [])
                if errors:
                    error_detail = errors[0].get("message", str(e))
            except Exception:
                error_detail = getattr(e, "body", str(e))
        status_code = getattr(e, "status_code", 0)
        logger.error("SendGrid ECHOUE (%s) -> %s | %s", status_code, to_email, error_detail)
        return {
            "status_code": status_code,
            "sent": False,
            "detail": error_detail,
        }


# ============== BASE TEMPLATE ==============

def _wrap_html(body_content: str, preview_text: str = "") -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Washop</title>
<!--[if mso]><style>table,td{{font-family:Arial,sans-serif;}}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<span style="display:none;font-size:1px;color:#f4f6f9;max-height:0;overflow:hidden;">{preview_text}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
<tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="background:linear-gradient(135deg,#25D366 0%,#128C7E 100%);padding:28px 32px;text-align:center;">
<h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:700;letter-spacing:-0.3px;">Washop</h1>
<p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Marketplace WhatsApp</p>
</td></tr>
<tr><td style="padding:32px 32px 24px;">
{body_content}
</td></tr>
<tr><td style="padding:0 32px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="border-top:1px solid #e8ecf1;padding-top:20px;">
<p style="margin:0;color:#8898a9;font-size:12px;line-height:1.6;text-align:center;">
Cet email a ete envoye automatiquement par Washop.<br/>
Si vous n'attendiez pas cet email, ignorez-le simplement.
</p>
</td></tr>
</table>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""


def _button(url: str, label: str) -> str:
    return f"""<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td align="center" style="background-color:#25D366;border-radius:8px;">
<a href="{url}" target="_blank" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">
{label}
</a>
</td></tr>
</table>"""


def _stat_card(label: str, value: str) -> str:
    return f"""<td style="padding:12px 8px;text-align:center;width:25%;">
<p style="margin:0 0 4px;font-size:24px;font-weight:700;color:#1a2b3c;">{value}</p>
<p style="margin:0;font-size:12px;color:#8898a9;text-transform:uppercase;letter-spacing:0.5px;">{label}</p>
</td>"""


# ============== PRODUCT PROMOTION ==============

async def send_product_promotion(vendor_name: str, product_name: str, product_image: str,
                                  price: float, product_link: str, subscriber_emails: list):
    subject = f"Nouvelle offre de {vendor_name} sur Washop!"
    body = f"""
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;">Nouveau chez {vendor_name}</h2>
<p style="margin:0 0 20px;color:#5a6b7c;font-size:14px;line-height:1.5;">Un produit qui pourrait vous interesser vient d'etre ajoute.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafb;border-radius:10px;overflow:hidden;margin-bottom:20px;">
<tr>
<td style="width:140px;vertical-align:top;">
<img src="{product_image}" alt="{product_name}" width="140" style="display:block;width:140px;height:140px;object-fit:cover;border-radius:10px 0 0 10px;"/>
</td>
<td style="padding:16px 20px;vertical-align:center;">
<p style="margin:0 0 6px;font-size:17px;font-weight:600;color:#1a2b3c;">{product_name}</p>
<p style="margin:0 0 4px;font-size:13px;color:#8898a9;">Vendu par {vendor_name}</p>
<p style="margin:12px 0 0;font-size:22px;font-weight:700;color:#25D366;">{price:.2f} $</p>
</td>
</tr>
</table>
{_button(product_link, "Voir le produit")}
"""
    html = _wrap_html(body, f"Decouvrez {product_name} chez {vendor_name}")
    results = []
    for email in subscriber_emails:
        r = await send_email(email, subject, html)
        results.append({"email": email, **r})
    return results


# ============== SUBSCRIPTION EXPIRY WARNING ==============

async def send_subscription_expiry_warning(vendor_email: str, vendor_name: str, expires_at: str):
    subject = "Votre abonnement Washop expire dans 3 jours"
    body = f"""
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#fff3e0;font-size:28px;text-align:center;">&#9888;</div>
</div>
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;text-align:center;">Attention, {vendor_name}</h2>
<p style="margin:0 0 20px;color:#5a6b7c;font-size:14px;line-height:1.6;text-align:center;">
Votre abonnement Washop expire le <strong style="color:#e65100;">{expires_at}</strong>.<br/>
Activez une nouvelle cle d'acces pour que votre boutique reste visible.
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fff8e1;border-radius:8px;border-left:4px solid #ffa000;margin-bottom:20px;">
<tr><td style="padding:14px 18px;">
<p style="margin:0;color:#e65100;font-size:13px;line-height:1.5;">
<strong>Que se passe-t-il a l'expiration?</strong><br/>
Votre boutique devient invisible pour les clients. Aucune donnee n'est supprimee &mdash; reactivez a tout moment avec une cle.
</p>
</td></tr>
</table>
{_button('#', "Activer une cle d'acces")}
"""
    html = _wrap_html(body, f"Votre abonnement expire le {expires_at}")
    return await send_email(vendor_email, subject, html)


# ============== REVIEW MODERATION ==============

async def send_review_moderation_result(client_email: str, review_status: str, product_name: str = ""):
    is_approved = review_status == "approved"
    status_text = "approuve" if is_approved else "rejete"
    icon_bg = "#e8f5e9" if is_approved else "#ffebee"
    icon = "&#10004;" if is_approved else "&#10006;"
    icon_color = "#2e7d32" if is_approved else "#c62828"
    subject = f"Votre avis a ete {status_text}"
    context = f" sur <strong>{product_name}</strong>" if product_name else ""
    body = f"""
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:{icon_bg};font-size:24px;color:{icon_color};text-align:center;">{icon}</div>
</div>
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;text-align:center;">Avis {status_text}</h2>
<p style="margin:0 0 16px;color:#5a6b7c;font-size:14px;line-height:1.6;text-align:center;">
Votre avis{context} a ete <strong style="color:{icon_color};">{status_text}</strong> par notre equipe de moderation.
</p>
{"<p style='margin:0;color:#8898a9;font-size:13px;text-align:center;'>Si votre avis a ete rejete, verifiez qu il respecte nos conditions d utilisation et resoumettez-le.</p>" if not is_approved else ""}
"""
    html = _wrap_html(body, f"Votre avis a ete {status_text}")
    return await send_email(client_email, subject, html)


# ============== MONTHLY STATS ==============

async def send_monthly_stats(vendor_email: str, vendor_name: str, stats: dict):
    subject = f"Rapport mensuel Washop - {vendor_name}"
    orders = stats.get('total_orders', 0)
    clicks = stats.get('total_clicks', 0)
    rate = stats.get('conversion_rate', 0)
    best = stats.get('best_product', 'N/A')
    body = f"""
<h2 style="margin:0 0 4px;font-size:20px;color:#1a2b3c;">Bonjour {vendor_name},</h2>
<p style="margin:0 0 24px;color:#5a6b7c;font-size:14px;">Voici le resume de votre activite ce mois-ci.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafb;border-radius:10px;margin-bottom:24px;">
<tr>
{_stat_card("Commandes", str(orders))}
{_stat_card("Clics", str(clicks))}
{_stat_card("Conversion", f"{rate:.1f}%")}
{_stat_card("Top produit", best[:12])}
</tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8f5e9;border-radius:8px;margin-bottom:16px;">
<tr><td style="padding:14px 18px;">
<p style="margin:0;color:#2e7d32;font-size:13px;line-height:1.5;">
<strong>Astuce:</strong> Les vendeurs qui ajoutent au moins 3 nouveaux produits par mois voient leurs clics augmenter de 40% en moyenne.
</p>
</td></tr>
</table>
"""
    html = _wrap_html(body, f"Votre rapport mensuel: {orders} commandes, {clicks} clics")
    return await send_email(vendor_email, subject, html)


# ============== WEEKLY SEARCH MISSES ==============

async def send_weekly_search_misses(vendor_email: str, vendor_name: str, misses: list):
    subject = "Opportunites manquees cette semaine - Washop"
    rows = ""
    for i, m in enumerate(misses):
        bg = "#f8fafb" if i % 2 == 0 else "#ffffff"
        rows += f"""<tr style="background-color:{bg};">
<td style="padding:10px 16px;font-size:14px;color:#1a2b3c;border-bottom:1px solid #eef1f5;">{i+1}. {m['query']}</td>
<td style="padding:10px 16px;font-size:14px;color:#25D366;font-weight:600;text-align:right;border-bottom:1px solid #eef1f5;">{m['count']} recherches</td>
</tr>"""
    body = f"""
<h2 style="margin:0 0 4px;font-size:20px;color:#1a2b3c;">Recherches sans resultat</h2>
<p style="margin:0 0 20px;color:#5a6b7c;font-size:14px;line-height:1.5;">
Bonjour {vendor_name}, voici les produits les plus recherches cette semaine que personne ne vend encore. Une opportunite pour vous!
</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;border:1px solid #eef1f5;margin-bottom:24px;">
<tr style="background-color:#128C7E;">
<td style="padding:10px 16px;font-size:12px;color:#ffffff;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Recherche</td>
<td style="padding:10px 16px;font-size:12px;color:#ffffff;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Volume</td>
</tr>
{rows}
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e3f2fd;border-radius:8px;">
<tr><td style="padding:14px 18px;">
<p style="margin:0;color:#1565c0;font-size:13px;line-height:1.5;">
<strong>Conseil:</strong> Ajoutez ces produits a votre boutique pour capter ces clients en recherche active.
</p>
</td></tr>
</table>
"""
    html = _wrap_html(body, f"{len(misses)} recherches non satisfaites cette semaine")
    return await send_email(vendor_email, subject, html)


# ============== PASSWORD RESET ==============

async def send_password_reset(to_email: str, reset_link: str):
    subject = "Reinitialisation de votre mot de passe Washop"
    body = f"""
<div style="text-align:center;margin-bottom:24px;">
<div style="display:inline-block;width:56px;height:56px;line-height:56px;border-radius:50%;background-color:#e3f2fd;font-size:24px;text-align:center;">&#128274;</div>
</div>
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;text-align:center;">Mot de passe oublie?</h2>
<p style="margin:0 0 20px;color:#5a6b7c;font-size:14px;line-height:1.6;text-align:center;">
Cliquez sur le bouton ci-dessous pour reinitialiser votre mot de passe. Ce lien est valable 1 heure.
</p>
{_button(reset_link, "Reinitialiser le mot de passe")}
<p style="margin:16px 0 0;color:#8898a9;font-size:12px;text-align:center;">Si vous n'avez pas fait cette demande, ignorez cet email.</p>
"""
    html = _wrap_html(body, "Reinitialisation de votre mot de passe")
    return await send_email(to_email, subject, html)


# ============== CLAIM STATUS UPDATE ==============

async def send_claim_status_update(client_email: str, subject_text: str, new_status: str):
    status_labels = {"in_progress": "En cours", "resolved": "Resolue", "closed": "Fermee"}
    label = status_labels.get(new_status, new_status)
    subject = f"Mise a jour de votre reclamation - {label}"
    body = f"""
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;">Reclamation mise a jour</h2>
<p style="margin:0 0 16px;color:#5a6b7c;font-size:14px;line-height:1.6;">
Votre reclamation <strong>"{subject_text}"</strong> est maintenant: <strong style="color:#128C7E;">{label}</strong>.
</p>
"""
    html = _wrap_html(body, f"Reclamation: {label}")
    return await send_email(client_email, subject, html)


# ============== TEST HELPER ==============

async def test_sendgrid(to_email: str) -> dict:
    """Send a real test email and return the diagnostic."""
    subject = "Test Washop - SendGrid fonctionne!"
    body = """
<h2 style="margin:0 0 8px;font-size:20px;color:#1a2b3c;text-align:center;">Test reussi!</h2>
<p style="margin:0;color:#5a6b7c;font-size:14px;line-height:1.6;text-align:center;">
Si vous lisez cet email, l'integration SendGrid de Washop est pleinement operationnelle.
</p>
"""
    html = _wrap_html(body, "Test SendGrid Washop")
    result = await send_email(to_email, subject, html)
    return {
        "status": "OK" if result["sent"] else "KO",
        "to": to_email,
        "from": FROM_EMAIL,
        "sendgrid_status_code": result["status_code"],
        "detail": result["detail"],
        "fix": "" if result["sent"] else (
            "Verifiez dans SendGrid que l'adresse expediteur est verifiee: "
            "https://app.sendgrid.com/settings/sender_auth"
        ),
    }

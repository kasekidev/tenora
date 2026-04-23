import time
from concurrent.futures import Future, ThreadPoolExecutor

import resend
from loguru import logger

from app.config import settings

resend.api_key = settings.RESEND_API_KEY

# Pool partagé — threads réutilisés, file d'attente intégrée.
# max_workers=4 : 4 connexions Resend max en parallèle (ajustable).
_mail_pool = ThreadPoolExecutor(max_workers=4, thread_name_prefix="mail")

# Retry : 3 tentatives max, backoff 1 s → 2 s entre chaque échec.
_MAX_ATTEMPTS  = 3
_RETRY_DELAYS  = (1, 2)   # secondes (len = _MAX_ATTEMPTS - 1)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _logo_url() -> str:
    return "https://pub-02c2b22eb34140d8b19d60d0bd7a9070.r2.dev/static/logo.svg"


def _fmt_price(price: float) -> str:
    try:
        return f"{int(price):,} FCFA".replace(",", "\u202f")
    except Exception:
        return f"{price} FCFA"

def _get_admins() -> list[str]:
    """Liste des emails admins depuis MAIL_ADMIN (séparés par virgule)."""
    raw = getattr(settings, "MAIL_ADMIN", "")
    return [e.strip() for e in raw.split(",") if e.strip()]


# ─── MailResult ───────────────────────────────────────────────────────────────

class MailResult:
    """Résultat retourné par le Future après envoi (ou épuisement des retries)."""
    __slots__ = ("ok", "attempts", "error")

    def __init__(self, ok: bool, attempts: int, error: str | None = None):
        self.ok       = ok
        self.attempts = attempts
        self.error    = error

    def __repr__(self) -> str:
        return (f"MailResult(ok={self.ok}, attempts={self.attempts}"
                + (f", error={self.error!r})" if self.error else ")"))


def _send(to: str | list[str], subject: str, html: str) -> Future:
    """
    Soumet l'envoi au pool avec retry exponentiel.

    Retourne un Future[MailResult] — ignorez-le pour du fire-and-forget,
    ou appelez .result(timeout=…) dans la route si vous voulez confirmer.
    """
    recipients = to if isinstance(to, list) else [to]

    def _worker() -> MailResult:
        last_err: Exception | None = None
        for attempt in range(1, _MAX_ATTEMPTS + 1):
            try:
                resend.Emails.send({
                    "from":    settings.MAIL_FROM,
                    "to":      recipients,
                    "subject": subject,
                    "html":    html,
                })
                logger.success(
                    f"Email envoyé (tentative {attempt}/{_MAX_ATTEMPTS}) "
                    f"| {subject} → {recipients}"
                )
                return MailResult(ok=True, attempts=attempt)
            except Exception as exc:
                last_err = exc
                logger.warning(
                    f"Tentative {attempt}/{_MAX_ATTEMPTS} échouée "
                    f"| {subject} → {recipients} | {exc}"
                )
                if attempt < _MAX_ATTEMPTS:
                    time.sleep(_RETRY_DELAYS[attempt - 1])

        logger.error(
            f"Échec définitif ({_MAX_ATTEMPTS} tentatives) "
            f"| {subject} → {recipients} | {last_err}"
        )
        return MailResult(ok=False, attempts=_MAX_ATTEMPTS, error=str(last_err))

    return _mail_pool.submit(_worker)


# ─── Template HTML ─────────────────────────────────────────────────────────────

def _base(inner: str, preheader: str = "") -> str:
    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    pre = (f'<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">'
           f'{preheader}&nbsp;</div>') if preheader else ""
    return f"""<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch>
  </o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <title>Tenora</title>
</head>
<body style="margin:0;padding:0;background-color:#0F0E0C;
  font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
  {pre}

  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
    style="background:#0F0E0C;min-height:100vh;">
    <tr><td align="center" style="padding:48px 16px 64px;">

      <!-- Inner -->
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0"
        style="max-width:560px;width:100%;">

        <!-- Logo -->
        <tr><td style="padding:0 0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="padding-right:9px;vertical-align:middle;">
                      <img src="{_logo_url()}"
                        width="26" height="26"
                        alt="Tenora"
                        style="display:block;border:0;outline:none;"/>
                    </td>
                    <td style="vertical-align:middle;">
                     <span style="font-size:13px;font-weight:700;letter-spacing:0.22em;
                      text-transform:uppercase;color:#F0EDE8;">TENORA</span>
                    </td>
                  </tr>
                </table>
              </td>
              <td align="right">
                <span style="font-size:11px;color:#555550;letter-spacing:0.06em;">
                  Niamey, Niger
                </span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Card -->
        <tr><td style="background:#1E1D1A;border:1px solid #2A2822;
          border-radius:16px;overflow:hidden;">
          {inner}
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:32px 0 0;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#444440;line-height:1.6;">
            Vous recevez cet email car vous avez un compte sur Tenora.
          </p>
          <p style="margin:0;font-size:12px;color:#444440;">
            <a href="{site_url}" style="color:#12A060;text-decoration:none;">tenora.store</a>
            &nbsp;&middot;&nbsp;
            <a href="{site_url}/mes-commandes" style="color:#555550;text-decoration:none;">
              Mes commandes
            </a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _accent_bar(color_left: str, color_right: str) -> str:
    return (f'<tr><td style="height:3px;background:linear-gradient(90deg,'
            f'{color_left},{color_right});font-size:0;line-height:0;">&nbsp;</td></tr>')


def _header_section(icon_svg: str, icon_bg: str, title: str, subtitle: str) -> str:
    return f"""<tr><td style="padding:40px 40px 0;text-align:center;">
      <div style="display:inline-flex;align-items:center;justify-content:center;
        width:56px;height:56px;border-radius:14px;background:{icon_bg};
        margin-bottom:20px;">
        {icon_svg}
      </div>
      <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;
        color:#F0EDE8;letter-spacing:-0.02em;line-height:1.25;">
        {title}
      </h1>
      <p style="margin:0;font-size:14px;color:#B0AA9E;line-height:1.6;
        max-width:400px;margin:0 auto;">
        {subtitle}
      </p>
    </td></tr>"""


def _divider() -> str:
    return '<tr><td style="padding:28px 40px 0;"><div style="height:1px;background:#2A2822;"></div></td></tr>'


def _detail_table(rows: list[tuple[str, str]]) -> str:
    rows_html = "".join(
        f'<tr>'
        f'<td style="padding:10px 0;border-bottom:1px solid #252320;'
        f'font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;'
        f'color:#666660;width:40%;">{label}</td>'
        f'<td style="padding:10px 0;border-bottom:1px solid #252320;'
        f'font-size:13px;font-weight:500;color:#E8E4DC;text-align:right;">{value}</td>'
        f'</tr>'
        for label, value in rows
    )
    return f"""<tr><td style="padding:24px 40px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
        style="border-collapse:collapse;">
        {rows_html}
      </table>
    </td></tr>"""


def _status_chip(bg: str, color: str, label: str) -> str:
    return (f'<tr><td style="padding:24px 40px 0;text-align:center;">'
            f'<span style="display:inline-block;padding:5px 16px;'
            f'background:{bg};border:1px solid {color}44;border-radius:100px;'
            f'font-size:11px;font-weight:700;letter-spacing:0.1em;'
            f'text-transform:uppercase;color:{color};">{label}</span>'
            f'</td></tr>')


def _info_block(border_color: str, text: str) -> str:
    return (f'<tr><td style="padding:20px 40px 0;">'
            f'<div style="background:{border_color}0D;border-left:3px solid {border_color};'
            f'border-radius:0 8px 8px 0;padding:14px 18px;">'
            f'<p style="margin:0;font-size:13px;color:#9A9590;line-height:1.65;">{text}</p>'
            f'</div></td></tr>')


def _cta_button(url: str, label: str, bg: str = "#12A060", color: str = "#FFFFFF") -> str:
    return (f'<tr><td style="padding:28px 40px 36px;text-align:center;">'
            f'<a href="{url}" style="display:inline-block;padding:13px 32px;'
            f'background:{bg};border-radius:8px;color:{color};'
            f'font-size:13px;font-weight:700;text-decoration:none;'
            f'letter-spacing:0.06em;text-transform:uppercase;">{label}</a>'
            f'</td></tr>')


# ─── SVG icons ────────────────────────────────────────────────────────────────

_ICON_CHECK = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#12A060" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
_ICON_CROSS = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
_ICON_CART  = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61h9.72a2 2 0 001.99-1.61L23 6H6"/></svg>'
_ICON_REFUND= '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>'
_ICON_KEY   = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#12A060" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>'
_ICON_BELL  = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>'
_ICON_IMG   = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>'


# ─── 1. Vérification email ────────────────────────────────────────────────────

def send_otp_email(email: str, code: str) -> Future:
    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    digits = "".join(
        f'<td style="width:44px;height:52px;background:#161614;border:1px solid #2A2822;'
        f'border-radius:8px;text-align:center;vertical-align:middle;'
        f'font-size:24px;font-weight:700;letter-spacing:0;color:#F0EDE8;">'
        f'{c}</td><td style="width:8px;"></td>'
        for c in code
    )
    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#12A060", "#D4AF37")}
      {_header_section(_ICON_KEY, "#12A06015",
        "Vérifiez votre adresse email",
        f"Entrez ce code dans l'application pour activer votre compte {settings.APP_NAME}.")}
      {_divider()}
      <tr><td style="padding:28px 40px 0;text-align:center;">
        <p style="margin:0 0 20px;font-size:11px;font-weight:700;
          letter-spacing:0.1em;text-transform:uppercase;color:#666660;">
          Votre code de vérification
        </p>
        <table role="presentation" cellpadding="0" cellspacing="0"
          style="margin:0 auto;">
          <tr>{digits}</tr>
        </table>
        <p style="margin:20px 0 0;font-size:12px;color:#555550;">
          Expire dans <strong style="color:#B0AA9E;">10 minutes</strong>
        </p>
      </td></tr>
      {_info_block("#666660",
        "Si vous n&rsquo;avez pas cr&eacute;&eacute; de compte sur Tenora, "
        "ignorez simplement cet email.")}
      {_cta_button(site_url, "Aller sur Tenora")}
    </table>"""

    return _send(email, f"Votre code de vérification — {settings.APP_NAME}",
          _base(inner, f"Votre code : {code} — expire dans 10 minutes"))


# ─── 2. Commande créée — client ───────────────────────────────────────────────

def send_order_created(email: str, order_id: int, product_name: str,
                        total: float, payment_method: str) -> Future:
    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    price    = _fmt_price(total)

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#D4AF37", "#12A060")}
      {_header_section(_ICON_CART, "#D4AF3715",
        f"Commande n&deg;{order_id} re&ccedil;ue",
        "Votre commande a bien été enregistrée. Notre équipe va la traiter dans les plus brefs délais.")}
      {_divider()}
      {_detail_table([
          ("Référence",  f"#{order_id}"),
          ("Produit",     product_name),
          ("Total",       price),
          ("Paiement",    payment_method),
          ("Statut",      "En attente de validation"),
      ])}
      {_status_chip("#F59E0B15", "#F59E0B", "En attente")}
      {_info_block("#12A060",
        "Pensez &agrave; joindre votre re&ccedil;u de paiement depuis votre espace commandes "
        "pour acc&eacute;l&eacute;rer le traitement.")}
      {_cta_button(f"{site_url}/mes-commandes", "Suivre ma commande")}
    </table>"""

    return _send(email, f"Commande #{order_id} enregistrée — {settings.APP_NAME}",
          _base(inner, f"Commande #{order_id} confirmée — {price}"))


# ─── 3. Commande complétée — client ───────────────────────────────────────────

def send_order_completed(email: str, order_id: int, product_name: str, total_price: float) -> Future:
    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    price    = _fmt_price(total_price)

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#12A060", "#16C070")}
      {_header_section(_ICON_CHECK, "#12A06015",
        "Commande valid&eacute;e",
        f"Votre commande n&deg;{order_id} a été validée et traitée avec succès. Merci de votre confiance.")}
      {_divider()}
      {_detail_table([
          ("Référence",    f"#{order_id}"),
          ("Produit",       product_name),
          ("Montant payé",  price),
          ("Statut",        "Validé"),
      ])}
      {_status_chip("#12A06018", "#12A060", "Confirmé")}
      {_info_block("#12A060",
        "Un probl&egrave;me avec votre commande&nbsp;? "
        "Contactez notre &eacute;quipe sur WhatsApp, nous r&eacute;pondons sous 30 minutes.")}
      {_cta_button(f"{site_url}/mes-commandes", "Voir mes commandes")}
    </table>"""

    future = _send(email, f"Commande #{order_id} validée — {settings.APP_NAME}",
          _base(inner, f"Commande #{order_id} confirmée — {product_name}"))
    logger.success(f"Mail validation envoyé | order_id={order_id} | email={email}")
    return future


# ─── 4. Commande rejetée — client ─────────────────────────────────────────────

def send_order_rejected(email: str, order_id: int, product_name: str,
                         staff_note: str | None) -> Future:
    site_url   = getattr(settings, "SITE_URL", "https://tenora.store")
    note_block = ""
    if staff_note:
        note_block = f"""<tr><td style="padding:20px 40px 0;">
          <div style="background:#EF444410;border-left:3px solid #EF4444;
            border-radius:0 8px 8px 0;padding:14px 18px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;
              letter-spacing:0.08em;text-transform:uppercase;color:#EF4444;">
              Motif du rejet
            </p>
            <p style="margin:0;font-size:13px;color:#9A9590;line-height:1.6;">
              {staff_note}
            </p>
          </div>
        </td></tr>"""

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#EF4444", "#F87171")}
      {_header_section(_ICON_CROSS, "#EF444415",
        f"Commande n&deg;{order_id} rejet&eacute;e",
        f"Votre commande pour <strong style='color:#E8E4DC;'>{product_name}</strong> n'a pas pu être traitée.")}
      {_divider()}
      {_detail_table([
          ("Référence", f"#{order_id}"),
          ("Produit",    product_name),
          ("Statut",     "Rejeté"),
      ])}
      {note_block}
      {_status_chip("#EF444415", "#EF4444", "Rejeté")}
      {_info_block("#EF4444",
        "Vous pensez qu&rsquo;il s&rsquo;agit d&rsquo;une erreur&nbsp;? "
        "Contactez notre &eacute;quipe sur WhatsApp avant de repasser commande.")}
      {_cta_button(f"{site_url}/boutique", "Retour à la boutique", "#1E1D1A", "#F0EDE8")}
    </table>"""

    future = _send(email, f"Commande #{order_id} rejetée — {settings.APP_NAME}",
          _base(inner, f"Commande #{order_id} non traitée"))
    logger.success(f"Mail rejet envoyé | order_id={order_id} | email={email}")
    return future


# ─── 5. Remboursement — client ────────────────────────────────────────────────

def send_order_refunded(email: str, order_id: int, product_name: str, total_price: float) -> Future:
    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    price    = _fmt_price(total_price)

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#8B5CF6", "#A78BFA")}
      {_header_section(_ICON_REFUND, "#8B5CF615",
        "Remboursement en cours",
        f"Un remboursement pour votre commande n&deg;{order_id} a été initié.")}
      {_divider()}
      {_detail_table([
          ("Référence",        f"#{order_id}"),
          ("Produit",           product_name),
          ("Montant remboursé", price),
          ("Statut",            "Remboursement initié"),
      ])}
      {_status_chip("#8B5CF615", "#8B5CF6", "Remboursé")}
      {_info_block("#8B5CF6",
        "Le remboursement sera effectué via votre mode de paiement initial. "
        "Contactez-nous sur WhatsApp si vous ne le recevez pas sous 24h.")}
      {_cta_button(f"{site_url}/mes-commandes", "Voir mes commandes", "#8B5CF6")}
    </table>"""

    future = _send(email, f"Remboursement commande #{order_id} — {settings.APP_NAME}",
          _base(inner, f"Remboursement #{order_id} — {price}"))
    logger.success(f"Mail remboursement envoyé | order_id={order_id} | email={email}")
    return future


# ─── 6. Nouvelle commande — admins ────────────────────────────────────────────

def send_admin_new_order(order_id: int, user_email: str, product_name: str,
                          total: float, payment_method: str,
                          customer_info: dict | None = None) -> Future | None:
    admins = _get_admins()
    if not admins:
        logger.debug("Aucun MAIL_ADMIN configuré — alerte ignorée")
        return

    site_url = getattr(settings, "SITE_URL", "https://tenora.store")
    price    = _fmt_price(total)

    extra_rows = [
        (k.replace("_", " ").capitalize(), str(v))
        for k, v in (customer_info or {}).items()
    ]

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#D4AF37", "#F59E0B")}
      {_header_section(_ICON_BELL, "#D4AF3715",
        f"Nouvelle commande &mdash; #{order_id}",
        f"Une nouvelle commande vient d&rsquo;&ecirc;tre pass&eacute;e sur {settings.APP_NAME}.")}
      {_divider()}
      {_detail_table([
          ("Client",   user_email),
          ("Produit",  product_name),
          ("Total",    price),
          ("Paiement", payment_method),
      ] + extra_rows)}
      {_cta_button(f"{site_url}/panel/orders/{order_id}/edit",
                   "Traiter dans le panel", "#D4AF37", "#1A1A1A")}
    </table>"""

    future = _send(admins, f"[Tenora] Nouvelle commande #{order_id} — {price}",
          _base(inner, f"#{order_id} · {user_email} · {price}"))
    logger.info(f"Alerte admin envoyée | order_id={order_id} | admins={admins}")
    return future


# ─── 7. Reçu joint — admins ───────────────────────────────────────────────────

def send_admin_screenshot_uploaded(order_id: int, user_email: str,
                                    product_name: str) -> Future | None:
    admins = _get_admins()
    if not admins:
        return

    site_url = getattr(settings, "SITE_URL", "https://tenora.store")

    inner = f"""<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      {_accent_bar("#3B82F6", "#60A5FA")}
      {_header_section(_ICON_IMG, "#3B82F615",
        f"Recu joint &mdash; Commande #{order_id}",
        "Un client vient de joindre son reçu de paiement. La commande est prête à être traitée.")}
      {_divider()}
      {_detail_table([
          ("Commande",       f"#{order_id}"),
          ("Client",          user_email),
          ("Produit",         product_name),
          ("Action requise",  "Valider le reçu"),
      ])}
      {_cta_button(f"{site_url}/panel/orders/{order_id}/edit",
                   "Traiter maintenant", "#3B82F6")}
    </table>"""

    future = _send(admins, f"[Tenora] Reçu joint — Commande #{order_id} à traiter",
          _base(inner, f"Commande #{order_id} — {user_email} — reçu joint"))
    logger.info(f"Alerte screenshot envoyée | order_id={order_id}")
    return future

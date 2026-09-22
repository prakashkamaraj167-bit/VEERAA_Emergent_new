"""Emergent-managed Resend email — order confirmations only.
Recipients come from server-side order records; HTML from server-side templates (G4)."""
import ipaddress
import logging
import os
import re
from html import escape
from html.parser import HTMLParser
from urllib.parse import urlparse

import httpx

logger = logging.getLogger(__name__)

EMAIL_BASE_URL = "https://integrations.emergentagent.com"  # constant — survives deployment
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY", "")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "Veeraa")
EMAIL_REPLY_TO = os.environ.get("EMAIL_REPLY_TO")

_SHORTENERS = ("bit.ly", "tinyurl.com", "t.co", "is.gd", "cutt.ly", "goo.gl", "rebrand.ly")
_CRED_ASK = (
    "reply with your password", "reply with the code", "send your password", "cvv",
    "send us your password", "enter your password below", "confirm your card number",
    "your full card number", "seed phrase", "recovery phrase", "verify your card",
    "social security number", "confirm your bank details",
)
_HOSTISH = re.compile(r"\b(?:https?://)?((?:[a-z0-9-]+\.)+[a-z]{2,})", re.I)


def _host_ok(host: str) -> bool:
    if not host or "xn--" in host:
        return False
    try:
        ipaddress.ip_address(host)
        return False
    except ValueError:
        pass
    return not any(host == s or host.endswith("." + s) for s in _SHORTENERS)


def _same_site(shown: str, real: str) -> bool:
    return shown == real or real.endswith("." + shown) or shown.endswith("." + real)


class _EmailScan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tags, self.urls, self.anchors = set(), [], []
        self._href, self._text = None, []

    def handle_starttag(self, tag, attrs):
        self.tags.add(tag.lower())
        self.urls += [v for k, v in attrs if k.lower() in ("href", "src") and v]
        if tag.lower() == "a":
            self._href = dict((k.lower(), v) for k, v in attrs).get("href")
            self._text = []

    def handle_data(self, data):
        if self._href is not None:
            self._text.append(data)

    def handle_endtag(self, tag):
        if tag.lower() == "a" and self._href is not None:
            self.anchors.append((self._href, "".join(self._text)))
            self._href, self._text = None, []


def _assert_safe_email(subject: str, html: str) -> None:
    scan = _EmailScan()
    scan.feed(html)
    if scan.tags & {"form", "input", "textarea", "select"}:
        raise ValueError("No forms or input fields in email (G2)")
    body = f"{subject}\n{html}".lower()
    for p in _CRED_ASK:
        if p in body:
            raise ValueError(f"Email asks for credentials: {p!r} (G2)")
    for url in scan.urls:
        low = url.strip().lower()
        if low.startswith(("mailto:", "tel:", "cid:", "#")):
            continue
        if not low.startswith("https://"):
            raise ValueError(f"Email links must be https: {url!r} (G3)")
        host = urlparse(low).hostname or ""
        if not _host_ok(host) or urlparse(low).username is not None:
            raise ValueError(f"Unsafe URL: {url!r} (G3)")
    for href, text in scan.anchors:
        real = urlparse(href.strip().lower()).hostname or ""
        if not real:
            continue
        for m in _HOSTISH.finditer(text):
            if not _same_site(m.group(1).lower(), real):
                raise ValueError(f"Anchor text {m.group(1)!r} != host {real!r} (G3)")


async def _send(*, to: str, subject: str, html: str) -> str | None:
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY not set — skipping email send")
        return None
    _assert_safe_email(subject, html)
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if EMAIL_REPLY_TO:
        payload["contact_email"] = EMAIL_REPLY_TO
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{EMAIL_BASE_URL}/api/v1/email/send",
            headers={"X-Email-Key": EMAIL_KEY},
            json=payload,
        )
    resp.raise_for_status()
    return resp.json().get("id")


async def send_order_confirmation(order: dict) -> None:
    """Best-effort. Recipient + content from the server-side order record only."""
    to = order.get("user_email", "")
    if not to:
        return
    rows = "".join(
        f'<tr><td style="padding:6px 0;color:#44403c">{escape(str(i.get("name", "")))} '
        f'&times; {int(i.get("qty", 1))}</td>'
        f'<td style="padding:6px 0;text-align:right;color:#44403c">&#8377;'
        f'{int(round(float(i.get("price", 0)) * int(i.get("qty", 1))))}</td></tr>'
        for i in order.get("items", [])
    )
    subject = f"Your {EMAIL_FROM_NAME} order {order.get('order_number', '')} is confirmed"
    html = (
        '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;'
        'font-family:Arial,Helvetica,sans-serif"><tr><td style="padding:24px">'
        f'<h1 style="font-size:20px;color:#78350f;margin:0 0 4px">{escape(EMAIL_FROM_NAME)}</h1>'
        f'<p style="color:#1c1917">Hi {escape(str(order.get("user_name") or "there"))}, '
        'thank you for your order.</p>'
        f'<p style="color:#1c1917">Your order '
        f'<strong>{escape(str(order.get("order_number", "")))}</strong> is confirmed and paid.</p>'
        '<table role="presentation" width="100%" style="border-top:1px solid #e7e0d6;'
        f'border-bottom:1px solid #e7e0d6;margin:16px 0;padding:8px 0">{rows}</table>'
        f'<p style="font-size:16px;color:#78350f"><strong>Total: &#8377;'
        f'{int(round(float(order.get("total", 0))))}</strong></p>'
        '<p style="color:#57534e">We will notify you as your parcel ships. You can track it '
        'anytime from your Veeraa account using your order number.</p>'
        '<p style="font-size:12px;color:#888;margin-top:24px">Sent by '
        f'{escape(EMAIL_FROM_NAME)}. We never ask for your password or card details by email.'
        '</p></td></tr></table>'
    )
    try:
        await _send(to=to, subject=subject, html=html)
    except Exception as e:  # never let email break checkout
        logger.error(f"Order confirmation email failed: {e}")

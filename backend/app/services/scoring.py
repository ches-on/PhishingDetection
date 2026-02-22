from typing import Dict, Any, List
import re
from .url_utils import extract_urls, domain_of_url, url_has_ip_host, url_is_shortener

URGENT_PATTERNS = [
    r"\burgent\b", r"\bimmediately\b", r"\baction required\b", r"\bverify\b",
    r"\baccount (?:will be )?locked\b", r"\bpassword\b", r"\breset\b",
    r"\bsuspended\b", r"\bfailure\b", r"\bsecurity alert\b"
]

SENSITIVE_PATTERNS = [
    r"\bssn\b", r"\bsocial security\b", r"\bcredit card\b", r"\bbank\b",
    r"\bpin\b", r"\bone[- ]time\b", r"\bverification code\b", r"\blogin\b"
]

DISPLAY_NAME_SPOOF_HINTS = [
    "support", "security", "it", "admin", "billing", "payments"
]

EMAIL_RE = re.compile(r"([a-zA-Z0-9_.+\-]+)@([a-zA-Z0-9\-]+\.[a-zA-Z0-9.\-]+)")

def _find_emails(text: str) -> List[str]:
    return [m.group(0).lower() for m in EMAIL_RE.finditer(text or "")]

def _count_regex_hits(text: str, patterns: List[str]) -> int:
    t = (text or "").lower()
    hits = 0
    for p in patterns:
        if re.search(p, t):
            hits += 1
    return hits

def score_email(parsed: Dict[str, Any]) -> Dict[str, Any]:
    findings = []
    score = 0

    subject = (parsed.get("subject") or "").strip()
    body = (parsed.get("body") or "").strip()
    from_h = (parsed.get("from") or "")
    reply_to = (parsed.get("reply_to") or "")
    headers = parsed.get("headers") or {}

    combined = f"{subject}\n{body}\n{from_h}\n{reply_to}"

    # 1) Urgency language
    urgent_hits = _count_regex_hits(combined, URGENT_PATTERNS)
    if urgent_hits:
        add = min(25, 8 * urgent_hits)
        score += add
        findings.append({
            "code": "URGENT_LANGUAGE",
            "title": "Urgent or threatening language",
            "detail": f"Found {urgent_hits} urgency indicators that can pressure users into quick actions.",
            "severity": "medium" if add < 20 else "high",
        })

    # 2) Requests for sensitive information
    sensitive_hits = _count_regex_hits(combined, SENSITIVE_PATTERNS)
    if sensitive_hits:
        add = min(30, 10 * sensitive_hits)
        score += add
        findings.append({
            "code": "SENSITIVE_REQUEST",
            "title": "Possible request for sensitive information",
            "detail": f"Found {sensitive_hits} indicators of credential or financial data requests.",
            "severity": "high",
        })

    # 3) Reply-To mismatch versus From (basic heuristic)
    from_emails = _find_emails(from_h)
    reply_emails = _find_emails(reply_to)
    if from_emails and reply_emails and (from_emails[0].split("@")[-1] != reply_emails[0].split("@")[-1]):
        score += 20
        findings.append({
            "code": "REPLY_TO_MISMATCH",
            "title": "Reply-To domain differs from From domain",
            "detail": "Attackers often set Reply-To to a different domain to capture responses.",
            "severity": "high",
        })

    # 4) Links analysis
    urls = extract_urls(body)
    suspicious_url_points = 0
    url_details = []
    for u in urls:
        d = domain_of_url(u)
        ip_host = url_has_ip_host(u)
        is_short = url_is_shortener(d)

        if ip_host:
            suspicious_url_points += 15
            url_details.append(f"{u} uses an IP address host.")
        if is_short:
            suspicious_url_points += 10
            url_details.append(f"{u} is a known URL shortener domain ({d}).")

        # https is not proof, but lack of scheme or odd formats are red flags
        if not u.lower().startswith("https://"):
            suspicious_url_points += 5

    if urls:
        add = min(30, suspicious_url_points)
        if add:
            score += add
            findings.append({
                "code": "SUSPICIOUS_LINKS",
                "title": "Suspicious link patterns",
                "detail": " ".join(url_details) if url_details else "Links were found, but no strong red flags were detected.",
                "severity": "medium" if add < 20 else "high",
            })

    # 5) Authentication header hints (very light, since true validation needs DNS or mail gateway)
    auth_results = (headers.get("authentication-results") or "").lower()
    if auth_results:
        if "dkim=fail" in auth_results or "spf=fail" in auth_results or "dmarc=fail" in auth_results:
            score += 25
            findings.append({
                "code": "AUTH_FAIL",
                "title": "SPF, DKIM, or DMARC appears to fail",
                "detail": "Authentication-Results indicates an email authentication failure.",
                "severity": "high",
            })

    # Clamp and verdict
    score = max(0, min(100, score))
    if score >= 70:
        verdict = "high"
    elif score >= 35:
        verdict = "medium"
    else:
        verdict = "low"

    extracted = {
        "subject": subject,
        "from": from_h,
        "reply_to": reply_to,
        "to": parsed.get("to", ""),
        "urls": urls,
        "auth_results": headers.get("authentication-results", ""),
    }

    return {
        "risk_score": score,
        "verdict": verdict,
        "findings": findings,
        "extracted": extracted,
    }
from typing import List, Tuple
from urllib.parse import urlparse
import re
import tldextract

URL_REGEX = re.compile(r"(https?://[^\s<>()\"']+)", re.IGNORECASE)

def extract_urls(text: str) -> List[str]:
    return list(dict.fromkeys(URL_REGEX.findall(text or "")))

def domain_of_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        host = parsed.netloc.split("@")[-1]  # strip userinfo if present
        host = host.split(":")[0]            # strip port
        ext = tldextract.extract(host)
        if not ext.domain:
            return host.lower()
        return f"{ext.domain}.{ext.suffix}".lower()
    except Exception:
        return ""

def url_has_ip_host(url: str) -> bool:
    try:
        host = urlparse(url).netloc.split("@")[-1].split(":")[0]
        # Simple IPv4 check
        parts = host.split(".")
        if len(parts) == 4 and all(p.isdigit() and 0 <= int(p) <= 255 for p in parts):
            return True
        return False
    except Exception:
        return False

def url_is_shortener(domain: str) -> bool:
    shorteners = {
        "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "cutt.ly", "buff.ly"
    }
    return domain in shorteners
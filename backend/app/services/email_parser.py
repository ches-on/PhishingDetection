from typing import Dict, Any, Tuple
from email import policy
from email.parser import BytesParser, Parser

def parse_eml_bytes(eml_bytes: bytes) -> Dict[str, Any]:
    msg = BytesParser(policy=policy.default).parsebytes(eml_bytes)

    subject = msg.get("subject", "") or ""
    from_header = msg.get("from", "") or ""
    reply_to = msg.get("reply-to", "") or ""
    to_header = msg.get("to", "") or ""
    date_header = msg.get("date", "") or ""

    # Extract body text
    body_text = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            disp = str(part.get("Content-Disposition", "") or "")
            if ctype == "text/plain" and "attachment" not in disp.lower():
                try:
                    body_text += part.get_content()
                except Exception:
                    pass
    else:
        try:
            body_text = msg.get_content()
        except Exception:
            body_text = ""

    headers = {}
    for k, v in msg.items():
        headers[k.lower()] = str(v)

    return {
        "subject": subject,
        "from": from_header,
        "reply_to": reply_to,
        "to": to_header,
        "date": date_header,
        "headers": headers,
        "body": body_text or "",
        "raw_preview": (eml_bytes[:4000].decode(errors="ignore")),
    }

def parse_raw_text(raw_text: str) -> Dict[str, Any]:
    # Accept either full RFC email text or plain pasted content.
    # If it looks like it has headers, parse it as an email message.
    has_headers = "from:" in raw_text.lower() and "\n" in raw_text
    if has_headers:
        msg = Parser(policy=policy.default).parsestr(raw_text)
        subject = msg.get("subject", "") or ""
        from_header = msg.get("from", "") or ""
        reply_to = msg.get("reply-to", "") or ""
        to_header = msg.get("to", "") or ""

        body_text = ""
        if msg.is_multipart():
            for part in msg.walk():
                ctype = part.get_content_type()
                disp = str(part.get("Content-Disposition", "") or "")
                if ctype == "text/plain" and "attachment" not in disp.lower():
                    try:
                        body_text += part.get_content()
                    except Exception:
                        pass
        else:
            try:
                body_text = msg.get_content()
            except Exception:
                body_text = ""

        headers = {}
        for k, v in msg.items():
            headers[k.lower()] = str(v)

        return {
            "subject": subject,
            "from": from_header,
            "reply_to": reply_to,
            "to": to_header,
            "headers": headers,
            "body": body_text or "",
            "raw_preview": raw_text[:4000],
        }

    # Treat as simple text
    return {
        "subject": "",
        "from": "",
        "reply_to": "",
        "to": "",
        "headers": {},
        "body": raw_text,
        "raw_preview": raw_text[:4000],
    }
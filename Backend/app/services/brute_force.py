from datetime import datetime, timedelta
from loguru import logger


_attempts: dict = {}

MAX_ATTEMPTS = 5         
BLOCK_DURATION = 15       
WINDOW_DURATION = 10      

def is_blocked(ip: str) -> bool:
    if ip not in _attempts:
        return False

    data = _attempts[ip]

    if "blocked_until" in data:
        if datetime.utcnow() < data["blocked_until"]:
            remaining = (data["blocked_until"] - datetime.utcnow()).seconds // 60
            logger.warning(f"IP bloquée tente d'accéder | ip={ip} | déblocage dans {remaining} min")
            return True
        else:
            del _attempts[ip]
            return False

    return False

def record_failed_attempt(ip: str) -> int:
    now = datetime.utcnow()

    if ip not in _attempts:
        _attempts[ip] = {"count": 0, "first_attempt": now}

    data = _attempts[ip]

    if now - data.get("first_attempt", now) > timedelta(minutes=WINDOW_DURATION):
        _attempts[ip] = {"count": 0, "first_attempt": now}
        data = _attempts[ip]

    data["count"] += 1

    if data["count"] >= MAX_ATTEMPTS:
        data["blocked_until"] = now + timedelta(minutes=BLOCK_DURATION)
        logger.error(f"IP bloquée {BLOCK_DURATION} min après {MAX_ATTEMPTS} tentatives | ip={ip}")

    return data["count"]

def reset_attempts(ip: str):
    if ip in _attempts:
        del _attempts[ip]
from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from app.core.config import settings

# Use bcrypt directly — avoids passlib's bcrypt version compatibility bugs
try:
    import bcrypt as _bcrypt

    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return _bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    def get_password_hash(password: str) -> str:
        salt = _bcrypt.gensalt()
        return _bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

except ImportError:
    # Fallback to passlib if bcrypt package not available
    from passlib.context import CryptContext
    _pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

    def verify_password(plain_password: str, hashed_password: str) -> bool:  # type: ignore
        return _pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(password: str) -> str:  # type: ignore
        return _pwd_context.hash(password)


def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

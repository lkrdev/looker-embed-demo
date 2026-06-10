import base64
import hashlib
import hmac
import os
import random
import string


def generate_external_user_id(length: int = 12) -> str:
    """
    Generates a secure alphanumeric ID (a-zA-Z0-9) of specified length.
    Uses cryptographically secure randomness via random.SystemRandom().
    """
    return "".join(
        random.SystemRandom().choices(string.ascii_letters + string.digits, k=length)
    )


def derive_key(secret: str) -> bytes:
    """Derives a 32-byte cryptographic key from the environment secret using PBKDF2."""
    return hashlib.pbkdf2_hmac(
        "sha256", secret.encode("utf-8"), b"looker-embed-salt", 100000
    )


def encrypt_token(token: str, secret_key: str) -> str:
    """
    Encrypts a token string using a secure stream cipher (CTR mode built from HMAC-SHA256).
    Prepends a 16-byte random IV/nonce. Requires zero external packages.
    """
    if not secret_key:
        raise ValueError("Encryption key is required")

    key = derive_key(secret_key)
    iv = os.urandom(16)

    # Generate keystream via HMAC counter mode
    token_bytes = token.encode("utf-8")
    keystream = bytearray()
    counter = 0
    while len(keystream) < len(token_bytes):
        msg = iv + counter.to_bytes(4, byteorder="big")
        keystream.extend(hmac.new(key, msg, hashlib.sha256).digest())
        counter += 1

    # XOR token bytes with keystream
    encrypted_bytes = bytearray(
        b ^ k for b, k in zip(token_bytes, keystream[: len(token_bytes)])
    )

    # Return urlsafe base64 string
    combined = iv + encrypted_bytes
    return base64.urlsafe_b64encode(combined).decode("utf-8")


def decrypt_token(encrypted_token: str, secret_key: str) -> str:
    """Decrypts a token string encrypted by encrypt_token."""
    if not secret_key:
        raise ValueError("Encryption key is required")

    key = derive_key(secret_key)
    try:
        combined = base64.urlsafe_b64decode(encrypted_token.encode("utf-8"))
    except Exception:
        raise ValueError("Invalid encrypted token encoding")

    if len(combined) < 16:
        raise ValueError("Encrypted token payload too short")

    iv = combined[:16]
    encrypted_bytes = combined[16:]

    # Regenerate keystream
    keystream = bytearray()
    counter = 0
    while len(keystream) < len(encrypted_bytes):
        msg = iv + counter.to_bytes(4, byteorder="big")
        keystream.extend(hmac.new(key, msg, hashlib.sha256).digest())
        counter += 1

    # XOR back to plaintext
    decrypted_bytes = bytearray(
        b ^ k for b, k in zip(encrypted_bytes, keystream[: len(encrypted_bytes)])
    )
    return decrypted_bytes.decode("utf-8")

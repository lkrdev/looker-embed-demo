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

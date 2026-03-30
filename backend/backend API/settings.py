from pathlib import Path
import os

from dotenv import load_dotenv
from cryptography.hazmat.primitives import serialization

load_dotenv()

SNOWFLAKE_CONFIG = {
    "user": os.getenv("SNOWFLAKE_USER"),
    "account": os.getenv("SNOWFLAKE_ACCOUNT"),
    "warehouse": os.getenv("SNOWFLAKE_WAREHOUSE"),
    "database": os.getenv("SNOWFLAKE_DATABASE"),
    "schema": os.getenv("SNOWFLAKE_SCHEMA"),
}

role = os.getenv("SNOWFLAKE_ROLE")
if role:
    SNOWFLAKE_CONFIG["role"] = role

# Prefer key-pair auth when rsa_key.p8 is present; otherwise fall back to password auth.
key_path = Path(__file__).resolve().parent / "rsa_key.p8"
if key_path.exists():
    with open(key_path, "rb") as key_file:
        private_key = serialization.load_pem_private_key(
            key_file.read(),
            password=None,
        )

    SNOWFLAKE_CONFIG["private_key"] = private_key.private_bytes(
        encoding=serialization.Encoding.DER,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
else:
    SNOWFLAKE_CONFIG["password"] = os.getenv("SNOWFLAKE_PASSWORD")
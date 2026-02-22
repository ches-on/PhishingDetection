import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "Phishing Detection API")
    max_upload_bytes: int = int(os.getenv("MAX_UPLOAD_BYTES", "2000000"))

    db_user: str = os.getenv("DB_USER", "root")
    db_pass: str = os.getenv("DB_PASS", "")
    db_host: str = os.getenv("DB_HOST", "127.0.0.1")
    db_port: str = os.getenv("DB_PORT", "3306")
    db_name: str = os.getenv("DB_NAME", "phishing_db")

    cors_origins_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    )

    admin_api_key: str = os.getenv("ADMIN_API_KEY", "")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_origins_raw.split(",") if o.strip()]

    @property
    def database_url(self) -> str:
        password_part = self.db_pass or ""
        return (
            f"mysql+pymysql://{self.db_user}:{password_part}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )


settings = Settings()
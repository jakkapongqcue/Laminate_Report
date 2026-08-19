import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    DB_SERVER: str = os.getenv("DB_SERVER", "192.168.10.99")
    DB_PORT: str = os.getenv("DB_PORT", "1433")
    DB_NAME: str = os.getenv("DB_NAME", "KEP_LOG")
    DB_USER: str = os.getenv("DB_USER", "operation")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "Welcome2026")
   
    @property
    def connection_string(self) -> str:
        return (
                f"DRIVER={{{self.DB_DRIVER}}};"
                f"SERVER={self.DB_SERVER},{self.DB_PORT};"
                f"DATABASE={self.DB_NAME};"
                f"UID={self.DB_USER};"
                f"PWD={self.DB_PASSWORD};"
            )

settings = Settings()

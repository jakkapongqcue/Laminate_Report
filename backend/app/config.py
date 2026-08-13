import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    DB_DRIVER: str = os.getenv("DB_DRIVER", "ODBC Driver 17 for SQL Server")
    DB_SERVER: str = os.getenv("DB_SERVER", "192.168.10.99")
    DB_PORT: str = os.getenv("DB_PORT", "1433")
    DB_NAME: str = os.getenv("DB_NAME", "KEP_LOG")
    DB_USER: str = os.getenv("DB_USER", "operation")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
    DB_USE_WINDOWS_AUTH: bool = os.getenv("DB_USE_WINDOWS_AUTH", "false").lower() == "true"
    
    # Mock fallback disabled - strictly use live production SQL Server
    USE_MOCK_FALLBACK: bool = os.getenv("USE_MOCK_FALLBACK", "false").lower() == "true"



    @property
    def connection_string(self) -> str:
        if self.DB_USE_WINDOWS_AUTH:
            return (
                f"DRIVER={{{self.DB_DRIVER}}};"
                f"SERVER={self.DB_SERVER},{self.DB_PORT};"
                f"DATABASE={self.DB_NAME};"
                "Trusted_Connection=yes;"
            )
        else:
            return (
                f"DRIVER={{{self.DB_DRIVER}}};"
                f"SERVER={self.DB_SERVER},{self.DB_PORT};"
                f"DATABASE={self.DB_NAME};"
                f"UID={self.DB_USER};"
                f"PWD={self.DB_PASSWORD};"
            )

settings = Settings()

import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import logging
from typing import Optional

try:
    from app.config import settings
except ModuleNotFoundError:
    from config import settings


logger = logging.getLogger("laminate_app")

def get_db_connection():
    """
    Attempts to establish a connection to MS SQL Server using pyodbc.
    Returns pyodbc Connection or None if unreachable.
    """
    try:
        import pyodbc
        conn = pyodbc.connect(settings.connection_string, timeout=5)
        return conn
    except Exception as e:
        logger.warning(f"Database connection failed: {e}")
        # No mock fallback: return None and let callers handle the error
        return None

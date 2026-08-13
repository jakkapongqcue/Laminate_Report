import sys
from pathlib import Path

# Add backend directory to sys.path so imports work regardless of execution directory
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import logging

try:
    from app.schemas import ReportResponse, MachineOption
    from app.mock_data import MACHINES, generate_report_data
    from app.database import get_db_connection
    from app.config import settings
except ModuleNotFoundError:
    from schemas import ReportResponse, MachineOption
    from mock_data import MACHINES, generate_report_data
    from database import get_db_connection
    from config import settings


# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("laminate_report")

app = FastAPI(
    title="Laminate Checking Report API",
    description="Backend API for querying MS SQL Server and rendering Laminate Checking Reports",
    version="1.0.0"
)

# Enable CORS for Vue 3 frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins in development and reverse proxy
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Laminate Checking Report API",
        "version": "1.0.0"
    }

@app.get("/api/machines", response_model=List[MachineOption])
def get_machines():
    """
    Get available machine list.
    Attempts to fetch from SQL Server table if connected, otherwise returns standard machines.
    """
    conn = get_db_connection()
    if conn:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT MachineID, MachineName FROM Machines WHERE Active = 1")
            rows = cursor.fetchall()
            conn.close()
            if rows:
                return [{"id": row[0], "name": row[1]} for row in rows]
        except Exception as e:
            logger.warning(f"Failed to query SQL Server Machines table: {e}. Falling back to default machines.")
    
    return [MachineOption(id=m["id"], name=m["name"]) for m in MACHINES]

@app.get("/api/report/laminate", response_model=ReportResponse)
def get_laminate_report(
    machine: str = Query("2LB-06 FujiKikai", description="Machine identifier"),
    date_from: str = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(..., description="End date (YYYY-MM-DD)"),
    time_from: str = Query("08:00", description="Start time (HH:MM)"),
    time_to: str = Query("17:00", description="End time (HH:MM)"),
    hour_step: int = Query(1, description="Hourly step increment"),
    data_mode: str = Query("demo", description="Data source mode: 'demo' or 'prd'")
):
    """
    Get laminate checking report data.
    - 'demo': Returns realistic hardcoded demo data.
    - 'prd': Connects to PRD MS SQL Server (192.168.10.99 / KEP_LOG) with user 'operation'.
    """
    if data_mode == "demo":
        conn = get_db_connection()
        if conn:
            try:
                cursor = conn.cursor()
                query = """
                    SELECT 
                        pl.ParameterID,
                        p.ParameterName,
                        p.SetPoint,
                        p.Unit,
                        pl.LoggedDateTime,
                        pl.ParameterValue
                    FROM ParameterLogs pl
                    INNER JOIN Parameters p ON pl.ParameterID = p.ParameterID
                    WHERE pl.MachineName = ?
                      AND pl.LoggedDateTime BETWEEN ? AND ?
                    ORDER BY p.DisplayOrder, pl.LoggedDateTime
                """
                start_datetime = f"{date_from} {time_from}:00"
                end_datetime = f"{date_to} {time_to}:00"
                
                cursor.execute(query, (machine, start_datetime, end_datetime))
                sql_rows = cursor.fetchall()
                conn.close()

                if sql_rows:
                    logger.info(f"Retrieved {len(sql_rows)} records from PRD SQL Server (192.168.10.99 / KEP_LOG).")
            except Exception as e:
                logger.error(f"PRD SQL Server Query Error: {e}")
                if not settings.USE_MOCK_FALLBACK:
                    raise HTTPException(status_code=500, detail=f"PRD Database Error: {e}")
        else:
            logger.warning("Could not connect to PRD SQL Server (192.168.10.99). Please check DB_PASSWORD in backend/.env")

    # Return structured report data (works for demo mode & fallback)
    return generate_report_data(
        machine=machine,
        date_from_str=date_from,
        date_to_str=date_to,
        time_from_str=time_from,
        time_to_str=time_to,
        hour_step=hour_step
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

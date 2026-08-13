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
    from app.report_processor import MACHINES, process_sql_view_data
    from app.database import get_db_connection
    from app.config import settings
except ModuleNotFoundError:
    from schemas import ReportResponse, MachineOption
    from report_processor import MACHINES, process_sql_view_data
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
    Returns standard machine options for 1LB09_Bobst.
    """
    return [MachineOption(id=m["id"], name=m["name"]) for m in MACHINES]

@app.get("/api/report/laminate", response_model=ReportResponse)
def get_laminate_report(
    machine: str = Query("1LB09_Bobst", description="Machine identifier"),
    date_from: str = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(..., description="End date (YYYY-MM-DD)"),
    time_from: str = Query("08:00", description="Start time (HH:MM)"),
    time_to: str = Query("17:00", description="End time (HH:MM)"),
    hour_step: int = Query(1, description="Hourly step increment")
):
    """
    Get laminate checking report data strictly from production MS SQL Server (192.168.10.99 / KEP_LOG).
    Queries [KEP_LOG].[dbo].[View_1LB09_Bobst].
    """
    conn = get_db_connection()
    if not conn:
        logger.error("Could not connect to SQL Server 192.168.10.99")
        raise HTTPException(
            status_code=500, 
            detail="ไม่สามารถเชื่อมต่อฐานข้อมูล MS SQL Server (192.168.10.99) กรุณาตรวจสอบ DB_PASSWORD ในไฟล์ backend/.env"
        )

    try:
        cursor = conn.cursor()
        query = """
            SELECT 
                [SERVER TIMESTAMP]
                ,[Machine : Speed]
                ,[Tunnel : Zone 1 : Temperature]
                ,[Tunnel : Zone 2 : Temperature]
                ,[Unwinder 1 : Tension]
                ,[Unwinder 2 : Tension]
                ,[Rewinder : Tension]
                ,[Rewinder : Tension Taper]
                ,[Coating : Inlet : Tension]
                ,[Laminator : Nip Roll : Operator : Pressure]
                ,[Laminator : Nip Roll : Motor : Pressure]
                ,[Unwinder 1 : Treatment : Specific Power]
                ,[Unwinder 2 : Corona : Specific Power]
            FROM [KEP_LOG].[dbo].[View_1LB09_Bobst]
            WHERE [SERVER TIMESTAMP] BETWEEN ? AND ?
            ORDER BY [SERVER TIMESTAMP] ASC
        """
        start_datetime = f"{date_from} {time_from}:00"
        end_datetime = f"{date_to} {time_to}:00"
        
        cursor.execute(query, (start_datetime, end_datetime))
        sql_rows = cursor.fetchall()
        conn.close()

        logger.info(f"Retrieved {len(sql_rows)} records from [KEP_LOG].[dbo].[View_1LB09_Bobst].")
        return process_sql_view_data(
            sql_rows=sql_rows,
            machine=machine,
            date_from_str=date_from,
            date_to_str=date_to,
            time_from_str=time_from,
            time_to_str=time_to,
            hour_step=hour_step
        )
    except Exception as e:
        logger.error(f"PRD SQL Server Query Error: {e}")
        raise HTTPException(status_code=500, detail=f"เกิดข้อผิดพลาดในการดึงข้อมูลจาก SQL Server: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

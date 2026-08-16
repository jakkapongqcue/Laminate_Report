import sys
from pathlib import Path

# Add backend directory to sys.path so imports work regardless of execution directory
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime, timedelta
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

@app.get("/api/report/laminate/test", response_model=ReportResponse)
def get_laminate_report_test(
    machine: str = Query("1LB09_Bobst", description="Machine identifier"),
    date_from: str = Query(..., description="Start date (YYYY-MM-DD)"),
    date_to: str = Query(..., description="End date (YYYY-MM-DD)"),
    time_from: str = Query("08:00", description="Start time (HH:MM)"),
    time_to: str = Query("17:00", description="End time (HH:MM)"),
    hour_step: int = Query(1, description="Hourly step increment")
):
    """
    Test endpoint returning synthetic sample data suitable for frontend/data tests.
    Generates synthetic rows with timestamps between the requested range and numeric values
    for mapped columns so the same processing path is exercised without connecting to the DB.

    Flow of work (numbered):
    1. Frontend/API client sends query parameters: machine, date_from, date_to, time_from, time_to, hour_step.
    2. This function converts the input into Python datetime values and validates them.
    3. It creates a list of timestamps from start to end using the step value (hour_step).
    4. For each timestamp, it creates one fake SQL row like: (timestamp, 100, 101, 102, ...)
    5. It calls process_sql_view_data(...) to map the fake SQL rows into the report structure used by the UI.
    6. The final response is a ReportResponse object containing machine info + pages + time columns + parameter rows.

    Example output:
    {
      "machine": "1LB09_Bobst",
      "date_from": "2026-08-15",
      "date_to": "2026-08-15",
      "time_from": "08:00",
      "time_to": "17:00",
      "pages": [
        {
          "page_number": 1,
          "total_pages": 1,
          "date_str": "15/08/2026",
          "time_columns": [
            {"key": "setup", "label": "Set up", "full_datetime": "2026-08-15 Set up"},
            {"key": "time_0800", "label": "08:00 น.", "full_datetime": "2026-08-15 08:00"}
          ],
          "rows": [
            {
              "param_id": 1,
              "name": "Line Speed",
              "set_point": "",
              "unit": "m/min",
              "values": {"time_0800": "100"}
            }
          ]
        }
      ]
    }
    """
    try:
        # 1. รับค่าเริ่มต้นและสิ้นสุดจาก Query params
        start_dt = datetime.strptime(f"{date_from} {time_from}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date_to} {time_to}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date/time format. Use YYYY-MM-DD and HH:MM")

    # 2. ถ้าช่วงเวลาไม่ถูกต้อง ให้ขยับวันถัดไปเพื่อให้มีช่วงที่ใช้งานได้
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    # 3. สร้างลิสต์ timestamp ตามช่วงเวลาและ step อย่างที่ client ส่งมา
    #    เช่น hour_step=1 => [08:00, 09:00, 10:00, ...]
    timestamps = []
    curr = start_dt
    idx = 0
    while curr <= end_dt:
        timestamps.append(curr)
        curr += timedelta(hours=hour_step)
        idx += 1

    # 4. สร้าง SQL row ที่เลียนแบบข้อมูลจริง
    #    โครงสร้าง row = [timestamp, col1, col2, ..., col12]
    #    ตัวอย่าง: ('2026-08-15 08:00:00', 100, 101, 102, ... , 111)
    sql_rows = []
    for i, ts in enumerate(timestamps):
        ts_str = ts.strftime("%Y-%m-%d %H:%M:%S")
        # deterministic synthetic numbers:
        # base = 100 + (i * 3)
        # values = [base + 0, base + 1, ..., base + 11]
        base = 100 + (i * 3)
        cols = [base + j for j in range(12)]
        row = tuple([ts_str] + cols)
        sql_rows.append(row)

    # 5. ส่ง row ที่สร้างขึ้น ไปให้ process_sql_view_data ทำหน้าที่ map ค่าลง report
    return process_sql_view_data(
        sql_rows=sql_rows,
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

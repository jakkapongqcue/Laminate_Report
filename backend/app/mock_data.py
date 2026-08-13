import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta, time
import random
from typing import List, Dict, Any

try:
    from app.schemas import ReportResponse, ReportPageData, TimeColumn, ParameterRow
except ModuleNotFoundError:
    from schemas import ReportResponse, ReportPageData, TimeColumn, ParameterRow


# 21 Parameters matching reference document
STANDARD_PARAMETERS = [
    {"param_id": 1, "name": "Line Speed", "set_point": "120", "unit": "m/min", "type": "numeric"},
    {"param_id": 2, "name": "Temp No. 1", "set_point": "85", "unit": "°C", "type": "numeric"},
    {"param_id": 3, "name": "Temp No. 2", "set_point": "90", "unit": "°C", "type": "numeric"},
    {"param_id": 4, "name": "Temp No. 3", "set_point": "95", "unit": "°C", "type": "numeric"},
    {"param_id": 5, "name": "Temp No. 4", "set_point": "90", "unit": "°C", "type": "numeric"},
    {"param_id": 6, "name": "Temp Tank A", "set_point": "65", "unit": "°C", "type": "numeric"},
    {"param_id": 7, "name": "Temp A, B", "set_point": "70", "unit": "°C", "type": "numeric"},
    {"param_id": 8, "name": "Adhesive Hose A, B", "set_point": "75", "unit": "°C", "type": "numeric"},
    {"param_id": 9, "name": "1st Unwind Tension", "set_point": "15", "unit": "Kg./N", "type": "numeric"},
    {"param_id": 10, "name": "2nd Unwind Tension", "set_point": "15", "unit": "Kg./N", "type": "numeric"},
    {"param_id": 11, "name": "Rewind Tension", "set_point": "20", "unit": "Kg./N", "type": "numeric"},
    {"param_id": 12, "name": "Rewind : Tension Taper", "set_point": "50", "unit": "%", "type": "numeric"},
    {"param_id": 13, "name": "Coating Pressure", "set_point": "3.5", "unit": "Bar/Mpa", "type": "numeric"},
    {"param_id": 14, "name": "Coating : Inlet : Tension", "set_point": "180", "unit": "N", "type": "numeric"},
    {"param_id": 15, "name": "Nip roll Pressure Operator Side", "set_point": "4.0", "unit": "Bar/Mpa", "type": "numeric"},
    {"param_id": 16, "name": "Nip roll Pressure Motor Side", "set_point": "4.0", "unit": "Bar/Mpa", "type": "numeric"},
    {"param_id": 17, "name": "ชุด Smoothing Roll เกลี่ยกาว", "set_point": "ปกติ", "unit": "ปกติ/ไม่ปกติ", "type": "status", "options": ["ปกติ", "ไม่ปกติ"]},
    {"param_id": 18, "name": "Corona Treated Inside (ด้านใน)", "set_point": "มี", "unit": "มี/ไม่มี", "type": "status", "options": ["มี", "ไม่มี"]},
    {"param_id": 19, "name": "Corona Treated Outside (ด้านนอก)", "set_point": "มี", "unit": "มี/ไม่มี", "type": "status", "options": ["มี", "ไม่มี"]},
    {"param_id": 20, "name": "Corona Specific Power (UW1)", "set_point": "1200", "unit": "Watt", "type": "numeric"},
    {"param_id": 21, "name": "Corona Specific Power (UW2)", "set_point": "1200", "unit": "Watt", "type": "numeric"},
]

MACHINES = [
    {"id": "2LB-06", "name": "2LB-06 FujiKikai"},
    {"id": "2LB-01", "name": "2LB-01 Comexi"},
    {"id": "2LB-02", "name": "2LB-02 Nordmeccanica"},
    {"id": "2LB-03", "name": "2LB-03 Super Simplex"},
]

def generate_report_data(
    machine: str,
    date_from_str: str,
    date_to_str: str,
    time_from_str: str,
    time_to_str: str,
    hour_step: int = 1
) -> ReportResponse:
    """
    Generates structured pages and columns based on date/time range.
    Handles overnight cross-day logic by grouping columns by Date or splitting into pages.
    """
    # Parse inputs
    try:
        start_dt = datetime.strptime(f"{date_from_str} {time_from_str}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date_to_str} {time_to_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        # Fallback defaults if parsing fails
        today_str = datetime.now().strftime("%Y-%m-%d")
        start_dt = datetime.strptime(f"{today_str} 08:00", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{today_str} 17:00", "%Y-%m-%d %H:%M")

    # If end_dt <= start_dt (e.g. overnight range on single date picker input), add 1 day to end_dt
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    # Generate all hourly datetime slots
    all_timestamps: List[datetime] = []
    curr_dt = start_dt
    while curr_dt <= end_dt:
        all_timestamps.append(curr_dt)
        curr_dt += timedelta(hours=hour_step)

    # Group timestamps by Date for Pagination (or chunking by max 14 columns per page)
    # Each date or chunk of up to 14 columns gets its own Page
    MAX_COLS_PER_PAGE = 14
    
    # First, cluster by day
    day_clusters: Dict[str, List[datetime]] = {}
    for dt in all_timestamps:
        day_key = dt.strftime("%Y-%m-%d")
        if day_key not in day_clusters:
            day_clusters[day_key] = []
        day_clusters[day_key].append(dt)

    # Break clusters into page-sized chunks
    page_chunks = []
    for day_str, dt_list in day_clusters.items():
        for i in range(0, len(dt_list), MAX_COLS_PER_PAGE):
            page_chunks.append({
                "date_key": day_str,
                "timestamps": dt_list[i : i + MAX_COLS_PER_PAGE]
            })

    total_pages = len(page_chunks)
    pages: List[ReportPageData] = []

    for idx, chunk in enumerate(page_chunks, start=1):
        dt_obj = datetime.strptime(chunk["date_key"], "%Y-%m-%d")
        formatted_date_th = dt_obj.strftime("%d/%m/%Y")
        
        # Build time columns: First column is ALWAYS "Set up", then time slots
        time_cols: List[TimeColumn] = [
            TimeColumn(
                key="setup",
                label="Set up",
                full_datetime=f"{chunk['date_key']} Set up"
            )
        ]
        
        for dt in chunk["timestamps"]:
            time_cols.append(TimeColumn(
                key=dt.strftime("time_%H%M"),
                label=dt.strftime("%H:%M น."),
                full_datetime=dt.strftime("%Y-%m-%d %H:%M")
            ))

        # Build parameter rows with mock readings
        rows: List[ParameterRow] = []
        # Use seed based on machine and timestamp so output is consistent per query
        random.seed(hash(f"{machine}_{chunk['date_key']}"))

        for p in STANDARD_PARAMETERS:
            setup_val = p["set_point"]
            col_values: Dict[str, str] = {}

            for col in time_cols:
                if col.key == "setup":
                    continue
                
                if p["type"] == "numeric":
                    try:
                        sp_float = float(p["set_point"])
                        val = round(sp_float * random.uniform(0.98, 1.02), 1)
                    except ValueError:
                        val = p["set_point"]
                    col_values[col.key] = str(int(val)) if isinstance(val, float) and val.is_integer() else str(val)
                else:
                    col_values[col.key] = p["set_point"]


            rows.append(ParameterRow(
                param_id=p["param_id"],
                name=p["name"],
                set_point=p["set_point"],
                unit=p["unit"],
                setup_val=setup_val,
                values=col_values
            ))

        pages.append(ReportPageData(
            page_number=idx,
            total_pages=total_pages,
            date_str=formatted_date_th,
            time_columns=time_cols,
            rows=rows
        ))

    return ReportResponse(
        machine=machine,
        date_from=date_from_str,
        date_to=date_to_str,
        time_from=time_from_str,
        time_to=time_to_str,
        pages=pages
    )

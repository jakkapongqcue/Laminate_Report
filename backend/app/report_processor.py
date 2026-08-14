import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from datetime import datetime, timedelta
from typing import List, Dict, Any

try:
    from app.schemas import ReportResponse, ReportPageData, TimeColumn, ParameterRow
except ModuleNotFoundError:
    from schemas import ReportResponse, ReportPageData, TimeColumn, ParameterRow


# 21 Parameters for machine 1LB09_Bobst mapped to [KEP_LOG].[dbo].[View_1LB09_Bobst]
# All set_point defaults set to empty string "" (strictly no fake numbers)
STANDARD_PARAMETERS = [
    {"param_id": 1, "name": "Line Speed", "set_point": "", "unit": "m/min", "type": "numeric", "db_column": "Machine : Speed"},
    {"param_id": 2, "name": "Temp No. 1", "set_point": "", "unit": "°C", "type": "numeric", "db_column": "Tunnel : Zone 1 : Temperature"},
    {"param_id": 3, "name": "Temp No. 2", "set_point": "", "unit": "°C", "type": "numeric", "db_column": "Tunnel : Zone 2 : Temperature"},
    {"param_id": 4, "name": "Temp No. 3", "set_point": "", "unit": "°C", "type": "numeric", "db_column": None},
    {"param_id": 5, "name": "Temp No. 4", "set_point": "", "unit": "°C", "type": "numeric", "db_column": None},
    {"param_id": 6, "name": "Temp Tank A", "set_point": "", "unit": "°C", "type": "numeric", "db_column": None},
    {"param_id": 7, "name": "Temp A, B", "set_point": "", "unit": "°C", "type": "numeric", "db_column": None},
    {"param_id": 8, "name": "Adhesive Hose A, B", "set_point": "", "unit": "°C", "type": "numeric", "db_column": None},
    {"param_id": 9, "name": "1st Unwind Tension", "set_point": "", "unit": "Kg./N", "type": "numeric", "db_column": "Unwinder 1 : Tension"},
    {"param_id": 10, "name": "2nd Unwind Tension", "set_point": "", "unit": "Kg./N", "type": "numeric", "db_column": "Unwinder 2 : Tension"},
    {"param_id": 11, "name": "Rewind Tension", "set_point": "", "unit": "Kg./N", "type": "numeric", "db_column": "Rewinder : Tension"},
    {"param_id": 12, "name": "Rewinder : Tension Taper", "set_point": "", "unit": "%", "type": "numeric", "db_column": "Rewinder : Tension Taper"},
    {"param_id": 13, "name": "Coating Pressure", "set_point": "", "unit": "Bar/Mpa", "type": "numeric", "db_column": None},
    {"param_id": 14, "name": "Coating : Inlet : Tension", "set_point": "", "unit": "N", "type": "numeric", "db_column": "Coating : Inlet : Tension"},
    {"param_id": 15, "name": "Nip roll Pressure Operator Side", "set_point": "", "unit": "Bar/Mpa", "type": "numeric", "db_column": "Laminator : Nip Roll : Operator : Pressure"},
    {"param_id": 16, "name": "Nip roll Pressure Motor Side", "set_point": "", "unit": "Bar/Mpa", "type": "numeric", "db_column": "Laminator : Nip Roll : Motor : Pressure"},
    {"param_id": 17, "name": "ชุด Smooting Roll เกลี่ยกาว", "set_point": "", "unit": "ปกติ/ไม่ปกติ", "type": "status", "options": ["ปกติ", "ไม่ปกติ"], "db_column": None},
    {"param_id": 18, "name": "Corona Treated Inside (ด้านใน)", "set_point": "", "unit": "มี/ไม่มี", "type": "status", "options": ["มี", "ไม่มี"], "db_column": None},
    {"param_id": 19, "name": "Corona Treated Outside (ด้านนอก)", "set_point": "", "unit": "มี/ไม่มี", "type": "status", "options": ["มี", "ไม่มี"], "db_column": None},
    {"param_id": 20, "name": "Corona Specific Power (UW1)", "set_point": "", "unit": "Watt", "type": "numeric", "db_column": "Unwinder 1 : Treatment : Specific Power"},
    {"param_id": 21, "name": "Corona Specific Power (UW2)", "set_point": "", "unit": "Watt", "type": "numeric", "db_column": "Unwinder 2 : Corona : Specific Power"},
]

MACHINES = [
    {"id": "1LB09_Bobst", "name": "1LB09 Bobst"}
]

def process_sql_view_data(
    sql_rows: List[Any],
    machine: str,
    date_from_str: str,
    date_to_str: str,
    time_from_str: str,
    time_to_str: str,
    hour_step: int = 1
) -> ReportResponse:
    """
    Transforms SQL query result from [KEP_LOG].[dbo].[View_1LB09_Bobst] into ReportResponse pages.
    Strictly parses database rows without generating fake data.
    """
    COLUMN_INDEX_MAP = {
        "Machine : Speed": 1,
        "Tunnel : Zone 1 : Temperature": 2,
        "Tunnel : Zone 2 : Temperature": 3,
        "Unwinder 1 : Tension": 4,
        "Unwinder 2 : Tension": 5,
        "Rewinder : Tension": 6,
        "Rewinder : Tension Taper": 7,
        "Coating : Inlet : Tension": 8,
        "Laminator : Nip Roll : Operator : Pressure": 9,
        "Laminator : Nip Roll : Motor : Pressure": 10,
        "Unwinder 1 : Treatment : Specific Power": 11,
        "Unwinder 2 : Corona : Specific Power": 12,
    }

    # Build sorted list of (datetime, row) for nearest-neighbor lookup
    # This handles real-world cases where DB records are at irregular intervals
    # e.g. target = 10:00 but DB has 10:12 -> still matched within tolerance
    MATCH_TOLERANCE_MINUTES = 30  # Accept records within ±30 min of target time

    timestamp_list: List[tuple] = []  # list of (datetime_obj, row)
    for r in sql_rows:
        if not r or r[0] is None:
            continue
        dt_val = r[0]
        if isinstance(dt_val, str):
            try:
                dt_obj = datetime.strptime(dt_val, "%Y-%m-%d %H:%M:%S")
            except ValueError:
                try:
                    dt_obj = datetime.strptime(dt_val, "%Y-%m-%d %H:%M")
                except ValueError:
                    continue
        else:
            dt_obj = dt_val
        timestamp_list.append((dt_obj, r))

    # Sort once by datetime for efficient nearest lookup
    timestamp_list.sort(key=lambda x: x[0])

    def find_nearest_row(target_dt: datetime):
        """Return (actual_datetime, row) for the DB row whose timestamp is closest
        to target_dt, within MATCH_TOLERANCE_MINUTES.
        Returns (None, None) if no match found.
        actual_datetime is the real DB timestamp, used to label the column header."""
        best_row = None
        best_actual_dt = None
        best_delta = timedelta(minutes=MATCH_TOLERANCE_MINUTES)  #timedelta is used to represent the difference between two datetime objects 
        for dt_obj, row in timestamp_list:
            delta = abs(dt_obj - target_dt)
            if delta <= best_delta:
                best_delta = delta
                best_row = row
                best_actual_dt = dt_obj
            elif dt_obj > target_dt + timedelta(minutes=MATCH_TOLERANCE_MINUTES):
                # Since list is sorted, no need to keep scanning
                break
        return best_actual_dt, best_row

    try:
        start_dt = datetime.strptime(f"{date_from_str} {time_from_str}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date_to_str} {time_to_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        today_str = datetime.now().strftime("%Y-%m-%d")
        start_dt = datetime.strptime(f"{today_str} 08:00", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{today_str} 17:00", "%Y-%m-%d %H:%M")

    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    all_timestamps: List[datetime] = []
    curr_dt = start_dt
    while curr_dt <= end_dt:
        all_timestamps.append(curr_dt)
        curr_dt += timedelta(hours=hour_step)

    MAX_COLS_PER_PAGE = 14
    day_clusters: Dict[str, List[datetime]] = {}
    for dt in all_timestamps:
        day_key = dt.strftime("%Y-%m-%d")
        if day_key not in day_clusters:
            day_clusters[day_key] = []
        day_clusters[day_key].append(dt)

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
        
        time_cols: List[TimeColumn] = [
            TimeColumn(
                key="setup",
                label="Set up",
                full_datetime=f"{chunk['date_key']} Set up"
            )
        ]
        
        for dt in chunk["timestamps"]:
            # Find actual DB timestamp nearest to this target slot
            actual_dt, _ = find_nearest_row(dt)
            # Display the real recorded time if found, otherwise fall back to target
            display_dt = actual_dt if actual_dt is not None else dt
            time_cols.append(TimeColumn(
                key=dt.strftime("time_%H%M"),
                label=display_dt.strftime("%H:%M น."),
                full_datetime=display_dt.strftime("%Y-%m-%d %H:%M")
            ))

        rows: List[ParameterRow] = []
        for p in STANDARD_PARAMETERS:
            setup_val = ""
            col_values: Dict[str, str] = {}

            for col in time_cols:
                if col.key == "setup":
                    continue
                
                # If parameter has no mapped column in View_1LB09_Bobst, leave it empty
                if not p["db_column"] or p["db_column"] not in COLUMN_INDEX_MAP:
                    col_values[col.key] = ""
                    continue
                
                col_idx = COLUMN_INDEX_MAP[p["db_column"]]
                # col.full_datetime is already the actual DB datetime (set when building time_cols)
                try:
                    col_dt = datetime.strptime(col.full_datetime, "%Y-%m-%d %H:%M")
                except ValueError:
                    col_values[col.key] = ""
                    continue

                # Re-use nearest-neighbor lookup with actual col datetime
                _, matched_row = find_nearest_row(col_dt)
                if matched_row and col_idx < len(matched_row) and matched_row[col_idx] is not None:
                    raw_val = matched_row[col_idx]
                    if isinstance(raw_val, (int, float)):
                        col_values[col.key] = str(int(raw_val)) if float(raw_val).is_integer() else str(round(float(raw_val), 1))
                    else:
                        col_values[col.key] = str(raw_val)
                else:
                    col_values[col.key] = ""

            rows.append(ParameterRow(
                param_id=p["param_id"],
                name=p["name"],
                set_point="",
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

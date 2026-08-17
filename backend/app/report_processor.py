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
    hour_step: int = 1,
    # setup_target_dt is the datetime chosen by user for the "Set up" column (can be None)
    setup_target_dt: Any = None,
    # setup_row is an optional DB row fetched specifically for the setup time (can be None)
    setup_row: Any = None
) -> ReportResponse:
    """
    Transforms SQL query result from [KEP_LOG].[dbo].[View_1LB09_Bobst] into ReportResponse pages.
    Strictly parses database rows without generating fake data.

    Flow of work (numbered):
    1. Receive raw SQL rows from the API or database query.
    2. Convert each row timestamp into a Python datetime object.
    3. Sort timestamps and find the nearest row for each target time slot.
    4. Generate all target time columns within the selected date/time range and hour_step.
    5. Map each database column to its parameter name and attach the value to the correct time cell.
    6. Build ReportPageData objects (pages of rows & time columns) and return a final ReportResponse.

    Example final structure:
    {
      "machine": "1LB09_Bobst",
      "date_from": "2026-08-15",
      "date_to": "2026-08-15",
      "time_from": "08:00",
      "time_to": "17:00",
      "pages": [
        {
          "page_number": 1,
          "date_str": "15/08/2026",
          "time_columns": [{"key": "time_0800", "label": "08:00 น.", "full_datetime": "2026-08-15 08:00"}],
          "rows": [{"param_id": 1, "name": "Line Speed", "values": {"time_0800": "100"}}]
        }
      ]
    }
    """
    # 1. map ชื่อ field ใน SQL view ไปยัง index ของ row ที่ต้องอ่าน
    #    row = [timestamp, Machine : Speed, Tunnel : Zone 1 : Temperature, ...]
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

    # 2. สร้าง list ของ timestamp จากแต่ละ row ของ SQL
    #    เปลี่ยน string timestamp เป็น datetime object เพื่อจัดการเวลาได้ง่ายขึ้น
    #    row[0] คือ timestamp ของแต่ละบันทึก เช่น "2026-08-15 08:00:00"
    MATCH_TOLERANCE_MINUTES = 30  # ยอมรับ record ที่อยู่ภายใน ±30 นาทีจากเวลาเป้าหมาย

    timestamp_list: List[tuple] = []  # list ของ (datetime_obj, row)
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

    # 3. เรียงลำดับ timestamp จากน้อยไปมาก เพื่อความสะดวกในการค้นหา row ที่ใกล้เคียง
    timestamp_list.sort(key=lambda x: x[0])

    # 4. สร้างฟังก์ชันหาค่า SQL row ที่ใกล้เคียงกับเวลาเป้าหมาย
    #    ใช้เพราะฐานข้อมูลจริงอาจไม่มี record ตรงทุกชั่วโมง
    #    เช่น เป้าหมาย 10:00 แต่ DB มี 10:12 ก็ใช้ได้ถ้าห่างน้อยกว่า 30 นาที
    def find_nearest_row(target_dt: datetime):
        """
        ค้นหา DB row ที่มี timestamp ใกล้เคียงกับ target_dt ที่สุดภายใน MATCH_TOLERANCE_MINUTES
        ถ้าไม่พบ return (None, None)
        actual_datetime คือ timestamp จริงจาก DB ใช้แสดงในหัวคอลัมน์
        """
        best_row = None
        best_actual_dt = None
        best_delta = timedelta(minutes=MATCH_TOLERANCE_MINUTES)
        for dt_obj, row in timestamp_list:
            delta = abs(dt_obj - target_dt)
            if delta <= best_delta:
                best_delta = delta
                best_row = row
                best_actual_dt = dt_obj
            elif dt_obj > target_dt + timedelta(minutes=MATCH_TOLERANCE_MINUTES):
                # เพราะ list เรียงลำดับแล้ว ถ้าเกิน tolerance ก็ไม่ต้องค้นต่อ
                break
        return best_actual_dt, best_row

    # 5. แปลง parameter string เป็น datetime object
    #    ถ้า parse error ก็ใช้วันนี้เวลา 08:00-17:00 เป็น default
    try:
        start_dt = datetime.strptime(f"{date_from_str} {time_from_str}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date_to_str} {time_to_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        today_str = datetime.now().strftime("%Y-%m-%d")
        start_dt = datetime.strptime(f"{today_str} 08:00", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{today_str} 17:00", "%Y-%m-%d %H:%M")

    # ถ้าเวลาสิ้นสุดน้อยกว่าหรือเท่ากับเวลาเริ่มต้น ให้ขยับไปวันถัดไป
    if end_dt <= start_dt:
        end_dt += timedelta(days=1)

    # 6. สร้าง list ของ target timestamps ตามช่วงและ step
    #    เช่น start=08:00, end=17:00, step=1 => [08:00, 09:00, 10:00, ..., 17:00]
    all_timestamps: List[datetime] = []
    curr_dt = start_dt
    while curr_dt <= end_dt:
        all_timestamps.append(curr_dt)
        curr_dt += timedelta(hours=hour_step)

    # 7. จัดกลุ่ม all_timestamps ตามวันที่
    #    ถ้า query ครอบ 2-3 วัน ก็จะได้ 2-3 key ในพจนานุกรม
    #    day_clusters = {"2026-08-15": [08:00, 09:00, ...], "2026-08-16": [...], ...}
    MAX_COLS_PER_PAGE = 14
    day_clusters: Dict[str, List[datetime]] = {}
    for dt in all_timestamps:
        day_key = dt.strftime("%Y-%m-%d")
        if day_key not in day_clusters:
            day_clusters[day_key] = []
        day_clusters[day_key].append(dt)

    # 8. แบ่งแต่ละวันออกเป็นหน้า (แต่ละหน้ามี max 14 คอลัมน์ เพราะจะแคบมากถ้ามากกว่า)
    #    เช่น วันที่ 15/08 มี 10 timestamp => 1 หน้า
    #    วันที่ 16/08 มี 20 timestamp => 2 หน้า (14 + 6)
    page_chunks = []
    for day_str, dt_list in day_clusters.items():
        for i in range(0, len(dt_list), MAX_COLS_PER_PAGE):
            page_chunks.append({
                "date_key": day_str,
                "timestamps": dt_list[i : i + MAX_COLS_PER_PAGE]
            })

    total_pages = len(page_chunks)
    # 9. สร้าง ReportPageData สำหรับแต่ละ chunk (หน้า)
    pages: List[ReportPageData] = []

    for idx, chunk in enumerate(page_chunks, start=1):
        # แปลง วันที่ เป็นรูป Thai เช่น "15/08/2026"
        dt_obj = datetime.strptime(chunk["date_key"], "%Y-%m-%d")
        formatted_date_th = dt_obj.strftime("%d/%m/%Y")
        
        # 10. สร้าง time_columns: สำหรับหน้าแรกจะมีคอลัมน์ 'Set up' อยู่ด้านหน้า
        #     เช่น [Set up, 08:00, 09:00, 10:00, ...]
        time_cols: List[TimeColumn] = []

        # ถ้าเป็นหน้าแรกและผู้ใช้ระบุ setup_target_dt ให้เพิ่มคอลัมน์ 'Set up'
        include_setup = (setup_target_dt is not None) ## idx == 1 and 
        setup_display_dt = None
        if include_setup:
            # ถ้ามี setup_row ให้ใช้ timestamp จริงจาก DB เพื่อแสดง ถ้าไม่มี ให้ใช้เวลาที่ผู้ใช้เลือก (setup_target_dt)
            if setup_row and len(setup_row) > 0 and setup_row[0] is not None:
                raw_setup_ts = setup_row[0]
                if isinstance(raw_setup_ts, str):
                    try:
                        setup_display_dt = datetime.strptime(raw_setup_ts, "%Y-%m-%d %H:%M:%S")
                    except ValueError:
                        try:
                            setup_display_dt = datetime.strptime(raw_setup_ts, "%Y-%m-%d %H:%M")
                        except ValueError:
                            setup_display_dt = setup_target_dt
                else:
                    setup_display_dt = raw_setup_ts
            else:
                setup_display_dt = setup_target_dt

            # label: หน้าแรกให้แสดงเวลา เช่น "Set up \n08:12 น.", แต่หน้าถัดไปให้แสดงเฉพาะ "Set up"
            if idx == 1:
                setup_label = f"Set up \n{setup_display_dt.strftime('%H:%M น.')}" if setup_display_dt is not None else "Set up"
                setup_full_dt = setup_display_dt.strftime("%Y-%m-%d %H:%M") if setup_display_dt is not None else f"{chunk['date_key']} Set up"
            else:
                setup_label = "Set up"
                setup_full_dt = f"{chunk['date_key']} Set up"

            time_cols.append(TimeColumn(
                key="setup",
                label=setup_label,
                full_datetime=setup_full_dt
            ))

        for dt in chunk["timestamps"]:
            # หา DB row ที่ใกล้เคียงกับเวลานี้ เพื่อเอา timestamp จริงมาแสดง
            actual_dt, _ = find_nearest_row(dt)
            # ถ้าพบ record จริง ใช้เวลาจริง ถ้าไม่มี ใช้เวลาเป้าหมาย
            display_dt = actual_dt if actual_dt is not None else dt
            time_cols.append(TimeColumn(
                key=dt.strftime("time_%H%M"),
                label=display_dt.strftime("%H:%M น."),
                full_datetime=display_dt.strftime("%Y-%m-%d %H:%M")
            ))

        # 11. สร้าง rows ของแต่ละ parameter (Machine Speed, Temperature, Tension, ...)
        rows: List[ParameterRow] = []
        for p in STANDARD_PARAMETERS:
            setup_val = ""
            col_values: Dict[str, str] = {}

            # 11.a ถ้าผู้ใช้ส่ง setup_target_dt มา ให้พยายามหาค่า setup_val สำหรับ parameter นี้
            #       แต่เฉพาะหน้าแรกเท่านั้นที่จะแสดงค่า (หน้าอื่นๆ ให้เป็นค่าว่าง) idx == 1 and
            if idx == 1 and setup_target_dt is not None and p["db_column"] and p["db_column"] in COLUMN_INDEX_MAP:
                try:
                    setup_col_idx = COLUMN_INDEX_MAP[p["db_column"]]
                except KeyError:
                    setup_col_idx = None

                if setup_col_idx is not None:
                    # 1) ถ้ามี setup_row ที่ถูก query มาเฉพาะ ให้ใช้ค่านั้น
                    if setup_row and setup_col_idx < len(setup_row) and setup_row[setup_col_idx] is not None:
                        raw_val = setup_row[setup_col_idx]
                        if isinstance(raw_val, (int, float)):
                            setup_val = str(int(raw_val)) if float(raw_val).is_integer() else str(round(float(raw_val), 1))
                        else:
                            setup_val = str(raw_val)
                    else:
                        # 2) ถ้าไม่มี setup_row ให้ค้นใน timestamp_list ภายใน ±5 นาที
                        best_row = None
                        best_delta = timedelta(minutes=5)
                        for dt_obj, row in timestamp_list:
                            delta = abs(dt_obj - setup_target_dt)
                            if delta <= best_delta:
                                best_delta = delta
                                best_row = row
                            elif dt_obj > setup_target_dt + timedelta(minutes=5):
                                break
                        if best_row and setup_col_idx < len(best_row) and best_row[setup_col_idx] is not None:
                            raw_val = best_row[setup_col_idx]
                            if isinstance(raw_val, (int, float)):
                                setup_val = str(int(raw_val)) if float(raw_val).is_integer() else str(round(float(raw_val), 1))
                            else:
                                setup_val = str(raw_val)

            for col in time_cols:
                # ข้าม "Setup" column — ค่าถูกเก็บไว้ที่ setup_val
                if col.key == "setup":
                    continue
                    
                # 12. ถ้า parameter นี้ไม่ได้ map กับ column ใน SQL view ก็ปล่อยไว้เป็นค่าว่าง
                if not p["db_column"] or p["db_column"] not in COLUMN_INDEX_MAP:
                    col_values[col.key] = ""
                    continue
                
                # ดึง indexของ column นี้จาก SQL row
                col_idx = COLUMN_INDEX_MAP[p["db_column"]]
                
                # 13. ค้นหา SQL row ที่ใกล้เคียงกับเวลาของ column นี้
                try:
                    col_dt = datetime.strptime(col.full_datetime, "%Y-%m-%d %H:%M")
                except ValueError:
                    col_values[col.key] = ""
                    continue

                _, matched_row = find_nearest_row(col_dt)
                
                # 14. ถ้าพบ row และ index ถูกต้อง ก็อ่านค่า แล้วแปลงเป็น string
                if matched_row and col_idx < len(matched_row) and matched_row[col_idx] is not None:
                    raw_val = matched_row[col_idx]
                    if isinstance(raw_val, (int, float)):
                        # ถ้าเป็นเลขจำนวนเต็ม ไม่ใส่ทศนิยม ถ้าไม่ใช่ ปัดเศษ 1 ตำแหน่ง
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

        # 15. รวม time_columns และ rows ลงใน ReportPageData
        pages.append(ReportPageData(
            page_number=idx,
            total_pages=total_pages,
            date_str=formatted_date_th,
            time_columns=time_cols,
            rows=rows
        ))

    # 16. รวม pages ทั้งหมดลงใน ReportResponse พร้อมข้อมูล machine และช่วงวันที่เวลา
    return ReportResponse(
        machine=machine,
        date_from=date_from_str,
        date_to=date_to_str,
        time_from=time_from_str,
        time_to=time_to_str,
        pages=pages
    )

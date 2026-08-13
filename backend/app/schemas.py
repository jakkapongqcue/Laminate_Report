from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class MachineOption(BaseModel):
    id: str
    name: str

class ParameterRow(BaseModel):
    param_id: int
    name: str
    set_point: str
    unit: str
    setup_val: Optional[str] = ""
    # Map of timestamp string or column key -> reading value
    values: Dict[str, str] = {}

class TimeColumn(BaseModel):
    key: str           # e.g., "setup" or "time_0800"
    label: str         # e.g., "Set up" or "08:00 น."
    full_datetime: str # e.g., "2026-08-13 08:00"

class ReportPageData(BaseModel):
    page_number: int
    total_pages: int
    date_str: str       # e.g., "13/08/2026"
    time_columns: List[TimeColumn]
    rows: List[ParameterRow]

class ReportResponse(BaseModel):
    machine: str
    date_from: str
    date_to: str
    time_from: str
    time_to: str
    pages: List[ReportPageData]

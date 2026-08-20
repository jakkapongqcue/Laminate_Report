# Deployment Guide: Windows Server + IIS + NSSM

คู่มือการติดตั้งและ Deploy ระบบ **Laminate Checking Report** บน Windows Server สำหรับ Solo Developer

---

## 1. ข้อกำหนดเบื้องต้น (Prerequisites)

1. **Python 3.10+**: ติดตั้ง Python บน Windows Server และเพิ่มเข้า PATH
2. **IIS (Internet Information Services)**: พร้อม Feature **URL Rewrite** และ **ARR (Application Request Routing)**
   - ดาวน์โหลด URL Rewrite: `https://www.iis.net/downloads/microsoft/url-rewrite`
   - ดาวน์โหลด ARR: `https://www.iis.net/downloads/microsoft/application-request-routing`
3. **NSSM (Non-Sucking Service Manager)**: ดาวน์โหลด nssm.exe จาก `https://nssm.cc/download`
4. **ODBC Driver for SQL Server**: ติดตั้ง ODBC Driver 17 หรือ 18 สำหรับ SQL Server

---

## 2. ขั้นตอนการติดตั้ง Backend (FastAPI Service)

1. คัดลอกโฟลเดอร์ `backend/` ไปยังเซิร์ฟเวอร์ เช่น `C:\inetpub\wwwroot\LaminateReport\backend`
2. สร้าง Virtual Environment และติดตั้ง dependencies:
   ```cmd
   cd C:\inetpub\wwwroot\LaminateReport\backend
   python -m venv venv
   call venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. ตั้งค่าไฟล์ `.env` สำหรับเชื่อมต่อ SQL Server:
   ```env
   DB_DRIVER=ODBC Driver 17 for SQL Server
   DB_SERVER=127.0.0.1
   DB_PORT=1433
   DB_NAME=LaminateDB
   DB_USER=sa
   DB_PASSWORD=YourStrongPassword
   DB_USE_WINDOWS_AUTH=false
   ```
4. ติดตั้ง Windows Service ด้วย NSSM:
   - เปิด Command Prompt ด้วย權限 **Administrator**
   - รันคำสั่งหรือแก้ไขสคริปต์ `setup_service.bat`:
   ```cmd
   nssm install LaminateReportAPI "C:\inetpub\wwwroot\LaminateReport\backend\venv\Scripts\python.exe" "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4"
   nssm set LaminateReportAPI AppDirectory "C:\inetpub\wwwroot\LaminateReport\backend"
   nssm set LaminateReportAPI Start SERVICE_AUTO_START
   nssm start LaminateReportAPI
   ```

---

## 3. ขั้นตอนการตั้งค่า Frontend บน IIS

1. บนเครื่อง Dev ทำการ Build Vue 3 Frontend:
   ```cmd
   cd frontend
   npm run build
   ```
2. คัดลอกไฟล์ทั้งหมดในโฟลเดอร์ `frontend/dist` ไปไว้ที่ IIS Application Directory เช่น `C:\inetpub\wwwroot\LaminateReport\wwwroot`
3. วางไฟล์ `web.config` ไว้ที่โฟลเดอร์หลัก เพื่อให้ IIS ทำงานเป็น **Reverse Proxy**:
   - Request ที่ขึ้นต้นด้วย `/api/` จะถูก Rewrite ส่งต่อไปยัง `http://127.0.0.1:8000/api/`
   - Request ทั่วไปจะเข้าสู่ Vue 3 SPA Application

---

## 4. การตรวจสอบสถานะการทำงาน (Verification)

- ตรวจสอบสถานะ Service: `nssm status LaminateReportAPI`
- ตรวจสอบ API Health Check: เปิดเบราว์เซอร์เข้า `http://localhost/api/` หรือ `http://localhost:8000/docs`

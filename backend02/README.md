# Backend02 (Node.js + Express)

ระบบ Backend สำหรับ **Laminate Checking Report** พัฒนาโดยใช้ Node.js + Express ติดต่อฐานข้อมูล MS SQL Server ผ่านไลบรารี `mssql`

---

## 1. โครงสร้างไฟล์

```
backend02/
├── server.js           ← Entry point ของแอปพลิเคชัน (routes ทั้งหมดอยู่ที่นี่)
├── config.js           ← โหลดค่าจาก .env และ export ออกมาใช้งาน
├── db.js               ← จัดการ Connection Pool ของ mssql
├── reportProcessor.js  ← Logic ประมวลผลข้อมูล / รายการเครื่องจักร (MACHINES)
├── package.json
├── web.config          ← ตั้งค่า iisnode และ URL Rewrite สำหรับ IIS
└── .env                ← ข้อมูลการเชื่อมต่อ DB (ไม่ commit เข้า git)
```

---

## 2. Endpoints

Router mount อยู่ที่ทั้ง `/` (local dev) และ `/LaminateReport-Back` (IIS path)

| Method | Path                        | คำอธิบาย                                                  | ต้องการ DB |
| ------ | --------------------------- | --------------------------------------------------------- | ---------- |
| GET    | `/`                         | Health Check — ตรวจสอบว่าระบบออนไลน์                      | ❌         |
| GET    | `/api/machines`             | รายการเครื่องจักรทั้งหมด (id, name)                       | ❌         |
| GET    | `/api/report/laminate`      | ดึงข้อมูลรายงานจากฐานข้อมูลจริง `KEP_LOG`                 | ✅         |
| GET    | `/api/report/laminate/test` | ดึงข้อมูลจำลอง (Synthetic Data) สำหรับพัฒนา/ทดสอบ         | ❌         |
| GET    | `/api/machineStatus`        | ตรวจสอบสถานะเครื่องจักร (online/offline จาก `LINE_SPEED`) | ✅         |

### Query Parameters — `/api/report/laminate` และ `/api/report/laminate/test`

| Parameter    | ค่าเริ่มต้น    | คำอธิบาย                                        |
| ------------ | -------------- | ----------------------------------------------- |
| `machine`    | `1LB09_Bobst`  | ID ของเครื่องจักร (ดูรายการจาก `/api/machines`) |
| `date_from`  | **(required)** | วันที่เริ่มต้น format `YYYY-MM-DD`              |
| `date_to`    | **(required)** | วันที่สิ้นสุด format `YYYY-MM-DD`               |
| `time_from`  | `08:00`        | เวลาเริ่มต้น format `HH:MM`                     |
| `time_to`    | `17:00`        | เวลาสิ้นสุด format `HH:MM`                      |
| `hour_step`  | `1`            | ขนาด interval (ชั่วโมง)                         |
| `setup_date` | `null`         | วันที่ของค่า Setup (ถ้าไม่ระบุใช้ `date_from`)  |
| `setup_time` | `null`         | เวลาของค่า Setup format `HH:MM`                 |

### Query Parameters — `/api/machineStatus`

| Parameter | ค่าเริ่มต้น    | คำอธิบาย                                |
| --------- | -------------- | --------------------------------------- |
| `machine` | **(required)** | ID ของเครื่องจักรที่ต้องการตรวจสอบสถานะ |

---

## 3. วิธีการรันในเครื่องพัฒนา (Local Development)

**ข้อกำหนด:** Node.js เวอร์ชัน 18 ขึ้นไป

1. เข้าไปที่โฟลเดอร์ `backend02`:
   ```bash
   cd backend02
   ```
2. ติดตั้ง packages:
   ```bash
   npm install
   ```
3. สร้างและตั้งค่าไฟล์ `.env`:
   ```env
   DB_SERVER=192.168.10.99
   DB_PORT=1433
   DB_NAME=KEP_LOG
   DB_USER=operation
   DB_PASSWORD=YourPassword
   PORT=8051
   ```
4. รันระบบ:
   ```bash
   npm start
   ```
   หรือรันพร้อม watch mode (Node.js 18+):
   ```bash
   node --watch server.js
   ```
5. ทดสอบ Health Check:
   ```
   http://localhost:8051/
   ```

---

## 4. คู่มือการติดตั้งบน IIS ด้วย `iisnode`

> **iisnode** ช่วยให้ IIS จัดการ Process ของ Node.js ได้ครบ (Auto-restart, Log, Multi-process) โดยไม่ต้องลง NSSM

### ขั้นตอนที่ 1: เตรียมโค้ดบนเซิร์ฟเวอร์

1. คัดลอกโฟลเดอร์ `backend02` ไปยังเซิร์ฟเวอร์ เช่น `C:\webapp\LaminateReport\backend`
2. เปิด Command Prompt ด้วยสิทธิ์ **Administrator** แล้วรัน:
   ```cmd
   cd C:\webapp\LaminateReport\backend
   npm install --production
   ```
3. แก้ไขไฟล์ `.env` ให้ตรงกับฐานข้อมูล Production:
   ```env
   DB_SERVER=192.168.10.99
   DB_PORT=1433
   DB_NAME=KEP_LOG
   DB_USER=operation
   DB_PASSWORD=YourActualPassword
   ```
   > **หมายเหตุ**: ไม่ต้องระบุ `PORT` บน IIS เพราะ iisnode จะส่ง Named Pipe มาแทน

### ขั้นตอนที่ 2: ตรวจสอบไฟล์ `web.config`

ไฟล์ `web.config` ในโฟลเดอร์ `backend02` เตรียมไว้แล้ว ทำหน้าที่:

1. ลงทะเบียน `server.js` เป็น handler ของ `iisnode`
2. เปิด URL Rewrite ส่งทุก Request ไปยัง `server.js` ให้ Express จัดการ Routing
3. ซ่อน `node_modules/` และ `.env` ไม่ให้เข้าถึงจากภายนอกผ่าน HTTP

### ขั้นตอนที่ 3: ตั้งค่า IIS Manager

1. **Application Pool**
   - ชื่อ: `LaminateReportPool`
   - .NET CLR version: **No Managed Code**

2. **เว็บไซต์หลัก (Frontend)**
   - Physical path: `C:\webapp\LaminateReport\frontend`
   - Binding: Port 80

3. **Sub-Application (Backend)**
   - คลิกขวาที่ Site → **Add Application...**
   - Alias: `LaminateReport-Back`
   - Physical path: `C:\webapp\LaminateReport\backend`
   - Application pool: `LaminateReportPool`

### ขั้นตอนที่ 4: ทดสอบ

เปิดบราวเซอร์แล้วเข้า:

```
http://your-server-ip/LaminateReport-Back/
```

หากระบบทำงานปกติ จะแสดงผล:

```json
{
  "status": "online",
  "service": "Laminate Checking Report API",
  "version": "1.0.0"
}
```

---

## 5. Dependencies

| Package   | เวอร์ชัน | การใช้งาน                              |
| --------- | -------- | -------------------------------------- |
| `express` | ^4.19.2  | Web Framework                          |
| `mssql`   | ^10.0.2  | MS SQL Server Client (Connection Pool) |
| `cors`    | ^2.8.5   | จัดการ CORS Header                     |
| `dotenv`  | ^16.4.5  | โหลด `.env` ไฟล์                       |

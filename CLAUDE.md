# CLAUDE.md — Laminate Checking Report

คู่มือและข้อมูลสถาปัตยกรรมสำหรับนักพัฒนาและผู้ช่วย AI ในการทำความเข้าใจ ดูแล และพัฒนาโปรเจกต์ **Laminate Checking Report** (Production Checking Report System)

---

## 1. ภาพรวมโครงการ (Project Overview)

**Laminate Checking Report** คือระบบเว็บแอปพลิเคชันสำหรับดึงข้อมูลการทำงานและค่าพารามิเตอร์ของเครื่องจักรในโรงงาน (Starflex Public Company Limited) จากระบบ IoT / SCADA ในฐานข้อมูล MS SQL Server มาแสดงผลใน 2 รูปแบบหลัก:

1. **Report Mode (รายงานตรวจสอบตามแบบฟอร์มกระดาษ)**: สร้างและจัดหน้ารายงานตามมาตรฐานเอกสาร ISO/QA **`FM-PRD-01/55 Rev.05 Effective Date : 01/11/2024`** ในขนาด A4 แนวนอน (Landscape) พร้อมพิมพ์ (Print-ready)
2. **Chart Mode (กราฟวิเคราะห์แนวโน้ม Time Series)**: แสดงกราฟเชิงลึกเปรียบเทียบค่าพารามิเตอร์ต่างๆ (ความเร็ว, อุณหภูมิ, แรงดึง, แรงดัน, ค่าโคโรนา) แบบ Interactive ด้วย ApexCharts

### รองรับ 3 สายการผลิต (Process Types)
- **Laminate (เครื่องเคลือบ)**: 1LB-09 Bobst, LB-10 Bobst, 1LL-07 Comexi, 2LB-06 Fuji Kikai, SB-01, SB-04 Beiren
- **Printing (เครื่องพิมพ์)**: 1PG-06 Caida, 1PG-07 Caida, 2PG-05 Beiren, PT-03 Xinda, PT-04 Beiren, PT-08 Altima
- **BlownFilm (เครื่องเป่าฟิล์ม)**: 1BF-01 Blownfilm

---

## 2. เทคโนโลยีที่ใช้ (Tech Stack)

### Frontend
- **Framework**: Vue 3 (`^3.5.40`) ด้วย Composition API (`<script setup>`)
- **Build Tool**: Vite (`^8.1.5`)
- **Styling**: Tailwind CSS v4 (`^4.3.3`) พร้อม `@tailwindcss/vite`
- **Router**: Vue Router (`^5.2.0`)
- **State Management**: Pinia (`^4.0.2`)
- **Charting**: ApexCharts (`^7.0.0`) และ `vue3-apexcharts` (`^1.11.1`)
- **Code Formatter**: Prettier (`^3.9.8`) + `prettier-plugin-tailwindcss`

### Backend
- **Runtime**: Node.js (เวอร์ชัน 18+ หรือ 22+)
- **Framework**: Express.js (`^4.19.2`)
- **Database Driver**: `mssql` (`^10.0.2`) พร้อม Connection Pooling
- **Utilities**: `cors` (`^2.8.5`), `dotenv` (`^16.4.5`)
- **Web Server Hosting**: Windows Server IIS + `iisnode` (รองรับ Named Pipe IPC)

### Databases
1. **`KEP_LOG`** (`192.168.10.99:1433`):
   - เก็บข้อมูลเซนเซอร์แบบ Real-time / Historical จาก SCADA ผ่าน View ประจำเครื่องจักร เช่น:
     - `[KEP_LOG].[dbo].[View_1LB09_Bobst]`
     - `[KEP_LOG].[dbo].[View_1LL07_Comexi]`
     - `[KEP_LOG].[dbo].[View_2LB06_FujiKikai]`
     - `[KEP_LOG].[dbo].[View_SB04_Beiren]`
     - `[KEP_LOG].[dbo].[View_1PG06_Caida]`
     - `[KEP_LOG].[dbo].[View_1BF01_Blownfilm]`
2. **`AX50_SF_PRD_SP1`** (`AXDB:1433`):
   - Microsoft Dynamics AX สำหรับดึงสูตร/สเปกการผลิต (Standard Parameters / Set Point: PS)
   - ตาราง `[AX50_SF_PRD_SP1].[dbo].[SF_PRODSPECMACHINE]`
   - วิวข้อมูลชื่อสินค้า `[AX50_SF_PRD_SP1].[dbo].[SF_ViewInventTable_SF]`

---

## 3. โครงสร้างโฟลเดอร์ของโปรเจกต์ (Directory Structure)

```text
Laminate_Report/
├── CLAUDE.md                     # เอกสารแนะนำและสรุปโปรเจกต์สำหรับ Claude / Dev
├── README.md                     # คู่มือการติดตั้ง IIS และระบบเบื้องต้น
├── index.html                    # Directory portal page สำหรับ HerculesSite IIS paths
├── run_all.bat                   # Batch script รันทั้ง Backend และ Frontend พร้อมกัน
├── run_backend.bat               # Batch script สำหรับเริ่ม Backend Service
├── run_frontend.bat              # Batch script สำหรับเริ่ม Vite Dev Server
├── deploy_PRD.bat                # Script build frontend และ deploy ไปยัง Production Server
├── deploy_local.bat              # Script deploy สำหรับทดสอบบนเครื่อง Local
├── .prettierrc.json              # การตั้งค่า Prettier ของโปรเจกต์
│
├── backend/                      # Node.js + Express Backend API
│   ├── server.js                 # Entry Point หลัก, กำหนด API Routes, iisnode Named Pipe
│   ├── config.js                 # โหลด Environment variables จาก .env
│   ├── db.js                     # จัดการ Connection Pool สำหรับ KEP_LOG และ AXDB
│   ├── common.js                 # Helper functions, ฟอร์แมตวันที่/เวลา, แปลงค่าตัวเลข
│   ├── processes.js              # รวบรวมและจัดการรายชื่อ Process & Machine ทั้งระบบ
│   ├── reportProcessor.js        # Logic จัดกลุ่มข้อมูลรายชั่วโมง, คำนวณ Set up, และจัดหน้า Report
│   ├── chartProcessor.js         # Logic จัดการและ Downsample ข้อมูล Time Series สำหรับ ApexCharts
│   ├── web.config                # คอนฟิก IIS URL Rewrite และ iisnode module
│   ├── package.json
│   ├── laminate/                 # Config เฉพาะสาย Laminate
│   │   ├── index.js
│   │   ├── machines.js           # รายการเครื่องจักร, ชื่อ View DB, คอลัมน์ที่ Query, Unit Overrides
│   │   ├── parameters.js         # นิยาม Standard Parameters 29 ค่า (Speed, Temp, Tension, ฯลฯ)
│   │   └── axPs.js               # Mapping ชื่อคอลัมน์จาก AX SF_PRODSPECMACHINE
│   ├── printing/                 # Config เฉพาะสาย Printing (เครื่องพิมพ์)
│   │   ├── index.js, machines.js, parameters.js, axPs.js
│   └── blownfilm/                # Config เฉพาะสาย BlownFilm (เครื่องเป่าฟิล์ม)
│       ├── index.js, machines.js, parameters.js, axPs.js
│
└── frontend/                     # Vue 3 + Vite Application
    ├── vite.config.js            # กำหนด Plugins (Vue, Tailwind CSS) และ Alias `@`
    ├── package.json
    ├── .env.local                # คอนฟิก VITE_BACK_BASE_URL (เช่น http://localhost:8000)
    ├── public/
    │   └── web.config            # IIS URL Rewrite สำหรับ Vue SPA Client-side routing
    └── src/
        ├── App.vue               # Root Component
        ├── main.js               # Mount Vue App, Pinia, Router
        ├── router/
        │   └── index.js          # Routes: /laminate, /printing, /blownfilm, /setting
        ├── views/
        │   ├── HomeView.vue      # หน้าจอหลัก (จัดการ State, Filter, Query API, สลับโหมด)
        │   └── Setting.vue       # หน้าแสดงสถานะการเชื่อมต่อฐานข้อมูล
        ├── components/
        │   ├── AppHeadTitle.vue  # Header ด้านบน พร้อม Dropdown สลับประเภท Process
        │   ├── FilterBar.vue     # แถบเลือกเงื่อนไข (Machine, Date, Time, Step, ปุ่มค้นหา/พิมพ์)
        │   ├── Filter_ItemFG.vue # ช่องกรอก/ค้นหา Item FG (Autocomplete >= 4 ตัวอักษร)
        │   ├── Laminate_ReportSheet.vue   # แบบฟอร์มรายงานขนาด A4 มาตรฐาน FM-PRD-01/55
        │   ├── Laminate_ParameterTable.vue# ตารางแสดงค่าพารามิเตอร์ พร้อมเช็คค่าผิดสเปก
        │   ├── Laminate_Chart.vue         # กราฟ Time Series แบบ Interactive (ApexCharts)
        │   ├── SwitchViewMode.vue         # ปุ่มสลับระหว่าง "ตารางรายงาน" กับ "กราฟเส้น"
        │   ├── Pill_MachineStatus.vue     # ป้ายแสดงสถานะ Online/Offline ของเครื่องจักร
        │   └── Slot_MainContainer.vue     # Container ครอบหน้าจอ
        └── utils/
            └── timeAgo.js        # Helper คำนวณเวลาเชิงสัมพันธ์ (Relative Time)
```

---

## 4. วิธีการรันและการทดสอบ (Development & Run Commands)

### 4.1 รันระบบทั้งหมดแบบด่วน
สามารถดับเบิลคลิกไฟล์:
- `run_all.bat`: สตาร์ททั้ง Backend และ Frontend พร้อมเปิดเบราว์เซอร์ที่ `http://localhost:3000`

### 4.2 Backend (Node.js + Express)
```bash
cd backend

# ติดตั้ง Dependencies
npm install

# รัน Backend (พอร์ตดีฟอลต์: 8000 หรือ 8051 ตามการตั้งค่า)
npm start

# รัน Backend พร้อม Watch Mode (เมื่อแก้ไขโค้ด)
node --watch server.js
```

### 4.3 Frontend (Vue 3 + Vite)
```bash
cd frontend

# ติดตั้ง Dependencies
npm install

# รัน Vite Dev Server (พอร์ตดีฟอลต์: 3000)
npm run dev

# บิลด์สำหรับ Production (ผลลัพธ์อยู่ที่ frontend/dist)
npm run build

# ตรวจสอบและจัดรูปแบบโค้ดด้วย Prettier
npm run format
```

---

## 5. การตั้งค่า Environment Variables (`.env`)

### Backend (`backend/.env`)
สร้างไฟล์ `backend/.env` (ห้าม commit ข้อมูลรหัสผ่านเข้า Git):
```env
# การเชื่อมต่อ KEP_LOG (ฐานข้อมูลเซนเซอร์เครื่องจักร)
DB_SERVER=192.168.10.99
DB_PORT=1433
DB_NAME=KEP_LOG
DB_USER=operation
DB_PASSWORD=YourKepLogPassword

# การเชื่อมต่อ Dynamics AX (ฐานข้อมูลสเปกการผลิต)
AX_DB_SERVER=AXDB
AX_DB_PORT=1433
AX_DB_NAME=AX50_SF_PRD_SP1
AX_DB_USER=ViewReportAPI
AX_DB_PASSWORD=YourAxPassword

# พอร์ตสำหรับรัน Local (IIS iisnode จะใช้ Named Pipe แทนตัวแปรนี้)
PORT=8000
```

### Frontend (`frontend/.env.local`)
```env
VITE_BACK_BASE_URL=http://localhost:8000
```
> **หมายเหตุสำหรับ Production**: ในสภาพแวดล้อม IIS เว็บไซต์จะเชื่อมต่อผ่าน Path สัมพัทธ์หรือ Sub-application `/LaminateReport-Back` โดยไม่ต้องผ่าน Port proxy

---

## 6. รายละเอียด API Endpoints (Backend Reference)

Router รองรับการ Mount 2 รูปแบบพร้อมกัน:
- Local Development: `/` (เช่น `http://localhost:8000/api/...`)
- Production IIS Sub-app: `/LaminateReport-Back` (เช่น `http://server-ip/LaminateReport-Back/api/...`)

| Method | Endpoint | Query Parameters | รายละเอียด |
|---|---|---|---|
| `GET` | `/` | - | Health check และแสดงสถานะ API |
| `GET` | `/api/processes` | - | รายการสายการผลิตทั้งหมด (Laminate, Printing, BlownFilm) |
| `GET` | `/api/machines` | `processType` (optional) | รายชื่อเครื่องจักรทั้งหมด หรือกรองตามสายการผลิต |
| `GET` | `/api/searchItemFG` | `machine`, `keyword` (>= 4 ตัวอักษร), `processType` | ค้นหา Item FG แบบ Autocomplete จากฐานข้อมูล AX (จำกัด TOP 20) |
| `GET` | `/api/checkItemFG` | `machine`, `item_fg`, `processType` | ตรวจสอบรหัส Item FG ใน AX, ค้นหา Revision ล่าสุด และรายการ Production Pools (เช่น Laminate 1, Laminate 2) |
| `GET` | `/api/report/laminate` | `machine`, `date_from`, `date_to`, `time_from`, `time_to`, `hour_step`, `item_fg`, `prod_pool` | ดึงข้อมูลเซนเซอร์จาก `KEP_LOG` และดึงค่า Set Point จาก `AXDB` เพื่อนำมาประกอบเป็นหน้ารายงานตามช่วงเวลา |
| `GET` | `/api/chart/laminate` | `machine`, `date_from`, `date_to`, `time_from`, `time_to`, `step_minutes` | ดึงข้อมูลเซนเซอร์ Time Series ที่จัดโครงสร้างพร้อมแสดงผลบน ApexCharts |
| `GET` | `/api/machineStatus` | `machine` | ตรวจสอบสถานะการทำงาน (Online: speed > 0, Offline: speed = 0) พร้อม Cache 5 วินาที |

---

## 7. ตรรกะการทำงานหลัก (Core Business Logic)

### 7.1 การจับคู่ข้อมูลรายชั่วโมง (Report Checkpoints)
- **แถวเริ่มต้น (Set up)**: ดึงแถวแรกสุด (Earliest Timestamp) ของข้อมูลในช่วงวันที่/เวลาที่เลือกมาเป็นค่าเริ่มต้นของรอบการผลิต
- **ช่วงเวลาถัดไป (Checkpoints)**: สเต็ปเวลาตามค่า `hour_step` (+1, +2 หรือ +4 ชั่วโมง) ตั้งแต่เวลาเริ่มจนถึงเวลาสิ้นสุด
- **Tolerance Window (`MATCH_TOLERANCE_MINUTES = 30`)**: ค้นหาเรคคอร์ดจากฐานข้อมูลที่มี Timestamp ใกล้เคียงกับจุดตรวจที่สุดในระยะบวกลบไม่เกิน 30 นาที หากไม่อยู่ในช่วงจะถือว่าไม่มีข้อมูล
- **การแบ่งหน้า (Pagination)**: แบ่งหน้าตามวัน (Day Cluster) แต่ละวันสามารถมีคอลัมน์เวลาสูงสุด 13-14 คอลัมน์ หากเกินจะจัดขึ้นหน้าใหม่โดยอัตโนมัติ

### 7.2 การเปรียบเทียบค่าผิดสเปก (Out-of-Spec Highlighting)
- เมื่อผู้ใช้ระบุ `item_fg` ระบบจะดึงค่า Set Point (PS) จาก AX
- ตารางพารามิเตอร์ (`Laminate_ParameterTable.vue`) จะตรวจสอบค่าที่อ่านได้เทียบกับค่า Set Point (เช่น ค่าเดี่ยว หรือช่วง `180-200`)
- หากพบค่าหลุดช่วง (โดยเฉพาะ `LINE_SPEED`) ระบบจะเน้นสีพื้นหลังแดงและตัวอักษรสีแดงเข้ม (`bg-red-100 text-red-600 font-bold`) เพื่อให้ผู้ตรวจสอบสังเกตเห็นได้ทันที

### 7.3 การแคชสถานะเครื่องจักร (Machine Status Caching)
- Endpoint `/api/machineStatus` มี In-memory cache 5,000 ms (`STATUS_CACHE_TTL_MS = 5000`) ป้องกันการส่งคำสั่ง Query ไปยัง `KEP_LOG` ซ้ำๆ เมื่อมีหลายไคลเอ็นต์ Poll สถานะพร้อมกัน

### 7.4 การจัดการฟอร์แมตพิมพ์ (Print-Ready Layout)
- ออกแบบเฉพาะสำหรับกระดาษ **A4 Landscape (297mm x 210mm)**
- ใช้ CSS `@media print` ซ่อนส่วน Filter, Controls, Navigation Bar และปุ่มต่างๆ (`no-print`)
- กำหนด `page-break-after: always` ในแต่ละหน้ารายงานเพื่อให้พิมพ์ออกมาแยกหน้าอย่างสมบูรณ์

---

## 8. การติดตั้งบน Production (IIS Deployment)

โปรเจกต์มี Script สำหรับ Deploy ไปยัง Production Server อยู่ที่ `deploy_PRD.bat`:

### ขั้นตอนการทำงานของ `deploy_PRD.bat`
1. **Frontend**:
   - รัน `npm run build` ในโฟลเดอร์ `frontend/`
   - ใช้ `robocopy` คัดลอกโฟลเดอร์ `frontend/dist` ไปที่ `\\webserver\d$\WebApp\LaminateReport\Front`
2. **Backend**:
   - ลบไฟล์เก่าใน `\\webserver\d$\WebApp\LaminateReport\Back` โดย**สงวนไฟล์ `.env` และโฟลเดอร์ `node_modules` ไว้เสมอ**
   - คัดลอกไฟล์ Backend ใหม่ โดยยกเว้นโฟลเดอร์ `.git`, `node_modules`, `scratch`
3. **IIS Configuration**:
   - Application Pool: **No Managed Code** (เนื่องจาก Node.js ทำงานผ่าน `iisnode`)
   - Frontend Site: Physical Path ชี้ไปที่โฟลเดอร์ `Front`
   - Backend Sub-application: Alias เป็น `LaminateReport-Back` ชี้ไปที่โฟลเดอร์ `Back`

---

## 9. ข้อพึงระวังและคำแนะนำสำหรับนักพัฒนา (Development Notes & Gotchas)

1. **Backend ปัจจุบันคือ Node.js + Express**:
   - ในอดีตโปรเจกต์เคยทดลองพัฒนาด้วย Python (FastAPI) แต่ถูกแปลงเป็น Node.js Express (`backend/server.js`) อย่างสมบูรณ์แล้ว
   - โฟลเดอร์ `backend/venv` หรือไฟล์ `.pyc` เก่าไม่มีการใช้งานใน Production สามารถละเว้นได้
   - ใน `run_backend.bat` หากพบคำสั่ง python ให้ใช้คำสั่ง `npm start` หรือ `node server.js`
2. **การทำงานร่วมกับ `iisnode`**:
   - ห้าม Hardcode พอร์ตเฉพาะใน `server.js` เพราะบน IIS ตัว `iisnode` จะส่ง Named Pipe มาทาง `process.env.PORT` (เช่น `\\.\pipe\...`)
3. **ความปลอดภัยของฐานข้อมูล**:
   - คำสั่ง SQL Query ทั้งหมดต้องใช้ Parameterized Input ผ่าน `request.input()` ของ `mssql` เสมอ เพื่อป้องกัน SQL Injection
4. **รูปแบบโค้ด (Code Formatting)**:
   - โปรเจกต์ใช้ Prettier:
     - สำหรับไฟล์ `.vue`: `singleQuote: true`, `semi: false`
     - สำหรับไฟล์ `.js`: `printWidth: 100` (ยกเว้น `common.js` ใช้ `printWidth: 190`)
   - ก่อน Commit ควรทดสอบรัน `npm run format` ในโฟลเดอร์ `frontend`

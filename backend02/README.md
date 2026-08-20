# Backend02 (Node.js + Express)

ระบบ Backend ใหม่สำหรับ **Laminate Checking Report** พัฒนาขึ้นโดยใช้ Node.js + Express เพื่อทดแทน Python backend ตัวเดิม

## 1. จุดเด่นและการเปลี่ยนแปลง
* **Node.js + Express**: น้ำหนักเบา สตาร์ทเร็ว ดูแลรักษาง่ายขึ้นสำหรับโปรเจค JS/TS stack
* **ใช้ Connection Pool**: จัดการ Connection ไปยัง MS SQL Server ผ่านไลบรารี `mssql` (tedious) โดยไม่จำเป็นต้องใช้ ODBC Driver ติดตั้งแยกในระบบปฏิบัติการ
* **ปิดใช้งาน MOCK FALLBACK**: ถอดเงื่อนไข `USE_MOCK_FALLBACK` ออกอย่างเด็ดขาด หากฐานข้อมูลหลักเชื่อมต่อไม่ได้ ระบบจะแจ้งเตือนความผิดพลาด (HTTP 500) พร้อมคำอธิบายสาเหตุทันที
* **การจำลองข้อมูล**: มี endpoint จำลองข้อมูลแยกออกมาชัดเจนเพื่อทดสอบฟรอนต์เอนด์ได้โดยไม่ต้องมีฐานข้อมูลจริง
* **รองรับ iisnode**: ปรับปรุงส่วนการ Listen ให้รองรับ Named Pipe จาก iisnode โดยอัตโนมัติ

---

## 2. Endpoints
* **GET `/`**: ตรวจสอบสถานะการเชื่อมต่อ (Health Check)
* **GET `/api/machines`**: รายการเครื่องจักรทั้งหมด (เช่น `1LB09_Bobst`)
* **GET `/api/report/laminate`**: ดึงข้อมูลรายงานจากฐานข้อมูลจริง KEP_LOG (ต้องการการตั้งค่าข้อมูลเชื่อมต่อใน `.env`)
* **GET `/api/report/laminate/test`**: ดึงข้อมูลจำลอง (Synthetic Data) สำหรับใช้ในการพัฒนาและทดสอบระบบ

---

## 3. วิธีการรันในเครื่องพัฒนา (Local Development)
1. ติดตั้ง Node.js (เวอร์ชัน 18 ขึ้นไปแนะนำ)
2. เข้ามาที่โฟลเดอร์ `backend02`
3. ติดตั้ง npm packages:
   ```bash
   npm install
   ```
4. คัดลอกและตั้งค่าไฟล์ `.env` (ระบุรายละเอียดของ MS SQL Server):
   ```env
   DB_SERVER=192.168.10.99
   DB_PORT=1433
   DB_NAME=KEP_LOG
   DB_USER=operation
   DB_PASSWORD=YourPassword
   PORT=8000
   ```
5. รันระบบ:
   ```bash
   npm start
   ```
   หรือรันด้วยโหมดตรวจสอบความเปลี่ยนแปลง (Node.js 18+):
   ```bash
   node --watch server.js
   ```

---

## 4. คู่มือการติดตั้งบน IIS (Windows Server Deploy Guide) ด้วย `iisnode`

การรันโปรเจค Node.js ผ่าน module **iisnode** จะช่วยให้ IIS จัดการ Process ของ Node.js (เช่น การเพิ่ม Process การรีสตาร์ทเมื่อแอปพัง การจัดการ log) ได้อย่างง่ายดายโดยไม่ต้องลง NSSM

### ข้อกำหนดเบื้องต้น
1. ติดตั้ง **Node.js** บนเครื่องเซิร์ฟเวอร์
2. ติดตั้ง **IIS (Internet Information Services)** บน Windows Server
3. ติดตั้ง Extension ของ IIS 3 ตัว:
   * **URL Rewrite**: [https://www.iis.net/downloads/microsoft/url-rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
   * **Application Request Routing (ARR)**: [https://www.iis.net/downloads/microsoft/application-request-routing](https://www.iis.net/downloads/microsoft/application-request-routing)
   * **iisnode module for IIS**: ดาวน์โหลดตัวติดตั้ง `iisnode-x64.msi` ได้จาก GitHub ของ [iisnode](https://github.com/tjanczuk/iisnode/releases)

---

### ขั้นตอนติดตั้ง

#### ขั้นตอนที่ 1: เตรียมโค้ดและติดตั้ง Dependencies
1. คัดลอกโฟลเดอร์ `backend02` ไปยังเซิร์ฟเวอร์ เช่น `C:\inetpub\wwwroot\LaminateReport\backend02`
2. เปิด Command Prompt ด้วยสิทธิ์ **Administrator** เข้าไปยังโฟลเดอร์นั้นแล้วรัน:
   ```cmd
   cd C:\inetpub\wwwroot\LaminateReport\backend02
   npm install --production
   ```
3. แก้ไขและบันทึกไฟล์ `.env` สำหรับฐานข้อมูลในโฟลเดอร์เดียวกันให้เรียบร้อย

#### ขั้นตอนที่ 2: ตั้งค่าสิทธิ์โฟลเดอร์ (Folder Permissions)
เนื่องจาก `iisnode` จะต้องสร้างโฟลเดอร์สำหรับเก็บ log การรันระบบ (`iisnode/`) ภายในโปรเจค:
1. คลิกขวาที่โฟลเดอร์ `backend02` -> **Properties** -> ไปที่แท็บ **Security**
2. กด **Edit...** -> ค้นหาหรือเพิ่มกลุ่มผู้ใช้ `IIS_IUSRS` (หรือผู้ใช้ของ Application Pool ที่จะตั้งค่า เช่น `IIS AppPool\LaminateAppPool`)
3. ให้สิทธิ์ **Read**, **Write**, **Modify** แล้วกด **OK**

#### ขั้นตอนที่ 3: ลงทะเบียนแอปพลิเคชันบน IIS Manager
1. เปิด **IIS Manager**
2. คลิกขวาที่ **Sites** -> **Add Website...** หรือคลิกขวาที่เว็บไซต์เดิมแล้วเลือก **Add Application...**
   * **Alias**: เช่น `backend`
   * **Physical Path**: ชี้ไปที่ `C:\inetpub\wwwroot\LaminateReport\backend02`
   * **Application Pool**: เลือก Application Pool ที่มี Node.js ติดตั้งอยู่ (แนะนำให้เลือก AppPool ที่ตั้งค่าการจัดการแบบ **No Managed Code**)
3. กด **OK**

#### ขั้นตอนที่ 4: ตรวจสอบไฟล์ `web.config`
ในโฟลเดอร์ `backend02` มีไฟล์ `web.config` เตรียมไว้เรียบร้อยแล้ว โดยทำหน้าที่:
1. ลงทะเบียนไฟล์ `server.js` ให้เป็น Node.js handler สำหรับ `iisnode`
2. เปิดใช้ URL Rewrite ส่งผ่านทุก Request ไปยัง `server.js` เพื่อให้ Express ทำหน้าที่เราท์ต่อ
3. ซ่อนโฟลเดอร์ `node_modules` และไฟล์ `.env` ไม่ให้บุคคลภายนอกเข้าถึงผ่าน HTTP

ทดสอบเข้าใช้งานผ่านบราวเซอร์ที่ `http://your-server-ip/backend/` (หรือตาม URL ที่ตั้ง binding ไว้ใน IIS)
หากถูกต้อง ระบบจะแสดงข้อมูลสถานะ `online` ทันที!
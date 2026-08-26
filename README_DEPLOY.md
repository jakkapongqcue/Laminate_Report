# คู่มือการติดตั้ง (Deploy) Node.js Express บน IIS ด้วย `iisnode` (Windows Server)

เอกสารนี้อธิบายขั้นตอนการติดตั้งระบบ **Laminate Checking Report** ทั้งส่วนของ Backend (Node.js + Express) และ Frontend (Vue 3) บน Windows Server โดยรัน Node.js นามธรรมผ่าน IIS Module ชื่อ **iisnode**

---

## 1. ข้อกำหนดเบื้องต้น (Prerequisites)

1. **Node.js (เวอร์ชัน 18+)**: ติดตั้ง Node.js ลงในซิร์ฟเวอร์
   - **Node.js Download**: [ดาวน์โหลด Node.js](https://nodejs.org/en/download)

   ### หาก Node.js ไม่ทำงาน (Node not work)

   **วิธีตั้งค่า Environment Variable ใน Windows**
   1. เปิดเมนู Start แล้วพิมพ์ **Edit the system environment variables**
   2. คลิก **Environment Variables…**
   3. ใน **User variables** หรือ **System variables** คลิก **New…**
   4. ตั้ง **Variable name** เป็น `NODE_SKIP_PLATFORM_CHECK` และ **Variable value** เป็น `1`
   5. คลิก **OK** ทุกหน้าต่างแล้วรีสตาร์ทคอมพิวเตอร์
   6. **IIS (Internet Information Services)**: พร้อมติดตั้ง IIS Module 3 ตัว:

2. **URL Rewrite**: [ดาวน์โหลด URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)

3. **iisnode full version (x64)**: [ดาวน์โหลด iisnode จาก GitHub Releases](https://github.com/tjanczuk/iisnode/releases) (ดาวน์โหลดเวอร์ชันล่าสุดที่เป็น `.msi`)

- หลังจากติดตั้ง iisnode แล้ว ตัวไฟล์จะเก็บอยู่ที่ Drive `C:\Program Files\iisnode` จากนั้นเข้า cmd ด้วย admin mode พิมพ์คำสั่ง setupsample-s.bat จะขึ้นข้อมูลแบบในรูป รอให้กด any key to continue หลังจากติดตั้ง sucsess แล้วจะขึ้นลิ้งด้านล่าง ให้ทดลองเข้าดู จะได้หน้าเว็บ sample `http://localhost/node/`แสดงว่าพร้อมใช้งานแล้ว

4. **MS SQL Server**: สิทธิ์เชื่อมต่อฐานข้อมูล `KEP_LOG` และ View `View_1LB09_Bobst`

---

## 2. ตัวอย่างโครงสร้างโฟลเดอร์สำหรับติดตั้งบน IIS (Folder Layout)

```text
C:\webapp\LaminateReport\
  ├── frontend\           <-- เก็บไฟล์ Vue 3 frontend (dist/*) และ web.config หลัก
  └── backend\         <-- เก็บไฟล์ Express backend และ web.config ของ iisnode
```

---

## 3. ขั้นตอนติดตั้ง Backend (`backend02`)

1. คัดลอกโฟลเดอร์ `backend02/` ไปไว้ที่เซิร์ฟเวอร์ เช่น `C:\webapp\LaminateReport\backend`
2. เปิด Command Prompt ด้วยสิทธิ์ **Administrator** เพื่อติดตั้ง dependencies:

   ```cmd
   npm install --production
   ```

3. กำหนดข้อมูลการเชื่อมต่อฐานข้อมูล SQL Server ในไฟล์ `.env` ที่อยู่ในโฟลเดอร์ `backend`:
   ```env
   DB_SERVER=192.168.10.99
   DB_PORT=1433
   DB_NAME=KEP_LOG
   DB_USER=operation
   DB_PASSWORD=[YourPassword]
   ```

---

## 4. ขั้นตอนติดตั้ง Frontend

1. บนเครื่องพัฒนา ให้รันคำสั่ง Build หน้าจอ Vue 3:

   ```cmd
   npm run build
   ```

2. คัดลอกเนื้อหาทั้งหมดในโฟลเดอร์ `dist` (ที่ได้จากข้อ 1) ไปไว้บนเซิร์ฟเวอร์:
   - ปลายทาง: `C:\webapp\LaminateReport\frontend`
3. ตรวจสอบให้มั่นใจว่าที่ `frontend` มีไฟล์ `web.config` สำหรับควบคุมการ Rewrite ของหน้าจอ SPA (รายละเอียดด้านล่าง)

---

## 5. การตั้งค่าบน IIS Manager

### 5.1 ตั้งค่า Application Pool

1. เปิด **IIS Manager** -> ไปที่ **Application Pools**
2. คลิกขวา -> **Add Application Pool...**
   - Name: `LaminateReportPool`
   - .NET CLR version: **No Managed Code** (เนื่องจาก Node.js ไม่ใช่โค้ด .NET)
3. กด **OK**

### 5.2 ตั้งค่าเว็บไซต์หลัก (Frontend)

1. ไปที่ **Sites** -> คลิกขวา -> **Add Website...**
   - Site name: `LaminateReport`
   - Physical path: `C:\webapp\LaminateReport\frontend`
   - Binding: พอร์ต 80 หรือพอร์ตที่คุณต้องการ
2. กด **OK**

### 5.3 ตั้งค่าแอปย่อยของ API (Backend)

เพื่อให้ฟรอนต์เอนด์สามารถเรียกใช้งานเส้นทาง `/api` ได้โดยไม่ต้องผ่าน Port proxy:

1. คลิกขวาที่ไซต์ `LaminateReport` -> เลือก **Add Application...**
   - Alias: `api` _(ต้องตรงกับ path ที่ฟรอนต์เอนด์ส่งคำขอมา)_
   - Physical path: `C:\webapp\LaminateReport\backend`
   - Application pool: `LaminateReportPool`
2. กด **OK**

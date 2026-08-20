# คู่มือการติดตั้ง (Deploy) Node.js Express บน IIS ด้วย `iisnode` (Windows Server)

เอกสารนี้อธิบายขั้นตอนการติดตั้งระบบ **Laminate Checking Report** ทั้งส่วนของ Backend (Node.js + Express) และ Frontend (Vue 3) บน Windows Server โดยรัน Node.js นามธรรมผ่าน IIS Module ชื่อ **iisnode**

---

## 1. ข้อกำหนดเบื้องต้น (Prerequisites)

1. **Node.js (เวอร์ชัน 18+)**: ติดตั้ง Node.js ลงในเซิร์ฟเวอร์
2. **IIS (Internet Information Services)**: พร้อมติดตั้ง IIS Module 3 ตัว:
   * **URL Rewrite**: [ดาวน์โหลด URL Rewrite](https://www.iis.net/downloads/microsoft/url-rewrite)
   * **Application Request Routing (ARR)**: [ดาวน์โหลด ARR](https://www.iis.net/downloads/microsoft/application-request-routing)
   * **iisnode (x64)**: [ดาวน์โหลด iisnode จาก GitHub Releases](https://github.com/tjanczuk/iisnode/releases) (ดาวน์โหลดเวอร์ชันล่าสุดที่เป็น `.msi`)
3. **MS SQL Server**: สิทธิ์เชื่อมต่อฐานข้อมูล `KEP_LOG` และ View `View_1LB09_Bobst`

---

## 2. โครงสร้างโฟลเดอร์สำหรับติดตั้งบน IIS (Folder Layout)

เราแนะนำรูปแบบ **Sub-Application (แอปย่อย)** ซึ่งเป็นการใช้เว็บไซต์หลักพอร์ต 80/443 บริการหน้าจอ Vue 3 และมีโฟลเดอร์ย่อย `/api` เป็น Node.js API:

```text
C:\inetpub\wwwroot\LaminateReport\
  ├── wwwroot\           <-- เก็บไฟล์ Vue 3 frontend (dist/*) และ web.config หลัก
  └── backend02\         <-- เก็บไฟล์ Express backend และ web.config ของ iisnode
```

---

## 3. ขั้นตอนติดตั้ง Backend (`backend02`)

1. คัดลอกโฟลเดอร์ `backend02/` ไปไว้ที่เซิร์ฟเวอร์ เช่น `C:\inetpub\wwwroot\LaminateReport\backend02`
2. เปิด Command Prompt ด้วยสิทธิ์ **Administrator** เพื่อติดตั้ง dependencies:
   ```cmd
   cd C:\inetpub\wwwroot\LaminateReport\backend02
   npm install --production
   ```
3. กำหนดข้อมูลการเชื่อมต่อฐานข้อมูล SQL Server ในไฟล์ `.env` ที่อยู่ในโฟลเดอร์ `backend02`:
   ```env
   DB_SERVER=192.168.10.99
   DB_PORT=1433
   DB_NAME=KEP_LOG
   DB_USER=operation
   DB_PASSWORD=YourPassword
   PORT=8000
   ```
4. **ตั้งค่าสิทธิ์ให้ Application Pool สามารถสร้าง log ได้**:
   * คลิกขวาที่โฟลเดอร์ `backend02` -> **Properties** -> ไปที่แท็บ **Security**
   * กด **Edit...** -> กด **Add...** -> พิมพ์คำว่า `IIS_IUSRS` -> ติ๊กเลือกสิทธิ์ **Modify**, **Read & execute**, **Write** แล้วกด **OK** (เพื่ออนุญาตให้ `iisnode` เขียนล็อกไฟล์ลงในโฟลเดอร์แอป)

---

## 4. ขั้นตอนติดตั้ง Frontend

1. บนเครื่องพัฒนา ให้รันคำสั่ง Build หน้าจอ Vue 3:
   ```cmd
   cd frontend
   npm run build
   ```
2. คัดลอกเนื้อหาทั้งหมดในโฟลเดอร์ `frontend/dist` ไปไว้บนเซิร์ฟเวอร์ เช่น `C:\inetpub\wwwroot\LaminateReport\wwwroot`
3. ตรวจสอบให้มั่นใจว่าที่ `wwwroot` มีไฟล์ `web.config` สำหรับควบคุมการ Rewrite ของหน้าจอ SPA (รายละเอียดด้านล่าง)

---

## 5. การตั้งค่าบน IIS Manager

### 5.1 ตั้งค่า Application Pool
1. เปิด **IIS Manager** -> ไปที่ **Application Pools**
2. คลิกขวา -> **Add Application Pool...**
   * Name: `LaminateReportPool`
   * .NET CLR version: **No Managed Code** (เนื่องจาก Node.js ไม่ใช่โค้ด .NET)
3. กด **OK**

### 5.2 ตั้งค่าเว็บไซต์หลัก (Frontend)
1. ไปที่ **Sites** -> คลิกขวา -> **Add Website...**
   * Site name: `LaminateReport`
   * Physical path: `C:\inetpub\wwwroot\LaminateReport\wwwroot`
   * Binding: พอร์ต 80 หรือพอร์ตที่คุณต้องการ
2. กด **OK**

### 5.3 ตั้งค่าแอปย่อยของ API (Backend)
เพื่อให้ฟรอนต์เอนด์สามารถเรียกใช้งานเส้นทาง `/api` ได้โดยไม่ต้องผ่าน Port proxy:
1. คลิกขวาที่ไซต์ `LaminateReport` -> เลือก **Add Application...**
   * Alias: `api` *(ต้องตรงกับ path ที่ฟรอนต์เอนด์ส่งคำขอมา)*
   * Physical path: `C:\inetpub\wwwroot\LaminateReport\backend02`
   * Application pool: `LaminateReportPool`
2. กด **OK**

---

## 6. โครงสร้างไฟล์ Config บน IIS

### 6.1 ไฟล์ `backend02/web.config` (สร้างอัตโนมัติแล้ว)
ไฟล์นี้อยู่ในโฟลเดอร์ backend ทำหน้าที่ลงทะเบียน `server.js` กับ `iisnode`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <iisnode node_env="production" />
    <handlers>
      <add name="iisnode" path="server.js" verb="*" modules="iisnode" />
    </handlers>
    <rewrite>
      <rules>
        <rule name="NodeJS" stopProcessing="true">
          <match url="(.*)" />
          <action type="Rewrite" url="server.js" />
        </rule>
      </rules>
    </rewrite>
    <security>
      <requestFiltering>
        <hiddenSegments>
          <add segment="node_modules" />
          <add segment=".env" />
        </hiddenSegments>
      </requestFiltering>
    </security>
  </system.webServer>
</configuration>
```

### 6.2 ไฟล์ `wwwroot/web.config` (สำหรับ Vue 3 SPA)
ไฟล์นี้เก็บไว้ในโฟลเดอร์ของฟรอนต์เอนด์ เพื่ออำนวยความสะดวกในการเปลี่ยน URL ของ Vue Route โดยไม่แสดง Error 404:
```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <rule name="VueJS Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## 7. ตรวจสอบสถานะการทำงาน (Verification)

* **เช็ค Backend**: เปิดบราวเซอร์ไปที่ `http://your-server-ip/api/` หรือ `http://your-server-ip/api/machines`
* **เช็ค Frontend**: เปิดบราวเซอร์ไปที่ `http://your-server-ip/`
* **ล็อกการรัน Node.js**: หากมีข้อผิดพลาด เกิดขึ้นระหว่างการรัน Node.js `iisnode` จะบันทึกไฟล์ล็อกไว้ที่ `C:\inetpub\wwwroot\LaminateReport\backend02\iisnode\` ซึ่งสามารถเข้าไปเปิดดูเพื่อตรวจสอบ stack trace ได้

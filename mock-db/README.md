# Mock Database — MS SQL Server Express บน Docker

คู่มือการติดตั้ง ใช้งาน และจัดการฐานข้อมูลจำลอง MS SQL Server Express บน Docker สำหรับโปรเจกต์ **Laminate Checking Report** เพื่อใช้ในการพัฒนาและทดสอบระบบแบบ Offline / Local Development โดยไม่ต้องเชื่อมต่อเซิร์ฟเวอร์จริงของโรงงาน

---

## 1. ภาพรวมของระบบจำลอง (Overview)

Docker Container นี้จำลอง **2 ฐานข้อมูล** บน SQL Server Instance เดียวกัน (พอร์ต `1433`):

| ฐานข้อมูล             | ผู้ใช้งาน (User) | รหัสผ่าน (Password) | วัตถุประสงค์                                                        |
| :-------------------- | :--------------- | :------------------ | :------------------------------------------------------------------ |
| **`KEP_LOG`**         | `operation`      | `Welcome2026!`      | เก็บข้อมูลเซนเซอร์ Time-Series ของเครื่องจักร (1LB09, 1PG06, 1BF01) |
| **`AX50_SF_PRD_SP1`** | `ViewReportAPI`  | `Welcome2026!`      | เก็บข้อมูลสูตร/สเปกการผลิต (Set Point) และชื่อสินค้าจาก Dynamics AX |
| _(Admin)_             | `sa`             | `Welcome2026!`      | ผู้ดูแลระบบสิทธิ์สูงสุด (System Administrator)                      |

---

## 2. สิ่งที่ต้องเตรียมก่อนเริ่ม (Prerequisites)

1. ติดตั้งและเปิดใช้งาน **Docker Desktop** บน Windows
2. ตรวจสอบว่าพอร์ต `1433` บนเครื่องยังว่างอยู่ (ไม่มี SQL Server ในเครื่องเปิดทับซ้อน)

---

## 3. ขั้นตอนการติดตั้งและเริ่มต้นใช้งาน (Quick Start)

เปิด **Command Prompt (CMD)** หรือ **PowerShell** แล้วเข้าไปที่โฟลเดอร์ `mock-db`:

```bash
cd mock-db
```

### ขั้นตอนที่ 1: สตาร์ท Docker Container

รันคำสั่งเพื่อสร้างและเปิด Container ในโหมด Background:

```bash
docker compose up -d
```

> ตรวจสอบสถานะ: รัน `docker ps` จะเห็น Container ชื่อ **`sqlserver_express_mock`** อยู่ในสถานะ `Up`

---

### ขั้นตอนที่ 2: สร้างฐานข้อมูลและกำหนดสิทธิ์ผู้ใช้ (`init-db.sql`)

เลือกคำสั่งตาม Terminal ที่คุณใช้งาน:

#### หากใช้ **PowerShell** (แนะนำ):

```powershell
Get-Content init-db.sql -Raw | docker exec -i sqlserver_express_mock /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Welcome2026!" -C
```

#### หากใช้ **Command Prompt (CMD)**:

```cmd
type init-db.sql | docker exec -i sqlserver_express_mock /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Welcome2026!" -C
```

> **ผลลัพธ์**: จะแสดงข้อความ `=== Initialized KEP_LOG & AX50_SF_PRD_SP1 Successfully ===`

---

### ขั้นตอนที่ 3: นำเข้าโครงสร้างตารางและข้อมูลจำลอง (`seed-mock-data.sql`)

เลือกคำสั่งตาม Terminal ที่คุณใช้งาน:

#### หากใช้ **PowerShell** (แนะนำ):

```powershell
Get-Content seed-mock-data.sql -Raw | docker exec -i sqlserver_express_mock /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Welcome2026!" -C
```

#### หากใช้ **Command Prompt (CMD)**:

```cmd
type seed-mock-data.sql | docker exec -i sqlserver_express_mock /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "Welcome2026!" -C
```

> **ผลลัพธ์**: จะแสดงข้อความ `=== Seed Mock Data Created Successfully ===`

---

### ขั้นตอนที่ 4: ตั้งค่าไฟล์ `backend/.env` เพื่อเชื่อมต่อ

ตรวจสอบไฟล์ `backend/.env` ให้ชี้ Host มาที่ `localhost`:

```env
# การเชื่อมต่อ KEP_LOG จำลองบน Docker
DB_SERVER=localhost
DB_PORT=1433
DB_NAME=KEP_LOG
DB_USER=operation
DB_PASSWORD=Welcome2026!

# การเชื่อมต่อ Dynamics AX จำลองบน Docker
AX_DB_SERVER=localhost
AX_DB_PORT=1433
AX_DB_NAME=AX50_SF_PRD_SP1
AX_DB_USER=ViewReportAPI
AX_DB_PASSWORD=Welcome2026!

PORT=8000
```

---

## 4. ข้อมูลตัวอย่างที่มีให้ทดสอบ (Sample Data Reference)

### 4.1 รหัสสินค้าสำหรับทดสอบค้นหา (Item FG)

คุณสามารถนำรหัสเหล่านี้ไปพิมพ์ค้นหาในหน้าเว็บแอปพลิเคชันได้ทันที:

| รหัส Item FG        | ชื่อสินค้าตัวอย่าง                       | เครื่องจักร | กระบวนการ (Process)                          |
| :------------------ | :--------------------------------------- | :---------- | :------------------------------------------- |
| **`FG-SNACK-001`**  | ซองขนมขบเคี้ยว กรุบกรอบ รสบาร์บีคิว 50g  | `1LB-09`    | **Solvent Base Gravure** (`DETAILINDEX = 1`) |
| **`FG-COFFEE-002`** | ซองกาแฟสำเร็จรูป 3-in-1 หอมกรุ่น 20g     | `1LB-09`    | **Solvent Free** (`DETAILINDEX = 2`)         |
| **`FG-POUCH-003`**  | ถุงตั้งรีฟิล น้ำยาปรับผ้านุ่ม 500ml      | `1LB-09`    | **Solvent Base Flexo** (`DETAILINDEX = 3`)   |
| **`FG-PRINT-001`**  | ม้วนฟิล์มพิมพ์ลาย Snack BBQ 50g          | `1PG-06`    | Printing Standard                            |
| **`FG-FILM-001`**   | ฟิล์ม LLDPE หน้ากว้าง 1000mm ความหนา 50u | `1BF-01`    | BlownFilm Standard                           |

### 4.2 ข้อมูลเซนเซอร์ใน `KEP_LOG`

- **ช่วงวันที่**: ระบบสร้างข้อมูลย้อนหลัง **3 วันล่าสุดจนถึงวันนี้**
- **ช่วงเวลา**: ทุกๆ **10 นาที** ระหว่าง **08:00 – 17:00 น.** (มีกว่า 220+ แถวต่อเครื่อง)
- **สถานะ Online**: มีการบันทึกเรคคอร์ดล่าสุดเมื่อ 2 นาทีที่แล้ว เพื่อให้หน้าเว็บขึ้นสถานะ **"Online" สีเขียว** ทันที

---

## 5. คำสั่งจัดการ Docker ที่ใช้บ่อย (Docker Cheatsheet)

| การทำงาน                                  | คำสั่ง                                  |
| :---------------------------------------- | :-------------------------------------- |
| **เปิดใช้งาน Container**                  | `docker compose up -d`                  |
| **หยุดทำงานชั่วคราว (ไม่ลบข้อมูล)**       | `docker compose stop`                   |
| **เปิดใช้งานต่อจากเดิม**                  | `docker compose start`                  |
| **รีสตาร์ท Container**                    | `docker compose restart`                |
| **ดู Log การทำงาน**                       | `docker logs -f sqlserver_express_mock` |
| **ลบ Container และล้างข้อมูลทั้งหมดทิ้ง** | `docker compose down -v`                |

---

## 6. การเชื่อมต่อผ่านโปรแกรมภายนอก (SSMS / DBeaver)

หากต้องการเปิดดูตารางหรือเขียน Query ผ่านโปรแกรมจัดการฐานข้อมูล เช่น **SSMS**, **DBeaver** หรือ **VS Code (mssql)**:

- **Server / Host**: `localhost,1433`
- **Authentication**: `SQL Server Authentication`
- **Username**: `sa` หรือ `operation` หรือ `ViewReportAPI`
- **Password**: `Welcome2026!`
- **Trust Server Certificate**: ✅ ติ๊กถูกเสมอ (จำเป็นสำหรับ SQL Server 2022)

---

## 7. ข้อพึงระวังและข้อผิดพลาดที่พบบ่อย (Gotchas)

1. **PowerShell ไม่รองรับเครื่องหมาย `<`**:
   - หากรัน `sqlcmd ... < seed.sql` ใน PowerShell จะเกิด Error: `The '<' operator is reserved for future use`
   - **วิธีแก้**: ให้ใช้ `Get-Content <file> -Raw | docker exec -i ...` แทน
2. **ติดปัญหาใบรับรอง SSL (Certificate Error)**:
   - คำสั่ง `sqlcmd` ใน SQL Server 2022 ต้องใส่พารามิเตอร์ `-C` (Trust Server Certificate) เสมอ
3. **การสลับกลับไปใช้เครื่องจริง**:
   - เมื่อต้องการต่อเครื่องจริง เพียงแค่แก้ค่า `DB_SERVER=192.168.10.99` และ `AX_DB_SERVER=AXDB` ในไฟล์ `backend/.env` แล้วรีสตาร์ท Backend

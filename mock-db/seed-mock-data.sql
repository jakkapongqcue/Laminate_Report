-- ==============================================================
-- 1. AX50_SF_PRD_SP1 (Dynamics AX Mock Tables & Data)
-- ==============================================================
USE [AX50_SF_PRD_SP1];
GO

-- 1.1 ตาราง SF_ViewInventTable_SF (ข้อมูลชื่อสินค้าและ Production Pool)
IF OBJECT_ID(
    N'[dbo].[SF_ViewInventTable_SF]',
    N'U'
) IS NOT NULL
DROP TABLE [dbo].[SF_ViewInventTable_SF];
GO

CREATE TABLE [dbo].[SF_ViewInventTable_SF] (
    [ITEMID] VARCHAR(50) NOT NULL,
    [ITEMNAME] NVARCHAR(255) NULL,
    [PRODPOOLID] VARCHAR(50) NULL,
    CONSTRAINT [PK_SF_ViewInventTable_SF] PRIMARY KEY ([ITEMID])
);
GO

-- 1.2 ตาราง SF_PRODSPECMACHINE (สูตรและสเปกพารามิเตอร์)
IF OBJECT_ID(
    N'[dbo].[SF_PRODSPECMACHINE]',
    N'U'
) IS NOT NULL
DROP TABLE [dbo].[SF_PRODSPECMACHINE];
GO

CREATE TABLE [dbo].[SF_PRODSPECMACHINE] (
    [RECID] BIGINT IDENTITY(1, 1) PRIMARY KEY,
    [REVID] INT DEFAULT 1,
    [MACHINE] VARCHAR(50) NOT NULL,
    [ITEMFG] VARCHAR(50) NOT NULL,
    [ITEMID] VARCHAR(50) NOT NULL,
    [DETAILINDEX] INT DEFAULT 1,
    -- Laminate Standard Spec Columns
    [SPEED1] VARCHAR(50) NULL,
    [SPEED2] VARCHAR(50) NULL,
    [TEMPZONE11] VARCHAR(50) NULL,
    [TEMPZONE21] VARCHAR(50) NULL,
    [TEMPZONE31] VARCHAR(50) NULL,
    [TEMPZONE41] VARCHAR(50) NULL,
    [TEMPTANKA1] VARCHAR(50) NULL,
    [TEMPTANKA2] VARCHAR(50) NULL,
    [ADHESIVEHOSEAB1] VARCHAR(50) NULL,
    [COATINGUNITHEAT1] VARCHAR(50) NULL,
    [LAMINATEHEAT1] VARCHAR(50) NULL,
    [UNWINDERTENSION11] VARCHAR(50) NULL,
    [UNWINDERTENSION21] VARCHAR(50) NULL,
    [REWINDER1] VARCHAR(50) NULL,
    [TAPERTENSION1] VARCHAR(50) NULL,
    [COATINGROLLERPRESSURE1] VARCHAR(50) NULL,
    [COATINGROLLERPRESSURE2] VARCHAR(50) NULL,
    [FEEDROLLERPRESSURE1] VARCHAR(50) NULL,
    [FEEDROLLERPRESSURE2] VARCHAR(50) NULL,
    [COATINGTENSION1] VARCHAR(50) NULL,
    [COATINGTENSION2] VARCHAR(50) NULL,
    [FEEDTENSION1] VARCHAR(50) NULL,
    [NIPROLLER1] VARCHAR(50) NULL,
    [NIPROLLER2] VARCHAR(50) NULL,
    [SMOOTINGROLL1] VARCHAR(50) NULL,
    [CORONATREAT11] VARCHAR(50) NULL,
    [CORONATREAT21] VARCHAR(50) NULL,
    [CORONA] VARCHAR(50) NULL,
    [CORONA2] VARCHAR(50) NULL,
    -- Printing Standard Spec Columns
    [LINELENGTH] VARCHAR(50) NULL,
    [COLOR1_ROLL] VARCHAR(50) NULL,
    [COLOR1_WORK] VARCHAR(50) NULL,
    -- BlownFilm Standard Spec Columns
    [TAKEOFF] VARCHAR(50) NULL,
    [NIP] VARCHAR(50) NULL,
    [THRUPUT] VARCHAR(50) NULL,
    [GAUGE] VARCHAR(50) NULL,
    [LAYFLAT] VARCHAR(50) NULL
);
GO

-- เพิ่มข้อมูลสินค้าจำลองใน AX
INSERT INTO
    [dbo].[SF_ViewInventTable_SF] (
        [ITEMID],
        [ITEMNAME],
        [PRODPOOLID]
    )
VALUES (
        'FG-SNACK-001',
        N'ซองขนมขบเคี้ยว กรุบกรอบ รสบาร์บีคิว 50g',
        'POOL-01'
    ),
    (
        'RM-SNACK-001',
        N'ฟิล์มพิมพ์ลาย Snack BBQ 50g',
        'POOL-01'
    ),
    (
        'FG-COFFEE-002',
        N'ซองกาแฟสำเร็จรูป 3-in-1 หอมกรุ่น 20g',
        'POOL-01'
    ),
    (
        'RM-COFFEE-002',
        N'ฟิล์มพิมพ์ลาย Coffee 3-in-1',
        'POOL-01'
    ),
    (
        'FG-POUCH-003',
        N'ถุงตั้งรีฟิล น้ำยาปรับผ้านุ่ม 500ml',
        'POOL-02'
    ),
    (
        'RM-POUCH-003',
        N'ฟิล์มพิมพ์ลาย Softener Pouch 500ml',
        'POOL-02'
    ),
    (
        'FG-PRINT-001',
        N'ม้วนฟิล์มพิมพ์ลาย Snack BBQ 50g (Printing)',
        'POOL-01'
    ),
    (
        'FG-FILM-001',
        N'ฟิล์ม LLDPE หน้ากว้าง 1000mm ความหนา 50u',
        'POOL-03'
    );
GO

-- สเปกเครื่อง 1LB-09 (Laminate)
-- รายการที่ 1: Solvent Base Gravure (DETAILINDEX = 1)
INSERT INTO
    [dbo].[SF_PRODSPECMACHINE] (
        [REVID],
        [MACHINE],
        [ITEMFG],
        [ITEMID],
        [DETAILINDEX],
        [SPEED1],
        [SPEED2],
        [TEMPZONE11],
        [TEMPZONE21],
        [TEMPZONE31],
        [TEMPZONE41],
        [LAMINATEHEAT1],
        [COATINGUNITHEAT1],
        [UNWINDERTENSION11],
        [UNWINDERTENSION21],
        [REWINDER1],
        [TAPERTENSION1],
        [COATINGROLLERPRESSURE1],
        [COATINGROLLERPRESSURE2],
        [NIPROLLER1],
        [NIPROLLER2],
        [CORONA],
        [CORONA2]
    )
VALUES (
        1,
        '1LB-09',
        'FG-SNACK-001',
        'RM-SNACK-001',
        1,
        '200',
        '180',
        '60-65',
        '65-70',
        '70-75',
        '75-80',
        '65',
        '35',
        '15',
        '18',
        '22',
        '35',
        '2.5',
        '2.5',
        '3.0',
        '3.0',
        '1.5',
        '1.2'
    );

-- รายการที่ 2: Solvent Free (DETAILINDEX = 2)
INSERT INTO
    [dbo].[SF_PRODSPECMACHINE] (
        [REVID],
        [MACHINE],
        [ITEMFG],
        [ITEMID],
        [DETAILINDEX],
        [SPEED1],
        [SPEED2],
        [TEMPTANKA1],
        [TEMPTANKA2],
        [ADHESIVEHOSEAB1],
        [COATINGUNITHEAT1],
        [LAMINATEHEAT1],
        [UNWINDERTENSION11],
        [UNWINDERTENSION21],
        [REWINDER1],
        [TAPERTENSION1],
        [FEEDROLLERPRESSURE1],
        [FEEDROLLERPRESSURE2],
        [NIPROLLER1],
        [NIPROLLER2],
        [CORONA],
        [CORONA2]
    )
VALUES (
        1,
        '1LB-09',
        'FG-COFFEE-002',
        'RM-COFFEE-002',
        2,
        '250',
        '220',
        '45',
        '45',
        '50',
        '40',
        '60',
        '12',
        '15',
        '20',
        '30',
        '2.2',
        '2.2',
        '2.8',
        '2.8',
        '1.8',
        '1.5'
    );

-- รายการที่ 3: Solvent Base Flexo (DETAILINDEX = 3)
INSERT INTO
    [dbo].[SF_PRODSPECMACHINE] (
        [REVID],
        [MACHINE],
        [ITEMFG],
        [ITEMID],
        [DETAILINDEX],
        [SPEED1],
        [SPEED2],
        [TEMPZONE11],
        [TEMPZONE21],
        [UNWINDERTENSION11],
        [UNWINDERTENSION21],
        [REWINDER1],
        [NIPROLLER1],
        [NIPROLLER2],
        [CORONA],
        [CORONA2]
    )
VALUES (
        1,
        '1LB-09',
        'FG-POUCH-003',
        'RM-POUCH-003',
        3,
        '180',
        '160',
        '55-60',
        '60-65',
        '14',
        '16',
        '21',
        '3.2',
        '3.2',
        '1.4',
        '1.2'
    );

-- สเปกเครื่อง 1PG-06 (Printing)
INSERT INTO
    [dbo].[SF_PRODSPECMACHINE] (
        [REVID],
        [MACHINE],
        [ITEMFG],
        [ITEMID],
        [DETAILINDEX],
        [SPEED1],
        [LINELENGTH]
    )
VALUES (
        1,
        '1PG-06',
        'FG-PRINT-001',
        'FG-PRINT-001',
        1,
        '220',
        '5000'
    );

-- สเปกเครื่อง 1BF-01 (BlownFilm)
INSERT INTO
    [dbo].[SF_PRODSPECMACHINE] (
        [REVID],
        [MACHINE],
        [ITEMFG],
        [ITEMID],
        [DETAILINDEX],
        [SPEED1],
        [TAKEOFF],
        [NIP],
        [THRUPUT],
        [GAUGE],
        [LAYFLAT]
    )
VALUES (
        1,
        '1BF-01',
        'FG-FILM-001',
        'FG-FILM-001',
        1,
        '35',
        '35.5',
        '2.8',
        '180',
        '50',
        '1000'
    );
GO

-- ==============================================================
-- 2. KEP_LOG (SCADA / IoT Sensor Mock Tables & Time-Series Data)
-- ==============================================================
USE [KEP_LOG];
GO

-- 2.1 ตารางเซนเซอร์เครื่อง 1LB09 (Bobst)
IF OBJECT_ID(
    N'[dbo].[View_1LB09_Bobst]',
    N'U'
) IS NOT NULL
DROP TABLE [dbo].[View_1LB09_Bobst];
GO

CREATE TABLE [dbo].[View_1LB09_Bobst] (
    [SERVER TIMESTAMP] DATETIME NOT NULL,
    [Machine : Speed] FLOAT NULL,
    [Tunnel : Zone 1 : Temperature] FLOAT NULL,
    [Tunnel : Zone 2 : Temperature] FLOAT NULL,
    [Coating 1- Metering and blade roller- Water- Temperature] FLOAT NULL,
    [Laminator : Hot Roll : Water Temperature] FLOAT NULL,
    [Unwinder 1 : Tension] FLOAT NULL,
    [Unwinder 2 : Tension] FLOAT NULL,
    [Rewinder : Tension] FLOAT NULL,
    [Rewinder : Tension Taper] FLOAT NULL,
    [Coating : Rotogravure Trolley : CoatingRoll : Nip : Operator : Pressure] FLOAT NULL,
    [Coating : Rotogravure Trolley : CoatingRoll : Nip : Motor : Pressure] FLOAT NULL,
    [Coating : SI Transfer Roll : Operator : Pressure] FLOAT NULL,
    [Coating : SI Transfer Roll : Motor : Pressure] FLOAT NULL,
    [Coating : Inlet : Tension] FLOAT NULL,
    [Coating : Outlet : Tension] FLOAT NULL,
    [Unwinder 2 : Infeed ( D.g ) - Tension] FLOAT NULL,
    [Laminator : Nip Roll : Operator : Pressure] FLOAT NULL,
    [Laminator : Nip Roll : Motor : Pressure] FLOAT NULL,
    [Coating : Rotogravure Trolley : Smoothing Roll Speed] FLOAT NULL,
    [Unwinder 1 : Treatment : Specific Power] FLOAT NULL,
    [Unwinder 2 : Corona : Specific Power] FLOAT NULL
);
GO

-- 2.2 ตารางเซนเซอร์เครื่อง 1PG06 (Caida - Printing)
IF OBJECT_ID(
    N'[dbo].[View_1PG06_CAIDA]',
    N'U'
) IS NOT NULL
DROP TABLE [dbo].[View_1PG06_CAIDA];
GO

CREATE TABLE [dbo].[View_1PG06_CAIDA] (
    [SERVER TIMESTAMP] DATETIME NOT NULL,
    [CURRENT SPEED] FLOAT NULL,
    [TOTAL length] FLOAT NULL,
    [RewingA length] FLOAT NULL,
    [RewingB length] FLOAT NULL,
    [UnwingA length] FLOAT NULL,
    [UnwingB length] FLOAT NULL,
    [1U Roll C] FLOAT NULL,
    [1U WORK] FLOAT NULL,
    [2U Roll C] FLOAT NULL,
    [2U WORK] FLOAT NULL,
    [3U Roll C] FLOAT NULL,
    [3U WORK] FLOAT NULL,
    [4U Roll C] FLOAT NULL,
    [4U WORK] FLOAT NULL,
    [5U Roll C] FLOAT NULL,
    [5U WORK] FLOAT NULL,
    [6U Roll C] FLOAT NULL,
    [6U WORK] FLOAT NULL,
    [7U WORK] FLOAT NULL,
    [8U Roll C] FLOAT NULL,
    [8U WORK] FLOAT NULL,
    [9U Roll C] FLOAT NULL,
    [9U WORK] FLOAT NULL,
    [10U Roll C] FLOAT NULL,
    [10U WORK] FLOAT NULL,
    [11U Roll C] FLOAT NULL,
    [11U WORK] FLOAT NULL,
    [12U Roll C] FLOAT NULL,
    [12U WORK] FLOAT NULL,
    [13U Roll C] FLOAT NULL,
    [13U WORK] FLOAT NULL
);
GO

-- 2.3 ตารางเซนเซอร์เครื่อง 1BF01 (Blownfilm)
IF OBJECT_ID(
    N'[dbo].[View_1BF01_Blownfilm]',
    N'U'
) IS NOT NULL
DROP TABLE [dbo].[View_1BF01_Blownfilm];
GO

CREATE TABLE [dbo].[View_1BF01_Blownfilm] (
    [SERVER TIMESTAMP] DATETIME NOT NULL,
    [Take Off Link Speed] FLOAT NULL,
    [Take Off] FLOAT NULL,
    [Nip] FLOAT NULL,
    [DOS_HOFFSpeedSpt] FLOAT NULL,
    [DOS_HOFFSpeedSpt_int_1] FLOAT NULL,
    [Exhaust] FLOAT NULL,
    [Supply] FLOAT NULL,
    [Air Ring] FLOAT NULL,
    [Air ring height] FLOAT NULL,
    [Air Cooling Unit Supply Air] FLOAT NULL,
    [Layflat] FLOAT NULL,
    [DOS_LFWSpt] FLOAT NULL,
    [DOS_LFWSpt_int_1] FLOAT NULL,
    [Cage Height] FLOAT NULL,
    [Cage Bubble] FLOAT NULL,
    [Gauge] FLOAT NULL,
    [All Extruder set Thiknes] FLOAT NULL,
    [Thruput] FLOAT NULL,
    [All Extruder Thruput] FLOAT NULL,
    [DOS_ThroughputSpt_int_1] FLOAT NULL,
    [Feed plate Act] FLOAT NULL,
    [Feed plate Set] FLOAT NULL,
    [Housing bottom Act] FLOAT NULL,
    [Housing bottom Set] FLOAT NULL,
    [Housing Center Act] FLOAT NULL,
    [Housing Center Set] FLOAT NULL,
    [Die adapter Act] FLOAT NULL,
    [Die adapter Set] FLOAT NULL,
    [Die gap Act] FLOAT NULL,
    [Die gap Set] FLOAT NULL,
    [DIE1_Temp_Alm_Spt_time] FLOAT NULL,
    [Temperatures A] FLOAT NULL,
    [Temperatures] FLOAT NULL,
    [Pre-take-off tension] FLOAT NULL,
    [Rotation Angle Act] FLOAT NULL,
    [Rotation Angle Set Left] FLOAT NULL,
    [Rotation Angle Set Right] FLOAT NULL,
    [Rotator] FLOAT NULL,
    [Recipe] FLOAT NULL,
    [Order Number] FLOAT NULL
);
GO

-- ==============================================================
-- 3. เติมข้อมูล Time Series อัตโนมัติ (สำหรับ 3 วันล่าสุด + วันนี้)
-- ==============================================================

DECLARE @DayOffset INT = 0;
WHILE @DayOffset <= 3
BEGIN
    DECLARE @BaseDate DATETIME = DATEADD(DAY, -@DayOffset, CAST(GETDATE() AS DATE));
    
    -- วนลูปสร้างเวลาทุกๆ 10 นาที ตั้งแต่ 08:00 ถึง 17:00 (54 จุดต่อวัน)
    DECLARE @MinuteOffset INT = 480; -- 08:00 = 480 นาที
    WHILE @MinuteOffset <= 1020       -- 17:00 = 1020 นาที
    BEGIN
        DECLARE @CurrentTS DATETIME = DATEADD(MINUTE, @MinuteOffset, @BaseDate);
        
        -- สุ่มค่าผันแปรเล็กน้อยให้กราฟดูสมจริง
        DECLARE @Rnd FLOAT = RAND(CHECKSUM(NEWID()));
        DECLARE @Speed FLOAT = 195.0 + (@Rnd * 10.0);           -- ความเร็ว ~195 - 205 m/min
        DECLARE @Temp1 FLOAT = 62.0 + (@Rnd * 3.0);             -- อุณหภูมิ Zone 1 ~62 - 65 C
        DECLARE @Temp2 FLOAT = 67.0 + (@Rnd * 3.0);             -- อุณหภูมิ Zone 2 ~67 - 70 C
        DECLARE @TensUW1 FLOAT = 14.5 + (@Rnd * 1.5);           -- แรงดึง Unwind 1 ~14.5 - 16.0 N
        DECLARE @TensUW2 FLOAT = 17.5 + (@Rnd * 1.5);           -- แรงดึง Unwind 2 ~17.5 - 19.0 N
        DECLARE @TensRW FLOAT = 21.5 + (@Rnd * 1.5);            -- แรงดึง Rewind ~21.5 - 23.0 N
        DECLARE @PressGR FLOAT = 2.45 + (@Rnd * 0.15);          -- แรงกด Gravure ~2.45 - 2.60 Bar
        DECLARE @PressNip FLOAT = 2.95 + (@Rnd * 0.15);         -- แรงกด Nip ~2.95 - 3.10 Bar
        DECLARE @Corona1 FLOAT = 1.48 + (@Rnd * 0.08);          -- Corona 1 ~1.48 - 1.56 kW
        DECLARE @Corona2 FLOAT = 1.18 + (@Rnd * 0.06);          -- Corona 2 ~1.18 - 1.24 kW

        INSERT INTO [dbo].[View_1LB09_Bobst] (
            [SERVER TIMESTAMP],
            [Machine : Speed],
            [Tunnel : Zone 1 : Temperature],
            [Tunnel : Zone 2 : Temperature],
            [Coating 1- Metering and blade roller- Water- Temperature],
            [Laminator : Hot Roll : Water Temperature],
            [Unwinder 1 : Tension],
            [Unwinder 2 : Tension],
            [Rewinder : Tension],
            [Rewinder : Tension Taper],
            [Coating : Rotogravure Trolley : CoatingRoll : Nip : Operator : Pressure],
            [Coating : Rotogravure Trolley : CoatingRoll : Nip : Motor : Pressure],
            [Coating : SI Transfer Roll : Operator : Pressure],
            [Coating : SI Transfer Roll : Motor : Pressure],
            [Coating : Inlet : Tension],
            [Coating : Outlet : Tension],
            [Unwinder 2 : Infeed ( D.g ) - Tension],
            [Laminator : Nip Roll : Operator : Pressure],
            [Laminator : Nip Roll : Motor : Pressure],
            [Coating : Rotogravure Trolley : Smoothing Roll Speed],
            [Unwinder 1 : Treatment : Specific Power],
            [Unwinder 2 : Corona : Specific Power]
        ) VALUES (
            @CurrentTS,
            @Speed,
            @Temp1,
            @Temp2,
            34.5 + (@Rnd * 1.0),
            64.5 + (@Rnd * 1.5),
            @TensUW1,
            @TensUW2,
            @TensRW,
            35.0,
            @PressGR,
            @PressGR,
            0.0,
            0.0,
            12.0 + (@Rnd * 1.0),
            14.0 + (@Rnd * 1.0),
            15.0 + (@Rnd * 1.0),
            @PressNip,
            @PressNip,
            150.0 + (@Rnd * 10.0),
            @Corona1,
            @Corona2
        );

        -- ข้อมูลเครื่อง Printing (1PG06)
        INSERT INTO [dbo].[View_1PG06_CAIDA] (
            [SERVER TIMESTAMP], [CURRENT SPEED], [TOTAL length],
            [RewingA length], [RewingB length], [UnwingA length], [UnwingB length],
            [1U Roll C], [1U WORK], [2U Roll C], [2U WORK], [3U Roll C], [3U WORK]
        ) VALUES (
            @CurrentTS, 215.0 + (@Rnd * 10.0), (@MinuteOffset - 480) * 200,
            (@MinuteOffset - 480) * 100, 0, (@MinuteOffset - 480) * 100, 0,
            44.5 + (@Rnd * 1.5), 49.5 + (@Rnd * 1.5), 47.5 + (@Rnd * 1.5), 51.5 + (@Rnd * 1.5),
            46.0 + (@Rnd * 1.0), 50.0 + (@Rnd * 1.0)
        );

        -- ข้อมูลเครื่อง BlownFilm (1BF01)
        INSERT INTO [dbo].[View_1BF01_Blownfilm] (
            [SERVER TIMESTAMP], [Take Off Link Speed], [Take Off], [Nip], [Thruput], [Gauge], [Layflat]
        ) VALUES (
            @CurrentTS, 34.8 + (@Rnd * 0.8), 35.2 + (@Rnd * 0.5), 2.78 + (@Rnd * 0.05),
            178.0 + (@Rnd * 5.0), 49.8 + (@Rnd * 0.6), 1000.0 + (@Rnd * 2.0)
        );

        SET @MinuteOffset = @MinuteOffset + 10;
    END;

    SET @DayOffset = @DayOffset + 1;
END;
GO

-- เติมข้อมูลเรคคอร์ดล่าสุดเมื่อ 2 นาทีที่แล้ว เพื่อให้ Machine Status ขึ้นสถานะ "Online" สีเขียว
DECLARE @OnlineTS DATETIME = DATEADD(MINUTE, -2, GETDATE());

INSERT INTO
    [dbo].[View_1LB09_Bobst] (
        [SERVER TIMESTAMP],
        [Machine : Speed],
        [Tunnel : Zone 1 : Temperature],
        [Tunnel : Zone 2 : Temperature],
        [Unwinder 1 : Tension],
        [Unwinder 2 : Tension],
        [Rewinder : Tension]
    )
VALUES (
        @OnlineTS,
        202.5,
        63.8,
        68.2,
        15.2,
        18.1,
        22.4
    );

INSERT INTO
    [dbo].[View_1PG06_CAIDA] (
        [SERVER TIMESTAMP],
        [CURRENT SPEED]
    )
VALUES (@OnlineTS, 220.0);

INSERT INTO
    [dbo].[View_1BF01_Blownfilm] (
        [SERVER TIMESTAMP],
        [Take Off Link Speed]
    )
VALUES (@OnlineTS, 35.2);

PRINT '=== Seed Mock Data Created Successfully ===';
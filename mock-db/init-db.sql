-- 1. สร้างฐานข้อมูล KEP_LOG และ User 'operation'
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'KEP_LOG')
BEGIN
    CREATE DATABASE [KEP_LOG];
END
GO

IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = N'operation')
BEGIN
    CREATE LOGIN [operation] WITH PASSWORD = N'Welcome2026!', CHECK_POLICY = OFF;
END
GO

USE [KEP_LOG];
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'operation')
BEGIN
    CREATE USER [operation] FOR LOGIN [operation];
    ALTER ROLE [db_owner] ADD MEMBER [operation];
END
GO

-- 2. สร้างฐานข้อมูล AX50_SF_PRD_SP1 และ User 'ViewReportAPI'
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'AX50_SF_PRD_SP1')
BEGIN
    CREATE DATABASE [AX50_SF_PRD_SP1];
END
GO

IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = N'ViewReportAPI')
BEGIN
    CREATE LOGIN [ViewReportAPI] WITH PASSWORD = N'Welcome2026!', CHECK_POLICY = OFF;
END
GO

USE [AX50_SF_PRD_SP1];
GO
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = N'ViewReportAPI')
BEGIN
    CREATE USER [ViewReportAPI] FOR LOGIN [ViewReportAPI];
    ALTER ROLE [db_owner] ADD MEMBER [ViewReportAPI];
END
GO

PRINT '=== Initialized KEP_LOG & AX50_SF_PRD_SP1 Successfully ===';
GO
@echo off  
mkdir test_clean\sub  
echo a  
for /f " "delims= %%F in ('dir test_clean /b /a:-d 2^>nul') do del /f /q /a test_clean\%%F  
for /f delims= %%D in ('dir test_clean /b /a:d 2^>nul') do rd /s /q test_clean\%%D  
dir test_clean  
rmdir test_clean  

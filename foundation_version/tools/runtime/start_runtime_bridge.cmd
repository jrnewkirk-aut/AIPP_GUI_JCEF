@echo off
setlocal
cd /d "%~dp0\..\.."
set "AIPP_RUN_ROOT=%USERPROFILE%\AIPP\runs"
for /f "tokens=2 delims=," %%P in ('powershell.exe -NoProfile -Command "$p=Get-CimInstance Win32_Process -Filter \"Name = 'python.exe'\" | Where-Object { $_.CommandLine -match 'runtime_bridge\.py' -and $_.CommandLine -match '--port 8765' }; $p.ProcessId -join ','"') do taskkill /PID %%P /T /F >nul 2>&1
start "AIPP Runtime Bridge" /b py -3 tools\runtime\runtime_bridge.py --host 127.0.0.1 --port 8765 >> tools\runtime\runtime_bridge.log 2>&1
endlocal

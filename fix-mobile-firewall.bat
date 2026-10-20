@echo off
:: Batch script to allow inbound connections to port 3000 through Windows Firewall
echo ====================================================================
echo 🏥 MedGesture AI - Windows Firewall Configuration for Mobile Access
echo ====================================================================
echo.
echo Requesting administrator privileges to allow Port 3000...
echo.

net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with Administrator privileges...
) else (
    echo Requesting Administrator permission...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo Adding inbound firewall rule for Port 3000...
netsh advfirewall firewall delete rule name="Patient System Port 3000" >nul 2>&1
netsh advfirewall firewall add rule name="Patient System Port 3000" dir=in action=allow protocol=TCP localport=3000 profile=any

echo.
echo ====================================================================
echo SUCCESS! Port 3000 is now open in Windows Firewall.
echo Any phone or tablet on the same Wi-Fi can now open:
echo.
echo    http://192.168.1.34:3000/mobile
echo.
echo ====================================================================
pause

@echo off
@echo off
echo ==========================================
echo   INICIANDO YELLOW KITE ASSET HUB
echo ==========================================
echo.

echo [1/3] Iniciando o servidor Backend...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm run dev"

echo [2/3] Iniciando o servidor Frontend...
cd /d "%~dp0frontend"
start "Frontend Server" cmd /k "npm run dev"

echo [3/3] Abrindo o navegador...
timeout /t 3 /nobreak >nul
start http://localhost:8080

echo.
echo ==========================================
echo   SISTEMA INICIADO COM SUCESSO!
echo   Backend: http://localhost:3001
echo   Frontend: http://localhost:8080
echo ==========================================
echo.
echo Pressione qualquer tecla para sair...
pause >nul

@echo off
chcp 65001 >nul
echo ==============================
echo  四时有序 · 六爻解卦 本地服务器
echo ==============================
echo.

cd /d "%~dp0"

if not exist backend\package.json (
    echo [错误] 未找到 backend 目录，请确认你在项目根目录运行该脚本。
    pause
    goto :eof
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [错误] 未找到 npm，请先安装 Node.js。
    pause
    goto :eof
)

if not exist backend\.env (
    if exist backend\.env.example (
        copy /Y backend\.env.example backend\.env >nul
        echo 已自动创建 backend\.env，请把 DEEPSEEK_API_KEY 填好后再重启本脚本。
        notepad backend\.env
        pause
        goto :eof
    )
)

echo [1/3] 启动后端服务 (http://localhost:8081)...
start "do-not-behind-backend" cmd /k "cd /d %~dp0backend && npm install && npm start"

timeout /t 2 >nul

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [2/3] 启动前端服务 (http://localhost:8080)...
    start "do-not-behind-frontend" cmd /k "cd /d %~dp0 && python -m http.server 8080"
) else (
    where npx >nul 2>nul
    if %errorlevel% equ 0 (
        echo [2/3] 启动前端服务 (http://localhost:8080)...
        start "do-not-behind-frontend" cmd /k "cd /d %~dp0 && npx serve -l 8080"
    ) else (
        echo [错误] 未找到 Python 或 npx，无法启动前端服务。
        pause
        goto :eof
    )
)

echo [3/3] 正在打开浏览器...
start http://localhost:8080

echo.
echo 已启动完成。
echo - 前端: http://localhost:8080
echo - 后端: http://localhost:8081
echo.
echo 关闭服务请直接关闭新打开的两个命令行窗口。
pause

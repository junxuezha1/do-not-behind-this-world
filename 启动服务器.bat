@echo off
chcp 65001 >nul
echo ==============================
echo  四时有序 · 六爻解卦 本地服务器
echo ==============================
echo.

cd /d "%~dp0"

:: 尝试用 python
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo 正在启动 Python 服务器...
    echo 请在浏览器中打开: http://localhost:8080
    echo 按 Ctrl+C 停止服务器
    echo.
    start http://localhost:8080
    python -m http.server 8080
    goto :end
)

:: 尝试用 npx
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo 正在启动 Node 服务器...
    echo 请在浏览器中打开: http://localhost:3000
    echo 按 Ctrl+C 停止服务器
    echo.
    start http://localhost:3000
    npx serve -l 3000
    goto :end
)

echo [错误] 未找到 Python 或 Node.js
echo 请安装其中之一，或使用 VSCode Live Server 扩展
echo.
pause

:end

@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

set "ROOT=%~dp0"
set "FRONTEND_PORT=8080"
set "BACKEND_PORT=8081"

echo ==============================
echo  四时有序 · 六爻解卦 稳定一键启动
echo ==============================
echo.

cd /d "%ROOT%"

call :is_port_listening %BACKEND_PORT%
set "BACKEND_UP=!errorlevel!"
call :is_port_listening %FRONTEND_PORT%
set "FRONTEND_UP=!errorlevel!"

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
        echo [提示] 已自动创建 backend\.env，可稍后补充 DEEPSEEK_API_KEY。
    )
)

if "%BACKEND_UP%"=="0" (
    echo [1/4] 后端已在运行: http://localhost:%BACKEND_PORT%
) else (
    echo [1/4] 启动后端服务: http://localhost:%BACKEND_PORT%
    start "do-not-behind-backend" cmd /k "cd /d %ROOT%backend && npm install && npm start"
)

call :wait_port %BACKEND_PORT% 30
if not "%errorlevel%"=="0" (
    echo [警告] 后端端口 %BACKEND_PORT% 在 30 秒内未就绪。
)

if "%FRONTEND_UP%"=="0" (
    echo [2/4] 前端已在运行: http://localhost:%FRONTEND_PORT%
) else (
    where python >nul 2>nul
    if !errorlevel! equ 0 (
        echo [2/4] 启动前端服务: Python -> http://localhost:%FRONTEND_PORT%
        start "do-not-behind-frontend" cmd /k "cd /d %ROOT% && python -m http.server %FRONTEND_PORT%"
    ) else (
        where npx >nul 2>nul
        if !errorlevel! equ 0 (
            echo [2/4] 启动前端服务: npx serve -> http://localhost:%FRONTEND_PORT%
            start "do-not-behind-frontend" cmd /k "cd /d %ROOT% && npx serve -l %FRONTEND_PORT%"
        ) else (
            echo [错误] 未找到 Python 或 npx，无法启动前端服务。
            pause
            goto :eof
        )
    )
)

call :wait_port %FRONTEND_PORT% 20
if not "%errorlevel%"=="0" (
    echo [错误] 前端端口 %FRONTEND_PORT% 未就绪，请检查弹出的前端窗口日志。
    pause
    goto :eof
)

echo [3/4] 检测服务状态...
echo [前端] http://localhost:%FRONTEND_PORT%
echo [后端] http://localhost:%BACKEND_PORT%

echo [4/4] 打开浏览器...
start http://localhost:%FRONTEND_PORT%

echo.
echo Startup completed.
echo Frontend URL: http://localhost:%FRONTEND_PORT%
echo Backend URL:  http://localhost:%BACKEND_PORT%
echo Close the spawned service windows to stop services.
goto :eof

:is_port_listening
set "_port=%~1"
netstat -ano | findstr /r /c:":%_port% .*LISTENING" >nul 2>nul
if %errorlevel% equ 0 (
  exit /b 0
)
exit /b 1

:wait_port
set "_wait_port=%~1"
set "_timeout=%~2"
set /a _i=0
:wait_loop
call :is_port_listening %_wait_port%
if %errorlevel% equ 0 exit /b 0
set /a _i+=1
if !_i! geq %_timeout% exit /b 1
timeout /t 1 >nul
goto :wait_loop

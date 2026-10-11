@echo off
cd /d "%~dp0"
where go >nul 2>nul
if errorlevel 1 (
  echo Please install Go from https://go.dev/dl/ and reopen this window.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:8080 in your browser.
echo Press Ctrl+C to stop the server.
go run ./cmd/web
pause

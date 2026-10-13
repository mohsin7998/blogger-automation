@echo off
title Blogger 24/7 Autonomous Publisher
cd /d "%~dp0"
echo ========================================================================
echo Starting Autonomous Blog Publishing Engine...
echo ========================================================================
node automation-worker.mjs
echo.
pause

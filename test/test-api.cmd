@echo off
title API Test - Anonymous Chat

echo.
echo =================================
echo   Anonymous Chat API Testing
echo =================================
echo.

set "BASE_URL=http://localhost:3000/api/v1"

:: First, get a token manually
echo Step 1: Getting authentication token...
curl -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"testuser\"}"
echo.
echo.

:: Pause so you can copy the token
echo.
echo IMPORTANT: Copy the sessionToken from above response
echo.
pause

:: Now manually enter the token
set /p TOKEN="Enter your session token: "

:: Create a room
echo.
echo Step 2: Creating a room...
curl -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"testroom\"}"
echo.
echo.
:: Create a room
echo.
echo Step 2: Creating a room...
curl -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"name\":\"testroom5\"}"
echo.
echo.

:: Get all rooms
echo.
echo Step 3: Getting all rooms...
curl -X GET "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

:: Send a message
echo.
echo Step 4: Sending a message...
curl -X POST "%BASE_URL%/rooms/room_id_here/messages" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"content\":\"Hello World\"}"
echo.
echo.

:: Get messages
echo.
echo Step 5: Getting messages...
curl -X GET "%BASE_URL%/rooms/room_id_here/messages?limit=10" -H "Authorization: Bearer %TOKEN%"
echo.
echo.

echo.
echo =================================
echo   Testing Complete!
echo =================================
echo.

pause
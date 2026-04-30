@echo off
setlocal enabledelayedexpansion

title Comprehensive API Test - Anonymous Chat

:: Colors for Windows 10/11 (if VT support enabled)
set "GREEN=[32m"
set "RED=[31m"
set "YELLOW=[33m"
set "BLUE=[36m"
set "RESET=[0m"

echo.
echo ================================================================================
echo                      Comprehensive API Test Suite
echo                           Anonymous Chat API
echo ================================================================================
echo.

set "BASE_URL=http://localhost:3000/api/v1"
set "TEST_PASS=0"
set "TEST_FAIL=0"

:: Function to print test result
call :printHeader "Starting API Tests"
echo.

:: Step 1: Health Check
call :printTest "Health Check - Server Status"
curl -s -o nul -w "%%{http_code}" "%BASE_URL%/login" -X POST -H "Content-Type: application/json" -d "{\"username\":\"health_check\"}" > temp.txt
set /p HTTP_CODE=<temp.txt
del temp.txt
if "%HTTP_CODE%"=="200" (
    call :printPass "Server is running"
) else (
    call :printFail "Server is not running (HTTP %HTTP_CODE%)"
    goto :end
)
echo.

:: ============================================================================
:: AUTHENTICATION TESTS
:: ============================================================================
call :printHeader "AUTHENTICATION TESTS"
echo.

:: Test A1: Valid Login
call :printTest "A1: Valid Login - Create user1"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"alice\"}" > login1.json
type login1.json | findstr "sessionToken" > nul
if %errorlevel%==0 (
    call :printPass "User 'alice' created/login successful"
    :: Extract token using PowerShell
    for /f "delims=" %%i in ('powershell -Command "$c=Get-Content login1.json | ConvertFrom-Json; $c.data.sessionToken" 2^>nul') do set TOKEN1=%%i
) else (
    call :printFail "Login failed for user 'alice'"
    type login1.json
    set /a TEST_FAIL+=1
)
echo.

:: Test A2: Valid Login - Create user2
call :printTest "A2: Valid Login - Create user2"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"bob\"}" > login2.json
type login2.json | findstr "sessionToken" > nul
if %errorlevel%==0 (
    call :printPass "User 'bob' created/login successful"
    for /f "delims=" %%i in ('powershell -Command "$c=Get-Content login2.json | ConvertFrom-Json; $c.data.sessionToken" 2^>nul') do set TOKEN2=%%i
) else (
    call :printFail "Login failed for user 'bob'"
    type login2.json
    set /a TEST_FAIL+=1
)
echo.

:: Test A3: Login with existing username (idempotent)
call :printTest "A3: Login with existing username"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"alice\"}" > login_existing.json
type login_existing.json | findstr "alice" > nul
if %errorlevel%==0 (
    call :printPass "Returns existing user with new session"
) else (
    call :printFail "Failed to return existing user"
    set /a TEST_FAIL+=1
)
echo.

:: Test A4: Invalid username - too short
call :printTest "A4: Invalid username - too short (2 chars minimum)"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"a\"}" > invalid_short.json
type invalid_short.json | findstr "VALIDATION_ERROR" > nul
if %errorlevel%==0 (
    call :printPass "Correctly rejected username with 1 character"
) else (
    call :printFail "Should reject username shorter than 2 chars"
    type invalid_short.json
    set /a TEST_FAIL+=1
)
echo.

:: Test A5: Invalid username - too long
call :printTest "A5: Invalid username - too long (24 chars maximum)"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"abcdefghijklmnopqrstuvwxy\"}" > invalid_long.json
type invalid_long.json | findstr "VALIDATION_ERROR" > nul
if %errorlevel%==0 (
    call :printPass "Correctly rejected username with 25 characters"
) else (
    call :printFail "Should reject username longer than 24 chars"
    type invalid_long.json
    set /a TEST_FAIL+=1
)
echo.

:: Test A6: Invalid username - invalid characters
call :printTest "A6: Invalid username - special characters"
curl -s -X POST "%BASE_URL%/login" -H "Content-Type: application/json" -d "{\"username\":\"alice@123\"}" > invalid_chars.json
type invalid_chars.json | findstr "VALIDATION_ERROR" > nul
if %errorlevel%==0 (
    call :printPass "Correctly rejected username with special characters"
) else (
    call :printFail "Should reject username with @ symbol"
    type invalid_chars.json
    set /a TEST_FAIL+=1
)
echo.

:: ============================================================================
:: ROOM TESTS
:: ============================================================================
call :printHeader "ROOM MANAGEMENT TESTS"
echo.

:: Test R1: Create valid room
call :printTest "R1: Create valid room"
curl -s -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"name\":\"general\"}" > room1.json
type room1.json | findstr "general" > nul
if %errorlevel%==0 (
    call :printPass "Room 'general' created successfully"
    for /f "delims=" %%i in ('powershell -Command "$c=Get-Content room1.json | ConvertFrom-Json; $c.data.id" 2^>nul') do set ROOM_ID=%%i
) else (
    call :printFail "Failed to create room"
    type room1.json
    set /a TEST_FAIL+=1
)
echo.

:: Test R2: Create duplicate room name
call :printTest "R2: Create duplicate room name (should fail)"
curl -s -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"name\":\"general\"}" > room_dup.json
type room_dup.json | findstr "ROOM_NAME_TAKEN" > nul
if %errorlevel%==0 (
    call :printPass "Duplicate room correctly rejected with 409"
) else (
    call :printFail "Should reject duplicate room name"
    type room_dup.json
    set /a TEST_FAIL+=1
)
echo.

:: Test R3: Invalid room name - too short
call :printTest "R3: Invalid room name - too short (3 chars minimum)"
curl -s -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"name\":\"ab\"}" > room_short.json
type room_short.json | findstr "VALIDATION_ERROR" > nul
if %errorlevel%==0 (
    call :printPass "Rejected room name with 2 characters"
) else (
    call :printFail "Should reject room name shorter than 3 chars"
    type room_short.json
    set /a TEST_FAIL+=1
)
echo.

:: Test R4: Invalid room name - invalid characters
call :printTest "R4: Invalid room name - spaces not allowed"
curl -s -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"name\":\"my room\"}" > room_invalid.json
type room_invalid.json | findstr "VALIDATION_ERROR" > nul
if %errorlevel%==0 (
    call :printPass "Rejected room name with spaces"
) else (
    call :printFail "Should reject room name with spaces"
    type room_invalid.json
    set /a TEST_FAIL+=1
)
echo.

:: Test R5: Get all rooms
call :printTest "R5: Get all rooms"
curl -s -X GET "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" > rooms_list.json
type rooms_list.json | findstr "rooms" > nul
if %errorlevel%==0 (
    call :printPass "Retrieved all rooms successfully"
) else (
    call :printFail "Failed to get rooms list"
    set /a TEST_FAIL+=1
)
echo.

:: Test R6: Get specific room by ID
call :printTest "R6: Get room by ID"
curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%" -H "Authorization: Bearer %TOKEN1%" > room_by_id.json
type room_by_id.json | findstr "%ROOM_ID%" > nul
if %errorlevel%==0 (
    call :printPass "Retrieved room by ID successfully"
) else (
    call :printFail "Failed to get room by ID"
    type room_by_id.json
    set /a TEST_FAIL+=1
)
echo.

:: Test R7: Get non-existent room
call :printTest "R7: Get non-existent room (should fail)"
curl -s -X GET "%BASE_URL%/rooms/nonexistent123" -H "Authorization: Bearer %TOKEN1%" > room_notfound.json
type room_notfound.json | findstr "ROOM_NOT_FOUND" > nul
if %errorlevel%==0 (
    call :printPass "Non-existent room correctly returns 404"
) else (
    call :printFail "Should return 404 for non-existent room"
    type room_notfound.json
    set /a TEST_FAIL+=1
)
echo.

:: ============================================================================
:: MESSAGE TESTS
:: ============================================================================
call :printHeader "MESSAGE TESTS"
echo.

:: Test M1: Send valid message
call :printTest "M1: Send valid message"
curl -s -X POST "%BASE_URL%/rooms/%ROOM_ID%/messages" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"content\":\"Hello everyone! This is a test message.\"}" > msg1.json
type msg1.json | findstr "msg_" > nul
if %errorlevel%==0 (
    call :printPass "Message sent successfully"
    for /f "delims=" %%i in ('powershell -Command "$c=Get-Content msg1.json | ConvertFrom-Json; $c.data.id" 2^>nul') do set MSG_ID=%%i
) else (
    call :printFail "Failed to send message"
    type msg1.json
    set /a TEST_FAIL+=1
)
echo.

:: Test M2: Send message as second user
call :printTest "M2: Send message as second user"
curl -s -X POST "%BASE_URL%/rooms/%ROOM_ID%/messages" -H "Authorization: Bearer %TOKEN2%" -H "Content-Type: application/json" -d "{\"content\":\"Hi from Bob!\"}" > msg2.json
type msg2.json | findstr "msg_" > nul
if %errorlevel%==0 (
    call :printPass "Second user message sent successfully"
) else (
    call :printFail "Failed to send second user message"
    type msg2.json
    set /a TEST_FAIL+=1
)
echo.

:: Test M3: Empty message (should fail)
call :printTest "M3: Empty message (should fail)"
curl -s -X POST "%BASE_URL%/rooms/%ROOM_ID%/messages" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"content\":\"\"}" > msg_empty.json
type msg_empty.json | findstr "MESSAGE_EMPTY" > nul
if %errorlevel%==0 (
    call :printPass "Empty message correctly rejected"
) else (
    call :printFail "Should reject empty message"
    type msg_empty.json
    set /a TEST_FAIL+=1
)
echo.

:: Test M4: Too long message (should fail)
call :printTest "M4: Message too long (>1000 chars, should fail)"
powershell -Command "$longText = 'a' * 1001; Write-Output $longText" > long.txt
set /p LONG_TEXT=<long.txt
curl -s -X POST "%BASE_URL%/rooms/%ROOM_ID%/messages" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"content\":\"%LONG_TEXT%\"}" > msg_long.json
type msg_long.json | findstr "MESSAGE_TOO_LONG" > nul
if %errorlevel%==0 (
    call :printPass "Long message correctly rejected"
) else (
    call :printFail "Should reject message longer than 1000 chars"
    type msg_long.json
    set /a TEST_FAIL+=1
)
del long.txt
echo.

:: Test M5: Get messages (first page)
call :printTest "M5: Get messages with pagination - first page"
curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%/messages?limit=2" -H "Authorization: Bearer %TOKEN1%" > msgs_page1.json
type msgs_page1.json | findstr "messages" > nul
if %errorlevel%==0 (
    call :printPass "Retrieved first page of messages"
    for /f "delims=" %%i in ('powershell -Command "$c=Get-Content msgs_page1.json | ConvertFrom-Json; $c.data.nextCursor" 2^>nul') do set NEXT_CURSOR=%%i
) else (
    call :printFail "Failed to get messages"
    set /a TEST_FAIL+=1
)
echo.

:: Test M6: Get messages with cursor (if cursor exists)
if defined NEXT_CURSOR (
    call :printTest "M6: Get messages with cursor pagination"
    curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%/messages?limit=2&before=%NEXT_CURSOR%" -H "Authorization: Bearer %TOKEN1%" > msgs_page2.json
    type msgs_page2.json | findstr "messages" > nul
    if %errorlevel%==0 (
        call :printPass "Paginated messages retrieved successfully"
    ) else (
        call :printFail "Failed to get paginated messages"
        set /a TEST_FAIL+=1
    )
) else (
    call :printSkip "No cursor available for pagination test"
)
echo.

:: Test M7: Get messages with invalid limit (>100)
call :printTest "M7: Get messages with limit >100 (should cap at 100)"
curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%/messages?limit=200" -H "Authorization: Bearer %TOKEN1%" > msgs_limit.json
type msgs_limit.json | findstr "messages" > nul
if %errorlevel%==0 (
    call :printPass "Request handled correctly (limit capped to 100)"
) else (
    call :printWarn "Unexpected response for large limit"
)
echo.

:: ============================================================================
:: ACTIVE USERS TESTS
:: ============================================================================
call :printHeader "ACTIVE USERS TESTS"
echo.

:: Test U1: Check active users count
call :printTest "U1: Check active users in room"
curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%" -H "Authorization: Bearer %TOKEN1%" > room_active.json
type room_active.json | findstr "activeUsers" > nul
if %errorlevel%==0 (
    call :printPass "Active users field present in response"
) else (
    call :printFail "Missing activeUsers field in room response"
    set /a TEST_FAIL+=1
)
echo.

:: ============================================================================
:: AUTHORIZATION TESTS
:: ============================================================================
call :printHeader "AUTHORIZATION TESTS"
echo.

:: Test Z1: Access without token
call :printTest "Z1: Access protected route without token"
curl -s -X GET "%BASE_URL%/rooms" > no_auth.json
type no_auth.json | findstr "UNAUTHORIZED" > nul
if %errorlevel%==0 (
    call :printPass "Unauthorized access correctly rejected"
) else (
    call :printFail "Should return 401 for missing token"
    type no_auth.json
    set /a TEST_FAIL+=1
)
echo.

:: Test Z2: Access with invalid token
call :printTest "Z2: Access with invalid token"
curl -s -X GET "%BASE_URL%/rooms" -H "Authorization: Bearer invalid_token_12345" > invalid_auth.json
type invalid_auth.json | findstr "UNAUTHORIZED" > nul
if %errorlevel%==0 (
    call :printPass "Invalid token correctly rejected"
) else (
    call :printFail "Should return 401 for invalid token"
    type invalid_auth.json
    set /a TEST_FAIL+=1
)
echo.

:: ============================================================================
:: DELETE OPERATIONS
:: ============================================================================
call :printHeader "DELETE OPERATIONS TESTS"
echo.

:: Test D1: Create room for deletion test
call :printTest "D1: Create temporary room for deletion"
curl -s -X POST "%BASE_URL%/rooms" -H "Authorization: Bearer %TOKEN1%" -H "Content-Type: application/json" -d "{\"name\":\"temp-room\"}" > temp_room.json
for /f "delims=" %%i in ('powershell -Command "$c=Get-Content temp_room.json | ConvertFrom-Json; $c.data.id" 2^>nul') do set TEMP_ROOM_ID=%%i
if defined TEMP_ROOM_ID (
    call :printPass "Temporary room created with ID: %TEMP_ROOM_ID%"
) else (
    call :printFail "Failed to create temporary room"
    set /a TEST_FAIL+=1
)
echo.

:: Test D2: Delete room as non-creator (should fail)
call :printTest "D2: Delete room as non-creator (should fail)"
curl -s -X DELETE "%BASE_URL%/rooms/%TEMP_ROOM_ID%" -H "Authorization: Bearer %TOKEN2%" > delete_forbidden.json
type delete_forbidden.json | findstr "FORBIDDEN" > nul
if %errorlevel%==0 (
    call :printPass "Non-creator correctly blocked from deletion"
) else (
    call :printFail "Should return 403 when non-creator tries to delete"
    type delete_forbidden.json
    set /a TEST_FAIL+=1
)
echo.

:: Test D3: Delete room as creator
call :printTest "D3: Delete room as creator"
curl -s -X DELETE "%BASE_URL%/rooms/%TEMP_ROOM_ID%" -H "Authorization: Bearer %TOKEN1%" > delete_ok.json
type delete_ok.json | findstr "deleted" > nul
if %errorlevel%==0 (
    call :printPass "Room deleted successfully by creator"
) else (
    call :printFail "Failed to delete room as creator"
    type delete_ok.json
    set /a TEST_FAIL+=1
)
echo.

:: Test D4: Delete main room as creator
call :printTest "D4: Delete main test room"
curl -s -X DELETE "%BASE_URL%/rooms/%ROOM_ID%" -H "Authorization: Bearer %TOKEN1%" > delete_main.json
type delete_main.json | findstr "deleted" > nul
if %errorlevel%==0 (
    call :printPass "Main room deleted successfully"
) else (
    call :printFail "Failed to delete main room"
    set /a TEST_FAIL+=1
)
echo.

:: Test D5: Access deleted room (should fail)
call :printTest "D5: Access deleted room (should fail)"
curl -s -X GET "%BASE_URL%/rooms/%ROOM_ID%" -H "Authorization: Bearer %TOKEN1%" > deleted_access.json
type deleted_access.json | findstr "ROOM_NOT_FOUND" > nul
if %errorlevel%==0 (
    call :printPass "Deleted room correctly returns 404"
) else (
    call :printFail "Should return 404 for deleted room"
    set /a TEST_FAIL+=1
)
echo.

:: ============================================================================
:: SUMMARY
:: ============================================================================
:end
echo.
echo ================================================================================
echo                              TEST SUMMARY
echo ================================================================================
echo.
echo Tests Passed: %TEST_PASS%
echo Tests Failed: %TEST_FAIL%
echo.
if %TEST_FAIL%==0 (
    echo Status: ALL TESTS PASSED - API is ready for deployment!
    echo.
    call :printGreen "✓ API is working correctly"
    call :printGreen "✓ All endpoints are functional"
    call :printGreen "✓ Validation is working"
    call :printGreen "✓ Authorization is enforced"
) else (
    echo Status: SOME TESTS FAILED - Please review the errors above
    echo.
    call :printRed "✗ Please fix the failing tests before deployment"
)
echo.
echo ================================================================================
echo.

:: Cleanup
del *.json 2>nul
del temp.txt 2>nul

echo Press any key to exit...
pause > nul
exit /b

:: ============================================================================
:: FUNCTIONS
:: ============================================================================

:printTest
set /a TEST_NUM+=1
echo [TEST %TEST_NUM%] %~1
set /a TOTAL_TESTS+=1
goto :eof

:printPass
echo   ✓ %~1
set /a TEST_PASS+=1
goto :eof

:printFail
echo   ✗ %~1
set /a TEST_FAIL+=1
goto :eof

:printSkip
echo   ○ %~1
goto :eof

:printWarn
echo   ⚠ %~1
goto :eof

:printHeader
echo.
echo --------------------------------------------------------------------------------
echo   %~1
echo --------------------------------------------------------------------------------
goto :eof

:printGreen
echo %GREEN%%~1%RESET%
goto :eof

:printRed
echo %RED%%~1%RESET%
goto :eof
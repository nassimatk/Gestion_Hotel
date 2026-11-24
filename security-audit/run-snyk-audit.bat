@echo off
setlocal enabledelayedexpansion

echo ==========================================================
echo   HOTELHUB - AUDIT DE SECURITE DES DEPENDANCES (SNYK)
echo ==========================================================

cd /d "%~dp0.."
set ROOT_DIR=%CD%
set REPORTS_DIR=%ROOT_DIR%\security-audit\reports

if not exist "%REPORTS_DIR%" mkdir "%REPORTS_DIR%"

:: 1. Verification de Snyk CLI
where snyk >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Snyk CLI n'est pas encore installe sur votre machine.
    echo [INFO] Installation automatique de 'snyk' et 'snyk-to-html' via npm...
    call npm install -g snyk snyk-to-html
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] Impossible d'installer Snyk automatiquement.
        echo Assurez-vous que Node.js est installe et executez manuellement :
        echo   npm install -g snyk snyk-to-html
        pause
        exit /b 1
    )
    echo [OK] Snyk installe avec succes !
    echo.
)

:: 2. Verification de l'authentification Snyk
call snyk whoami >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] Vous n'etes pas encore connecte a Snyk.
    echo Une page web va s'ouvrir pour vous connecter gratuitement a votre compte Snyk...
    call snyk auth
    if %ERRORLEVEL% NEQ 0 (
        echo [ERREUR] L'authentification a echoue ou a ete annulee.
        echo Veuillez executer 'snyk auth' dans un terminal puis reessayez.
        pause
        exit /b 1
    )
)

echo Connecte a Snyk en tant que :
call snyk whoami
echo.

echo [1/6] Analyse Frontend (React / npm)...
cd /d "%ROOT_DIR%\frontend"
call snyk test --file=package.json --json --json-file-output="%REPORTS_DIR%\snyk-frontend.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-frontend.json" -o "%REPORTS_DIR%\snyk-frontend.html"

echo [2/6] Analyse Auth Service (Laravel / Composer)...
cd /d "%ROOT_DIR%\services\auth-service"
call snyk test --file=composer.lock --json --json-file-output="%REPORTS_DIR%\snyk-auth.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-auth.json" -o "%REPORTS_DIR%\snyk-auth.html"

echo [3/6] Analyse Chambres Service (Laravel / Composer)...
cd /d "%ROOT_DIR%\services\chambres-service"
call snyk test --file=composer.lock --json --json-file-output="%REPORTS_DIR%\snyk-chambres.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-chambres.json" -o "%REPORTS_DIR%\snyk-chambres.html"

echo [4/6] Analyse Avis Service (Laravel / Composer)...
cd /d "%ROOT_DIR%\services\avis-service"
call snyk test --file=composer.lock --json --json-file-output="%REPORTS_DIR%\snyk-avis.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-avis.json" -o "%REPORTS_DIR%\snyk-avis.html"

echo [5/6] Analyse Tarifs Service (Laravel / Composer)...
cd /d "%ROOT_DIR%\services\tarifs-service"
call snyk test --file=composer.lock --json --json-file-output="%REPORTS_DIR%\snyk-tarifs.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-tarifs.json" -o "%REPORTS_DIR%\snyk-tarifs.html"

echo [6/6] Analyse Disponibilites Service (Spring Boot / Maven)...
cd /d "%ROOT_DIR%\services\disponibilites-service"
call snyk test --file=pom.xml --json --json-file-output="%REPORTS_DIR%\snyk-disponibilites.json"
call snyk-to-html -i "%REPORTS_DIR%\snyk-disponibilites.json" -o "%REPORTS_DIR%\snyk-disponibilites.html"

cd /d "%ROOT_DIR%"
echo ==========================================================
echo   AUDIT TERMINE AVEC SUCCES !
echo   Rapports generes dans : %REPORTS_DIR%
echo ==========================================================
echo.
echo Ouverture du dossier des rapports...
start "" "%REPORTS_DIR%"
pause

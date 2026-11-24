# ============================================================
# HotelHub — Script PowerShell d'Analyse de Sécurité Snyk
# ============================================================

$ErrorActionPreference = "Continue"

$ROOT_DIR = (Get-Item $PSScriptRoot).Parent.FullName
$REPORTS_DIR = Join-Path $PSScriptRoot "reports"

if (-not (Test-Path $REPORTS_DIR)) {
    New-Item -ItemType Directory -Force -Path $REPORTS_DIR | Out-Null
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  HOTELHUB - AUDIT DE SÉCURITÉ DES DÉPENDANCES (SNYK)      " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Dossier racine  : $ROOT_DIR"
Write-Host "Dossier rapports: $REPORTS_DIR"
Write-Host ""

# 1. Vérifier si Snyk est installé, sinon l'installer automatiquement
$snykInstalled = Get-Command "snyk" -ErrorAction SilentlyContinue
if (-not $snykInstalled) {
    Write-Host "[INFO] Snyk CLI n'est pas encore installé sur votre machine." -ForegroundColor Yellow
    Write-Host "[INFO] Installation automatique de snyk et snyk-to-html via npm..." -ForegroundColor Yellow
    npm install -g snyk snyk-to-html
    $snykInstalled = Get-Command "snyk" -ErrorAction SilentlyContinue
    if (-not $snykInstalled) {
        Write-Host "[ERREUR] Échec de l'installation de Snyk. Installez Node.js puis relancez." -ForegroundColor Red
        exit 1
    }
}

# 2. Vérifier l'authentification Snyk
$whoami = snyk whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[INFO] Vous n'êtes pas encore connecté à Snyk." -ForegroundColor Yellow
    Write-Host "Ouverture du navigateur pour vous connecter gratuitement..." -ForegroundColor Yellow
    snyk auth
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERREUR] Connexion annulée ou échouée." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[OK] Connecté à Snyk en tant que : $(snyk whoami)" -ForegroundColor Green
Write-Host ""

function Run-SnykScan {
    param (
        [string]$Name,
        [string]$SubDir,
        [string]$TargetFile,
        [string]$ReportBaseName
    )

    $workDir = Join-Path $ROOT_DIR $SubDir
    Write-Host "----------------------------------------------------------" -ForegroundColor Yellow
    Write-Host ">>> Analyse en cours : $Name" -ForegroundColor Yellow
    Write-Host "    Répertoire : $workDir" -ForegroundColor DarkGray

    $jsonReport = Join-Path $REPORTS_DIR "$ReportBaseName.json"
    $htmlReport = Join-Path $REPORTS_DIR "$ReportBaseName.html"

    Push-Location $workDir
    try {
        if ($TargetFile) {
            & snyk test --file=$TargetFile --json --json-file-output=$jsonReport
        } else {
            & snyk test --json --json-file-output=$jsonReport
        }
    } finally {
        Pop-Location
    }

    if (Test-Path $jsonReport) {
        if (Get-Command "snyk-to-html" -ErrorAction SilentlyContinue) {
            & snyk-to-html -i $jsonReport -o $htmlReport
            Write-Host "    [OK] Rapport HTML généré : $htmlReport" -ForegroundColor Green
        } else {
            Write-Host "    [ATTENTION] snyk-to-html non trouvé, rapport HTML omis." -ForegroundColor Yellow
        }
    }
}

# 1. Frontend React
Run-SnykScan -Name "Frontend (React / npm)" -SubDir "frontend" -TargetFile "package.json" -ReportBaseName "snyk-frontend"

# 2. Services PHP / Laravel
Run-SnykScan -Name "Auth Service (Laravel / Composer)" -SubDir "services/auth-service" -TargetFile "composer.lock" -ReportBaseName "snyk-auth"
Run-SnykScan -Name "Chambres Service (Laravel / Composer)" -SubDir "services/chambres-service" -TargetFile "composer.lock" -ReportBaseName "snyk-chambres"
Run-SnykScan -Name "Avis Service (Laravel / Composer)" -SubDir "services/avis-service" -TargetFile "composer.lock" -ReportBaseName "snyk-avis"
Run-SnykScan -Name "Tarifs Service (Laravel / Composer)" -SubDir "services/tarifs-service" -TargetFile "composer.lock" -ReportBaseName "snyk-tarifs"

# 3. Service Java / Spring Boot
Run-SnykScan -Name "Disponibilités Service (Spring Boot / Maven)" -SubDir "services/disponibilites-service" -TargetFile "pom.xml" -ReportBaseName "snyk-disponibilites"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  AUDIT TERMINÉ AVEC SUCCÈS !                             " -ForegroundColor Cyan
Write-Host "  Consultez les rapports HTML dans : $REPORTS_DIR        " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Ouvrir le dossier des rapports
Invoke-Item $REPORTS_DIR

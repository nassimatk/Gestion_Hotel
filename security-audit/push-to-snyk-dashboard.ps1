$services = @(
    @{ Path = "services/chambres-service"; File = "composer.lock"; Name = "hotelhub-chambres-service" },
    @{ Path = "services/avis-service"; File = "composer.lock"; Name = "hotelhub-avis-service" },
    @{ Path = "services/tarifs-service"; File = "composer.lock"; Name = "hotelhub-tarifs-service" },
    @{ Path = "services/disponibilites-service"; File = "pom.xml"; Name = "hotelhub-disponibilites-service" }
)

foreach ($s in $services) {
    $targetFile = $s["File"]
    $projName = $s["Name"]
    $targetDir = $s["Path"]

    Write-Host ">>> Pushing snapshot for: $projName (file: $targetFile)" -ForegroundColor Cyan
    Push-Location $targetDir
    try {
        & snyk monitor --file="$targetFile" --project-name="$projName"
    } finally {
        Pop-Location
    }
}
Write-Host ">>> Done monitoring all services!" -ForegroundColor Green

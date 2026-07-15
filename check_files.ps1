$files = @("aphrodite.html", "hades.html", "login.html", "hephaestus.html", "hermes.html", "hestia.html", "nike.html", "persephone.html", "poseidon.html", "rhea.html", "zeus.html", "ares.html", "artemis.html", "athena.html", "atlas_god.html", "cronus.html", "dionysus.html", "eros.html", "gaia.html", "hera.html", "apollo.html", "atlas.html")

foreach ($f in $files) {
    if (Test-Path $f) {
        $bytes = [System.IO.File]::ReadAllBytes($f)
        $hasBOM = ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF)
        # Check first 10 lines
        $content = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
        $lines = $content -split "`n" | Select-Object -First 8
        $title = ($lines | Select-String "<title>").ToString().Trim()
        Write-Output "=== $f (BOM:$hasBOM) ==="
        Write-Output "  title line: $title"
    }
}

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$files = @("aphrodite.html", "hades.html", "login.html", "atlas.html", "index.html", "cards.html", "shop.html", "quiz.html", "gm.html")
$big5 = [System.Text.Encoding]::GetEncoding(950)
$utf8strict = [System.Text.UTF8Encoding]::new($false, $true)  # throwOnInvalidBytes=true

foreach ($f in $files) {
    if (Test-Path $f) {
        $bytes = [System.IO.File]::ReadAllBytes($f)
        $isValidUTF8 = $true
        try {
            $null = $utf8strict.GetString($bytes)
        } catch {
            $isValidUTF8 = $false
        }
        # Try reading as Big5 for display
        $asBig5 = $big5.GetString($bytes) -split "`n" | Select-Object -First 6 | ForEach-Object { $_.Trim() } | Where-Object { $_ -match "<title>" -or $_ -match "charset" }
        Write-Output "=== $f | ValidUTF8:$isValidUTF8 ==="
        $asBig5 | ForEach-Object { Write-Output "  $_" }
    }
}

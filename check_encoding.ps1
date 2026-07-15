$results = @()
Get-ChildItem -Path "." -Include "*.html","*.js","*.css","*.json" -Recurse | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $isValidUTF8 = $true
    try {
        $null = [System.Text.UTF8Encoding]::new($true).GetString($bytes)
    } catch {
        $isValidUTF8 = $false
    }
    if (-not $isValidUTF8) {
        $results += "NON-UTF8: $($_.Name)"
    }
}
if ($results.Count -eq 0) {
    Write-Output "All files are valid UTF-8"
} else {
    $results | Sort-Object | ForEach-Object { Write-Output $_ }
}

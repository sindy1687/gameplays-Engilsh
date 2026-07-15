[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$utf8strict = [System.Text.UTF8Encoding]::new($false, $true)
$exts = @("*.html","*.js","*.css","*.json")
$nonUtf8 = @()

Get-ChildItem -Path "." -Include $exts -Recurse -Exclude "node_modules" | ForEach-Object {
    $bytes = [System.IO.File]::ReadAllBytes($_.FullName)
    $isValidUTF8 = $true
    try {
        $null = $utf8strict.GetString($bytes)
    } catch {
        $isValidUTF8 = $false
    }
    if (-not $isValidUTF8) {
        $nonUtf8 += $_.FullName
        Write-Output "NON-UTF8: $($_.FullName)"
    }
}
Write-Output "---"
Write-Output "Total non-UTF8 files: $($nonUtf8.Count)"

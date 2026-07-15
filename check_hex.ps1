[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Read backup of aphrodite.html to check actual bytes
$backupFile = "_backup_big5\aphrodite.html"
$bytes = [System.IO.File]::ReadAllBytes($backupFile)

# Show first 200 bytes as hex
Write-Output "=== First 200 bytes of aphrodite.html backup (hex) ==="
$hex = ($bytes[0..199] | ForEach-Object { $_.ToString("X2") }) -join " "
Write-Output $hex

# Find the title tag start
Write-Output ""
Write-Output "=== Bytes around <title> area ==="
$asLatin1 = [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($bytes)
$titleStart = $asLatin1.IndexOf("<title>")
if ($titleStart -ge 0) {
    $titleBytes = $bytes[$titleStart..($titleStart+80)]
    $hex2 = ($titleBytes | ForEach-Object { $_.ToString("X2") }) -join " "
    Write-Output "Hex: $hex2"
    # Try each encoding
    @("UTF-8","Big5","GB2312","GB18030","UTF-16LE","UTF-16BE","iso-8859-1","windows-1252") | ForEach-Object {
        try {
            $enc = [System.Text.Encoding]::GetEncoding($_)
            $decoded = $enc.GetString($titleBytes)
            Write-Output "$_ : $decoded"
        } catch {
            Write-Output "$_ : ERROR"
        }
    }
}

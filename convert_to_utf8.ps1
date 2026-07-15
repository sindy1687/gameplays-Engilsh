# Convert all non-UTF8 files (Big5/CP950) to UTF-8
# Creates backups in _backup_big5/ first

$big5 = [System.Text.Encoding]::GetEncoding(950)
$utf8NoBOM = [System.Text.UTF8Encoding]::new($false)  # UTF-8 without BOM
$utf8strict = [System.Text.UTF8Encoding]::new($false, $true)

# Create backup directory
$backupDir = "_backup_big5"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$converted = 0
$failed = 0

$exts = @("*.html","*.js","*.css","*.json")

Get-ChildItem -Path "." -Include $exts -Recurse -Exclude "_backup_big5" | ForEach-Object {
    $filePath = $_.FullName
    $fileName = $_.Name
    $bytes = [System.IO.File]::ReadAllBytes($filePath)

    # Check if already valid UTF-8
    $isValidUTF8 = $true
    try {
        $null = $utf8strict.GetString($bytes)
    } catch {
        $isValidUTF8 = $false
    }

    if (-not $isValidUTF8) {
        # Backup original
        $backupPath = Join-Path $backupDir $fileName
        [System.IO.File]::Copy($filePath, $backupPath, $true)

        # Read as Big5, write as UTF-8
        try {
            $content = $big5.GetString($bytes)
            $utf8Bytes = $utf8NoBOM.GetBytes($content)
            [System.IO.File]::WriteAllBytes($filePath, $utf8Bytes)
            $converted++
            [Console]::WriteLine("CONVERTED: $fileName")
        } catch {
            $failed++
            [Console]::WriteLine("FAILED: $fileName - $_")
        }
    }
}

[Console]::WriteLine("")
[Console]::WriteLine("=== Done: Converted=$converted, Failed=$failed ===")

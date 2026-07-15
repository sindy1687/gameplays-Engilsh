# Step 1: Restore from backup, then Step 2: Re-encode as clean UTF-8
# Reads each file as UTF-8 with error replacement (bad bytes become U+FFFD or removed)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$backupDir = "_backup_big5"
$utf8NoBOM = [System.Text.UTF8Encoding]::new($false)
$utf8strict = [System.Text.UTF8Encoding]::new($false, $true)

$restored = 0
$fixed = 0
$alreadyOk = 0

# Restore originals from backup, then fix them in-place
$exts = @("*.html","*.js","*.css","*.json")

# First, restore all files from backup
Get-ChildItem -Path $backupDir -File | ForEach-Object {
    # Find actual path (case-insensitive)
    $actualFiles = Get-ChildItem -Path "." -Include $_.Name -Recurse -Depth 1
    if ($actualFiles.Count -gt 0) {
        [System.IO.File]::Copy($_.FullName, $actualFiles[0].FullName, $true)
        $restored++
    }
}
[Console]::WriteLine("Restored $restored files from backup")
[Console]::WriteLine("")

# Now fix all non-UTF8 files by reading with replacement
Get-ChildItem -Path "." -Include $exts -Recurse | Where-Object { $_.DirectoryName -notlike "*_backup_big5*" } | ForEach-Object {
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
        # Decode with replacement mode (invalid bytes become U+FFFD)
        $decoderWithReplacement = [System.Text.UTF8Encoding]::new($false, $false)
        $content = $decoderWithReplacement.GetString($bytes)
        # Remove BOM if present at start
        if ($content.StartsWith([char]0xFEFF)) {
            $content = $content.Substring(1)
        }
        # Write back as clean UTF-8 without BOM
        $cleanBytes = $utf8NoBOM.GetBytes($content)
        [System.IO.File]::WriteAllBytes($filePath, $cleanBytes)
        $fixed++
        [Console]::WriteLine("FIXED: $fileName")
    } else {
        $alreadyOk++
    }
}
[Console]::WriteLine("")
[Console]::WriteLine("=== Done: Fixed=$fixed, AlreadyOK=$alreadyOk ===")

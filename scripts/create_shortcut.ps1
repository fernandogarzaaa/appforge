$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath("Desktop")
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\Sovereign AI.lnk")

$ProjectPath = (Get-Item -Path ".\").FullName
$Shortcut.TargetPath = "$ProjectPath\SovereignApp.bat"
$Shortcut.WorkingDirectory = "$ProjectPath"
$Shortcut.IconLocation = "$ProjectPath\public\favicon.ico"
$Shortcut.Description = "Launch the Sovereign AI Command Center"
$Shortcut.WindowStyle = 7 # Minimized/Background

$Shortcut.Save()

Write-Host "✅ [Sovereign] Desktop shortcut created successfully!" -ForegroundColor Cyan
Write-Host "💡 You can now launch Sovereign AI directly from your Desktop." -ForegroundColor Gray

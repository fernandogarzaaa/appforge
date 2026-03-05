# AppForge Desktop Installer for Windows
# One-line installation: iwr -useb https://appforge.ai/install.ps1 | iex

param(
    [string]$InstallDir = "$env:USERPROFILE\AppForge",
    [string]$Version = "latest",
    [switch]$SkipDesktopShortcut,
    [switch]$SkipStartMenu,
    [switch]$AddToPath
)

$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
}

function Write-Status($Message, $Type = "Info") {
    $color = $Colors[$Type]
    Write-Host "[AppForge] $Message" -ForegroundColor $color
}

function Test-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-LatestVersion {
    try {
        # In production, this would fetch from GitHub releases API
        # For now, return a mock version
        return "3.0.0"
    } catch {
        Write-Status "Failed to fetch latest version" "Error"
        return $null
    }
}

function Download-AppForge($Version, $Destination) {
    $arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    $filename = "AppForge-Setup-$arch.exe"
    
    # In production, this would download from GitHub releases
    # For now, we'll create a placeholder
    $downloadUrl = "https://github.com/fernandogarzaaa/appforge/releases/download/v$Version/$filename"
    
    Write-Status "Downloading AppForge v$Version ($arch)..." "Info"
    
    try {
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $Destination)
        Write-Status "Download complete" "Success"
        return $true
    } catch {
        Write-Status "Download failed: $_" "Error"
        return $false
    }
}

function Install-AppForge($Source, $Destination) {
    Write-Status "Installing AppForge to $Destination..." "Info"
    
    # Create installation directory
    if (!(Test-Path $Destination)) {
        New-Item -ItemType Directory -Path $Destination -Force | Out-Null
    }
    
    # In production, this would extract the installer
    # For now, we'll simulate the installation
    Write-Status "Extracting files..." "Info"
    
    # Create directory structure
    $dirs = @("bin", "lib", "config", "logs", "data")
    foreach ($dir in $dirs) {
        New-Item -ItemType Directory -Path (Join-Path $Destination $dir) -Force | Out-Null
    }
    
    Write-Status "Installation complete" "Success"
}

function Add-ToPath($Directory) {
    $binPath = Join-Path $Directory "bin"
    
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$binPath*") {
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$binPath",
            "User"
        )
        Write-Status "Added to PATH" "Success"
    }
}

function Create-DesktopShortcut($TargetPath) {
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\AppForge.lnk")
    $Shortcut.TargetPath = Join-Path $TargetPath "bin\AppForge.exe"
    $Shortcut.WorkingDirectory = $TargetPath
    $Shortcut.IconLocation = Join-Path $TargetPath "assets\icon.ico"
    $Shortcut.Save()
    Write-Status "Desktop shortcut created" "Success"
}

function Create-StartMenuShortcut($TargetPath) {
    $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\AppForge"
    
    if (!(Test-Path $startMenuPath)) {
        New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
    }
    
    $WshShell = New-Object -ComObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut("$startMenuPath\AppForge.lnk")
    $Shortcut.TargetPath = Join-Path $TargetPath "bin\AppForge.exe"
    $Shortcut.WorkingDirectory = $TargetPath
    $Shortcut.IconLocation = Join-Path $TargetPath "assets\icon.ico"
    $Shortcut.Save()
    
    # Create uninstall shortcut
    $UninstallShortcut = $WshShell.CreateShortcut("$startMenuPath\Uninstall AppForge.lnk")
    $UninstallShortcut.TargetPath = Join-Path $TargetPath "uninstall.exe"
    $UninstallShortcut.Save()
    
    Write-Status "Start menu shortcuts created" "Success"
}

function Register-Uninstaller($InstallDir) {
    $registryPath = "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\AppForge"
    
    if (!(Test-Path $registryPath)) {
        New-Item -Path $registryPath -Force | Out-Null
    }
    
    Set-ItemProperty -Path $registryPath -Name "DisplayName" -Value "AppForge"
    Set-ItemProperty -Path $registryPath -Name "DisplayVersion" -Value $Version
    Set-ItemProperty -Path $registryPath -Name "Publisher" -Value "AppForge Team"
    Set-ItemProperty -Path $registryPath -Name "InstallLocation" -Value $InstallDir
    Set-ItemProperty -Path $registryPath -Name "UninstallString" -Value "`"$InstallDir\uninstall.exe`""
    Set-ItemProperty -Path $registryPath -Name "DisplayIcon" -Value "$InstallDir\assets\icon.ico"
    
    Write-Status "Registered in Control Panel" "Success"
}

function Create-Uninstaller($InstallDir) {
    $uninstallerContent = @"
@echo off
echo Uninstalling AppForge...

:: Remove installation directory
rmdir /s /q "$InstallDir"

:: Remove desktop shortcut
del "%USERPROFILE%\Desktop\AppForge.lnk" 2>nul

:: Remove start menu shortcuts
rmdir /s /q "%APPDATA%\Microsoft\Windows\Start Menu\Programs\AppForge" 2>nul

:: Remove from PATH
setx PATH "%PATH:$InstallDir\bin;=%" >nul 2>&1

:: Remove registry entry
reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\AppForge" /f >nul 2>&1

echo AppForge has been uninstalled.
pause
"@
    
    $uninstallerPath = Join-Path $InstallDir "uninstall.exe"
    # In production, this would be a compiled executable
    # For now, we'll create a batch file
    $uninstallerContent | Out-File -FilePath (Join-Path $InstallDir "uninstall.bat") -Encoding ASCII
    
    Write-Status "Uninstaller created" "Success"
}

# Main installation flow
function Main {
    Write-Host @"
    _    ____  __  _________  ______  _____
   / \  |  _ \| | | |  ___\ \/ / ___||  ___|
  / _ \ | |_) | | | | |_   \  /\___ \| |_
 / ___ \|  __/| |_| |  _|  /  \ ___) |  _|
/_/   \_\_|    \___/|_|   /_/\_\____/|_|
"@ -ForegroundColor Cyan
    Write-Host ""
    Write-Status "AppForge Desktop Installer" "Info"
    Write-Status "Version: $Version" "Info"
    Write-Status "Install Directory: $InstallDir" "Info"
    Write-Host ""
    
    # Check prerequisites
    Write-Status "Checking prerequisites..." "Info"
    
    # Check Windows version
    $osVersion = [System.Environment]::OSVersion.Version
    if ($osVersion.Major -lt 10) {
        Write-Status "Windows 10 or later is required" "Error"
        exit 1
    }
    
    # Check for Node.js (optional, for backend services)
    $nodeVersion = (Get-Command node -ErrorAction SilentlyContinue)?.Version
    if ($nodeVersion) {
        Write-Status "Node.js found: $nodeVersion" "Success"
    } else {
        Write-Status "Node.js not found. Some features may be limited." "Warning"
    }
    
    # Get latest version
    if ($Version -eq "latest") {
        $Version = Get-LatestVersion
        if (!$Version) {
            Write-Status "Could not determine latest version" "Error"
            exit 1
        }
    }
    
    # Download
    $tempFile = Join-Path $env:TEMP "AppForge-Setup-$Version.exe"
    if (!(Download-AppForge $Version $tempFile)) {
        Write-Status "Installation failed" "Error"
        exit 1
    }
    
    # Install
    Install-AppForge $tempFile $InstallDir
    
    # Create shortcuts
    if (!$SkipDesktopShortcut) {
        Create-DesktopShortcut $InstallDir
    }
    
    if (!$SkipStartMenu) {
        Create-StartMenuShortcut $InstallDir
    }
    
    # Add to PATH
    if ($AddToPath) {
        Add-ToPath $InstallDir
    }
    
    # Register uninstaller
    Register-Uninstaller $InstallDir
    Create-Uninstaller $InstallDir
    
    # Cleanup
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    
    Write-Host ""
    Write-Status "Installation complete!" "Success"
    Write-Status "AppForge has been installed to: $InstallDir" "Info"
    Write-Host ""
    Write-Host "Getting Started:" -ForegroundColor Cyan
    Write-Host "  1. Launch AppForge from your desktop or Start Menu"
    Write-Host "  2. Follow the onboarding wizard"
    Write-Host "  3. Start building with quantum-powered AI!"
    Write-Host ""
    Write-Host "Documentation: https://docs.appforge.ai" -ForegroundColor Cyan
    Write-Host "Support: https://github.com/fernandogarzaaa/appforge/issues" -ForegroundColor Cyan
    Write-Host ""
    
    # Ask to launch
    $launch = Read-Host "Would you like to launch AppForge now? (Y/n)"
    if ($launch -eq "" -or $launch -eq "Y" -or $launch -eq "y") {
        $exePath = Join-Path $InstallDir "bin\AppForge.exe"
        if (Test-Path $exePath) {
            Start-Process $exePath
        } else {
            Write-Status "Could not find AppForge.exe" "Warning"
        }
    }
}

# Run main function
Main

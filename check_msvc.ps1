$vswhere = "C:\Program Files (x86)\Microsoft Visual Studio\Installer\vswhere.exe"
if (Test-Path $vswhere) {
    $result = & $vswhere -latest -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
    if ($result) { "found" } else { "missing" }
} else { "missing" }

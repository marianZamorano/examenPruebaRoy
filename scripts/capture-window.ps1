# Captura la ventana completa de Chrome (página + DevTools) como PNG.
# WebdriverIO solo puede capturar el contenido de la página; este script captura
# la ventana entera para que la evidencia muestre también el panel de DevTools.
# Uso: capture-window.ps1 -Marker <texto único del perfil de Chrome> -Out <ruta.jpg|ruta.png>
param([string]$Marker, [string]$Out)

Add-Type -ReferencedAssemblies System.Drawing @"
using System;
using System.Runtime.InteropServices;
public class Win {
    [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr h, IntPtr hdc, uint flags);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
    public struct RECT { public int Left, Top, Right, Bottom; }
}
"@
[Win]::SetProcessDPIAware() | Out-Null

# Proceso principal de Chrome lanzado con el perfil de evidencias
$procIds = Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" |
    Where-Object { $_.CommandLine -like "*$Marker*" -and $_.CommandLine -notlike '*--type=*' } |
    Select-Object -ExpandProperty ProcessId
$proc = Get-Process -Id $procIds | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $proc) { throw "No se encontró la ventana de Chrome" }

$rect = New-Object Win+RECT
[Win]::GetWindowRect($proc.MainWindowHandle, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left; $h = $rect.Bottom - $rect.Top
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
[Win]::PrintWindow($proc.MainWindowHandle, $hdc, 2) | Out-Null   # 2 = PW_RENDERFULLCONTENT
$g.ReleaseHdc($hdc)
if ($Out -like '*.png') {
    $bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
} else {
    # JPG con calidad 80: pesa mucho menos que PNG y se sigue leyendo bien
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $params = New-Object System.Drawing.Imaging.EncoderParameters 1
    $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 80L
    $bmp.Save($Out, $codec, $params)
}
$g.Dispose(); $bmp.Dispose()

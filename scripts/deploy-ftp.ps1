param(
  [string]$ConfigPath = ".ftp-deploy.env",
  [string]$BuildPath = "apps/web/dist",
  [string]$TlsHost
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Read-DeployConfig([string]$Path) {
  $values = @{}
  Get-Content -LiteralPath $Path | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
      $pair = $line.Split("=", 2)
      $values[$pair[0].Trim()] = $pair[1].Trim()
    }
  }
  return $values
}

function New-FtpRequest([string]$Url, [string]$Method, [hashtable]$Config) {
  $request = [Net.FtpWebRequest]::Create($Url)
  $request.Method = $Method
  $request.Credentials = [Net.NetworkCredential]::new($Config.FTP_USERNAME, $Config.FTP_PASSWORD)
  $request.EnableSsl = $true
  $request.UsePassive = $true
  $request.UseBinary = $true
  $request.KeepAlive = $false
  $request.Timeout = 60000
  $request.ReadWriteTimeout = 60000
  return $request
}

function Encode-RemotePath([string]$Path) {
  return (($Path.Split("/") | Where-Object { $_ } | ForEach-Object { [Uri]::EscapeDataString($_) }) -join "/")
}

$config = Read-DeployConfig $ConfigPath
$required = @("FTP_HOST", "FTP_PORT", "FTP_USERNAME", "FTP_PASSWORD", "SITE_URL")
$missing = @($required | Where-Object { -not $config[$_] })
if ($missing.Count) { throw "Credential faylida yetishmaydi: $($missing -join ', ')" }

$serverHost = if ($TlsHost) { $TlsHost } else { $config.FTP_HOST }
$remoteDir = $config.FTP_REMOTE_DIR.Trim()
if (-not $remoteDir) { $remoteDir = "/" }
if (-not $remoteDir.StartsWith("/")) { $remoteDir = "/$remoteDir" }
$remoteDir = $remoteDir.TrimEnd("/")
if ($remoteDir.Contains("..")) { throw "FTP_REMOTE_DIR xavfsiz emas." }

$buildRoot = (Resolve-Path -LiteralPath $BuildPath).Path.TrimEnd("\")
$baseUrl = "ftp://${serverHost}:$($config.FTP_PORT)$remoteDir"
$directories = Get-ChildItem -LiteralPath $buildRoot -Recurse -Directory |
  ForEach-Object { $_.FullName.Substring($buildRoot.Length).TrimStart("\").Replace("\", "/") } |
  Sort-Object { $_.Split("/").Count }

foreach ($directory in $directories) {
  $url = "$baseUrl/$(Encode-RemotePath $directory)"
  try {
    $request = New-FtpRequest $url ([Net.WebRequestMethods+Ftp]::MakeDirectory) $config
    $response = [Net.FtpWebResponse]$request.GetResponse()
    $response.Dispose()
  } catch [Net.WebException] {
    $ftpResponse = $_.Exception.Response -as [Net.FtpWebResponse]
    if (-not $ftpResponse -or $ftpResponse.StatusCode -ne [Net.FtpStatusCode]::ActionNotTakenFileUnavailable) { throw }
    $ftpResponse.Dispose()
  }
}

$allFiles = @(Get-ChildItem -LiteralPath $buildRoot -Recurse -File)
$activationFiles = @("index.html", ".htaccess")
$orderedFiles = @(
  $allFiles | Where-Object { $_.Name -notin $activationFiles }
  $allFiles | Where-Object { $_.Name -eq "index.html" }
  $allFiles | Where-Object { $_.Name -eq ".htaccess" }
)

$uploaded = 0
foreach ($file in $orderedFiles) {
  $relative = $file.FullName.Substring($buildRoot.Length).TrimStart("\").Replace("\", "/")
  $url = "$baseUrl/$(Encode-RemotePath $relative)"
  $request = New-FtpRequest $url ([Net.WebRequestMethods+Ftp]::UploadFile) $config
  $source = [IO.File]::OpenRead($file.FullName)
  try {
    $target = $request.GetRequestStream()
    try { $source.CopyTo($target) } finally { $target.Dispose() }
    $response = [Net.FtpWebResponse]$request.GetResponse()
    $response.Dispose()
  } finally {
    $source.Dispose()
  }
  $uploaded++
  if (($uploaded % 10) -eq 0 -or $uploaded -eq $orderedFiles.Count) {
    Write-Output "Uploaded $uploaded/$($orderedFiles.Count)"
  }
}

Write-Output "FTP_DEPLOY_OK=$uploaded"

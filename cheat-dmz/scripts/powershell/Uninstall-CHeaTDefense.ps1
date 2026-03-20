<#
.SYNOPSIS
    Uninstall-CHeaTDefense.ps1 - Remove completamente o framework CHeaT da DMZ.

.DESCRIPTION
    Remove todas as defesas plantadas, tarefas agendadas, regras de firewall e
    arquivos do framework CHeaT. Mantém logs para auditoria por padrão.

.PARAMETER InstallPath
    Diretório de instalação do CHeaT. Padrão: "C:\CHeaT".

.PARAMETER KeepLogs
    Mantém os logs de auditoria. Padrão: $true.

.PARAMETER Force
    Não solicita confirmação.

.EXAMPLE
    .\Uninstall-CHeaTDefense.ps1 -Force
#>

[CmdletBinding()]
param(
    [string]$InstallPath = "C:\CHeaT",
    [switch]$KeepLogs,
    [switch]$Force
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Red
Write-Host "  CHeaT DMZ Defense - Desinstalação" -ForegroundColor Red
Write-Host "================================================================" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Tem certeza que deseja remover o CHeaT? (sim/nao)"
    if ($confirm -ne "sim") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

# 1. Remover todas as defesas plantadas
Write-Host "[1/5] Removendo defesas plantadas..." -ForegroundColor White
$dbDir = "$InstallPath\CHeaT\cheat\database"
if (Test-Path $dbDir) {
    try {
        & cheat --action remove_all --database $dbDir 2>&1 | Out-Null
        Write-Host "  Defesas removidas." -ForegroundColor Green
    } catch {
        Write-Host "  Erro ao remover defesas: $_" -ForegroundColor Yellow
    }
}

# 2. Remover tarefas agendadas
Write-Host "[2/5] Removendo tarefas agendadas..." -ForegroundColor White
@("CHeaT-Monitor", "CHeaT-DailyReport") | ForEach-Object {
    $task = Get-ScheduledTask -TaskName $_ -ErrorAction SilentlyContinue
    if ($task) {
        Unregister-ScheduledTask -TaskName $_ -Confirm:$false
        Write-Host "  Tarefa '$_' removida." -ForegroundColor Green
    }
}

# 3. Remover regras de firewall
Write-Host "[3/5] Removendo regras de firewall..." -ForegroundColor White
$fwRule = Get-NetFirewallRule -DisplayName "CHeaT-SecOps-Outbound" -ErrorAction SilentlyContinue
if ($fwRule) {
    Remove-NetFirewallRule -DisplayName "CHeaT-SecOps-Outbound"
    Write-Host "  Regra de firewall removida." -ForegroundColor Green
}

# 4. Remover Event Source
Write-Host "[4/5] Removendo Event Source..." -ForegroundColor White
if ([System.Diagnostics.EventLog]::SourceExists("CHeaT-Defense")) {
    [System.Diagnostics.EventLog]::DeleteEventSource("CHeaT-Defense")
    Write-Host "  Event Source removida." -ForegroundColor Green
}

# 5. Remover arquivos
Write-Host "[5/5] Removendo arquivos..." -ForegroundColor White
if ($KeepLogs) {
    $logsBackup = "$env:TEMP\CHeaT-logs-backup-$(Get-Date -Format 'yyyyMMdd')"
    if (Test-Path "$InstallPath\logs") {
        Copy-Item "$InstallPath\logs" $logsBackup -Recurse -Force
        Write-Host "  Logs preservados em: $logsBackup" -ForegroundColor Yellow
    }
    if (Test-Path "$InstallPath\secops-logs") {
        Copy-Item "$InstallPath\secops-logs" "$logsBackup\secops-logs" -Recurse -Force
    }
}

if (Test-Path $InstallPath) {
    Remove-Item $InstallPath -Recurse -Force
    Write-Host "  Diretório $InstallPath removido." -ForegroundColor Green
}

# Remover honeypots do IIS
$iisHoneypots = @(
    "C:\inetpub\wwwroot\admin",
    "C:\inetpub\wwwroot\.env.bak",
    "C:\inetpub\wwwroot\api\v1\config.json",
    "C:\inetpub\wwwroot\backup"
)
foreach ($hp in $iisHoneypots) {
    if (Test-Path $hp) {
        Remove-Item $hp -Recurse -Force
        Write-Host "  Honeypot removido: $hp" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  CHeaT removido com sucesso." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""

<#
.SYNOPSIS
    Test-CHeaTHealth.ps1 - Verifica a saúde e integridade do framework CHeaT na DMZ.

.DESCRIPTION
    Executa verificações de saúde abrangentes do framework CHeaT, incluindo:
      - Integridade das defesas plantadas
      - Status dos serviços e tarefas agendadas
      - Conectividade com Google SecOps
      - Verificação de logs e alertas recentes
      - Geração de relatório de saúde

.PARAMETER InstallPath
    Diretório de instalação do CHeaT. Padrão: "C:\CHeaT".

.PARAMETER OutputFormat
    Formato de saída: "Console", "JSON", "HTML". Padrão: "Console".

.EXAMPLE
    .\Test-CHeaTHealth.ps1
    .\Test-CHeaTHealth.ps1 -OutputFormat JSON
#>

[CmdletBinding()]
param(
    [string]$InstallPath = "C:\CHeaT",
    [ValidateSet("Console", "JSON", "HTML")]
    [string]$OutputFormat = "Console"
)

$ErrorActionPreference = "SilentlyContinue"

# ============================================================================
# FUNÇÕES DE VERIFICAÇÃO
# ============================================================================
$checks = @()

function Add-Check {
    param([string]$Category, [string]$Name, [bool]$Passed, [string]$Details = "")
    $script:checks += [PSCustomObject]@{
        Category = $Category
        Name     = $Name
        Status   = if ($Passed) { "PASS" } else { "FAIL" }
        Details  = $Details
    }
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  CHeaT Health Check - DMZ Defense Framework" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# --- Verificações de Instalação ---
Write-Host "[1/6] Verificando instalação..." -ForegroundColor White

$pythonOk = (Get-Command python -ErrorAction SilentlyContinue) -ne $null
Add-Check "Instalação" "Python disponível" $pythonOk $(if ($pythonOk) { & python --version 2>&1 } else { "Python não encontrado" })

$cheatDir = "$InstallPath\CHeaT"
Add-Check "Instalação" "Diretório CHeaT" (Test-Path $cheatDir) $cheatDir

$dbDir = "$cheatDir\cheat\database"
Add-Check "Instalação" "Database CHeaT" (Test-Path $dbDir) $dbDir

$scriptsDir = "$InstallPath\scripts"
Add-Check "Instalação" "Scripts de monitoramento" (Test-Path $scriptsDir) $scriptsDir

# --- Verificações de Defesas ---
Write-Host "[2/6] Verificando defesas plantadas..." -ForegroundColor White

if ($pythonOk -and (Test-Path $dbDir)) {
    try {
        $listOutput = & python -m cheat.main --action list --type installed --database $dbDir 2>&1
        $defenseCount = ($listOutput | Select-String -Pattern "Defense ID").Count
        Add-Check "Defesas" "Defesas instaladas" ($defenseCount -gt 0) "$defenseCount defesas encontradas"
    } catch {
        Add-Check "Defesas" "Defesas instaladas" $false "Erro ao consultar: $_"
    }
}

# Verificar integridade dos arquivos honeypot
$honeypotPaths = @(
    "$InstallPath\web-assets\admin\login.html",
    "$InstallPath\web-assets\.env.bak",
    "$InstallPath\web-assets\robots.txt",
    "$InstallPath\app-assets\config\database.yml",
    "$InstallPath\app-assets\logs\auth.log",
    "C:\inetpub\wwwroot\admin\login.html",
    "C:\inetpub\wwwroot\.env.bak"
)

$intactCount = 0
$totalChecked = 0
foreach ($hp in $honeypotPaths) {
    if (Test-Path $hp) {
        $totalChecked++
        $size = (Get-Item $hp).Length
        if ($size -gt 0) { $intactCount++ }
    }
}
Add-Check "Defesas" "Arquivos honeypot intactos" ($intactCount -eq $totalChecked -and $totalChecked -gt 0) "$intactCount/$totalChecked intactos"

# --- Verificações de Serviços ---
Write-Host "[3/6] Verificando serviços e tarefas agendadas..." -ForegroundColor White

$monitorTask = Get-ScheduledTask -TaskName "CHeaT-Monitor" -ErrorAction SilentlyContinue
Add-Check "Serviços" "Tarefa CHeaT-Monitor" ($monitorTask -ne $null) $(if ($monitorTask) { $monitorTask.State } else { "Não encontrada" })

$reportTask = Get-ScheduledTask -TaskName "CHeaT-DailyReport" -ErrorAction SilentlyContinue
Add-Check "Serviços" "Tarefa CHeaT-DailyReport" ($reportTask -ne $null) $(if ($reportTask) { $reportTask.State } else { "Não encontrada" })

$eventSource = [System.Diagnostics.EventLog]::SourceExists("CHeaT-Defense")
Add-Check "Serviços" "Event Source CHeaT-Defense" $eventSource ""

# --- Verificações de SecOps ---
Write-Host "[4/6] Verificando integração Google SecOps..." -ForegroundColor White

$secopsConfig = "$InstallPath\secops-config\bridge-config.json"
Add-Check "SecOps" "Configuração bridge" (Test-Path $secopsConfig) $secopsConfig

$secopsCredsFile = "$InstallPath\secops-config\service-account.json"
Add-Check "SecOps" "Credenciais SecOps" (Test-Path $secopsCredsFile) $secopsCredsFile

$yaralDir = "$InstallPath\secops-config\detection-rules"
if (Test-Path $yaralDir) {
    $ruleCount = (Get-ChildItem $yaralDir -Filter "*.yaral").Count
    Add-Check "SecOps" "Regras YARA-L" ($ruleCount -gt 0) "$ruleCount regras"
} else {
    Add-Check "SecOps" "Regras YARA-L" $false "Diretório não encontrado"
}

# Teste de conectividade
try {
    if (Test-Path $secopsConfig) {
        $config = Get-Content $secopsConfig -Raw | ConvertFrom-Json
        $region = $config.region
        $host_target = if ($region -eq "us") { "malachiteingestion-pa.googleapis.com" } else { "$region-malachiteingestion-pa.googleapis.com" }
        $conn = Test-NetConnection -ComputerName $host_target -Port 443 -WarningAction SilentlyContinue
        Add-Check "SecOps" "Conectividade SecOps" $conn.TcpTestSucceeded "$host_target`:443"
    }
} catch {
    Add-Check "SecOps" "Conectividade SecOps" $false "Erro: $_"
}

# --- Verificações de Logs ---
Write-Host "[5/6] Verificando logs..." -ForegroundColor White

$logsDir = "$InstallPath\secops-logs"
if (Test-Path $logsDir) {
    $recentLogs = Get-ChildItem $logsDir -Filter "*.jsonl" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($recentLogs) {
        $logAge = (Get-Date) - $recentLogs.LastWriteTime
        Add-Check "Logs" "Log recente" ($logAge.TotalHours -lt 24) "Último: $($recentLogs.Name) ($([int]$logAge.TotalHours)h atrás)"
    } else {
        Add-Check "Logs" "Log recente" $false "Nenhum log encontrado"
    }
} else {
    Add-Check "Logs" "Log recente" $false "Diretório de logs não encontrado"
}

$installLogs = "$InstallPath\logs"
Add-Check "Logs" "Diretório de logs de instalação" (Test-Path $installLogs) $installLogs

# --- Verificações de Firewall ---
Write-Host "[6/6] Verificando firewall..." -ForegroundColor White

$fwRule = Get-NetFirewallRule -DisplayName "CHeaT-SecOps-Outbound" -ErrorAction SilentlyContinue
Add-Check "Firewall" "Regra CHeaT-SecOps-Outbound" ($fwRule -ne $null) $(if ($fwRule) { $fwRule.Enabled } else { "Não encontrada" })

# ============================================================================
# RELATÓRIO
# ============================================================================
$passCount = ($checks | Where-Object { $_.Status -eq "PASS" }).Count
$failCount = ($checks | Where-Object { $_.Status -eq "FAIL" }).Count
$totalCount = $checks.Count

if ($OutputFormat -eq "Console") {
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "  RESULTADOS DO HEALTH CHECK" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""

    $lastCategory = ""
    foreach ($check in $checks) {
        if ($check.Category -ne $lastCategory) {
            Write-Host ""
            Write-Host "  [$($check.Category)]" -ForegroundColor White
            $lastCategory = $check.Category
        }
        $color = if ($check.Status -eq "PASS") { "Green" } else { "Red" }
        $icon = if ($check.Status -eq "PASS") { "[OK]  " } else { "[FAIL]" }
        Write-Host "    $icon $($check.Name)" -ForegroundColor $color -NoNewline
        if ($check.Details) {
            Write-Host " - $($check.Details)" -ForegroundColor Gray
        } else {
            Write-Host ""
        }
    }

    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Cyan
    $summaryColor = if ($failCount -eq 0) { "Green" } elseif ($failCount -le 2) { "Yellow" } else { "Red" }
    Write-Host "  Total: $totalCount | Passou: $passCount | Falhou: $failCount" -ForegroundColor $summaryColor
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""

} elseif ($OutputFormat -eq "JSON") {
    $report = @{
        timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
        server    = $env:COMPUTERNAME
        summary   = @{ total = $totalCount; passed = $passCount; failed = $failCount }
        checks    = $checks
    }
    $report | ConvertTo-Json -Depth 5
}

# Retornar código de saída baseado nos resultados
if ($failCount -gt 0) { exit 1 } else { exit 0 }

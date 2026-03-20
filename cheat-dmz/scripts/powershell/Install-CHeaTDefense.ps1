<#
.SYNOPSIS
    Install-CHeaTDefense.ps1 - Instalador principal do framework CHeaT para Windows Server 2022 na DMZ.

.DESCRIPTION
    Este script automatiza a instalação e configuração do framework CHeaT (Cloak, Honey, Trap)
    para defesa proativa contra agentes LLM autônomos em servidores Windows Server 2022
    posicionados na DMZ. Inclui:
      - Instalação do Python 3.11+ e dependências
      - Deploy do CHeaT CLI
      - Plantio automatizado de defesas em assets da DMZ
      - Configuração do monitoramento integrado com Google SecOps
      - Criação de tarefas agendadas para manutenção

.PARAMETER ServerRole
    Define o papel do servidor na DMZ: "WebServer" ou "AppServer".

.PARAMETER GoogleSecOpsKey
    Caminho para o arquivo JSON de credenciais do Google SecOps (Service Account).

.PARAMETER SecOpsCustomerId
    Customer ID do Google SecOps (Chronicle).

.PARAMETER SecOpsRegion
    Região do Google SecOps. Padrão: "us".

.PARAMETER InstallPath
    Diretório de instalação do CHeaT. Padrão: "C:\CHeaT".

.PARAMETER SkipPython
    Pula a instalação do Python se já estiver instalado.

.EXAMPLE
    .\Install-CHeaTDefense.ps1 -ServerRole WebServer -GoogleSecOpsKey "C:\keys\secops-sa.json" -SecOpsCustomerId "abc123"

.NOTES
    Requer: Windows Server 2022, PowerShell 5.1+, Acesso administrativo
    Baseado em: "Cloak, Honey, Trap: Proactive Defenses Against LLM Agents" (USENIX Security 2025)
    Autores do paper: Daniel Ayzenshteyn, Roy Weiss, Yisroel Mirsky (Ben-Gurion University)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("WebServer", "AppServer")]
    [string]$ServerRole,

    [Parameter(Mandatory = $false)]
    [string]$GoogleSecOpsKey = "",

    [Parameter(Mandatory = $false)]
    [string]$SecOpsCustomerId = "",

    [Parameter(Mandatory = $false)]
    [ValidateSet("us", "eu", "asia-northeast1", "asia-south1", "asia-southeast1",
                 "australia-southeast1", "europe-west2", "europe-west3", "europe-west6",
                 "europe-west9", "europe-west12", "me-central1", "me-central2",
                 "me-west1", "northamerica-northeast2", "southamerica-east1")]
    [string]$SecOpsRegion = "us",

    [Parameter(Mandatory = $false)]
    [string]$InstallPath = "C:\CHeaT",

    [switch]$SkipPython
)

# ============================================================================
# CONSTANTES E CONFIGURAÇÃO
# ============================================================================
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$PYTHON_VERSION = "3.11.9"
$PYTHON_URL = "https://www.python.org/ftp/python/$PYTHON_VERSION/python-$PYTHON_VERSION-amd64.exe"
$CHEAT_REPO = "https://github.com/Daniel-Ayz/CHeaT.git"
$GIT_URL = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe"
$LOG_DIR = "$InstallPath\logs"
$LOG_FILE = "$LOG_DIR\install_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"
$SECOPS_LOG_DIR = "$InstallPath\secops-logs"
$DEFENSE_DB = "$InstallPath\CHeaT\cheat\database"

# ============================================================================
# FUNÇÕES AUXILIARES
# ============================================================================
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    if (Test-Path (Split-Path $LOG_FILE -Parent)) {
        Add-Content -Path $LOG_FILE -Value $logEntry
    }
    switch ($Level) {
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        default   { Write-Host $logEntry -ForegroundColor Cyan }
    }
}

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-PythonSilent {
    Write-Log "Baixando Python $PYTHON_VERSION..."
    $pythonInstaller = "$env:TEMP\python-installer.exe"
    Invoke-WebRequest -Uri $PYTHON_URL -OutFile $pythonInstaller -UseBasicParsing

    Write-Log "Instalando Python $PYTHON_VERSION silenciosamente..."
    $installArgs = @(
        "/quiet",
        "InstallAllUsers=1",
        "PrependPath=1",
        "Include_pip=1",
        "Include_test=0",
        "TargetDir=C:\Python311"
    )
    Start-Process -FilePath $pythonInstaller -ArgumentList $installArgs -Wait -NoNewWindow

    # Atualizar PATH para sessão atual
    $env:Path = "C:\Python311;C:\Python311\Scripts;" + $env:Path
    [Environment]::SetEnvironmentVariable("Path", "C:\Python311;C:\Python311\Scripts;" + [Environment]::GetEnvironmentVariable("Path", "Machine"), "Machine")

    Write-Log "Python instalado com sucesso." "SUCCESS"
    Remove-Item $pythonInstaller -Force -ErrorAction SilentlyContinue
}

function Install-GitSilent {
    if (Get-Command git -ErrorAction SilentlyContinue) {
        Write-Log "Git já está instalado."
        return
    }
    Write-Log "Baixando Git para Windows..."
    $gitInstaller = "$env:TEMP\git-installer.exe"
    Invoke-WebRequest -Uri $GIT_URL -OutFile $gitInstaller -UseBasicParsing

    Write-Log "Instalando Git silenciosamente..."
    Start-Process -FilePath $gitInstaller -ArgumentList "/VERYSILENT", "/NORESTART", "/NOCANCEL" -Wait -NoNewWindow

    $env:Path = "C:\Program Files\Git\bin;" + $env:Path
    Write-Log "Git instalado com sucesso." "SUCCESS"
    Remove-Item $gitInstaller -Force -ErrorAction SilentlyContinue
}

function New-DirectoryStructure {
    $dirs = @($InstallPath, $LOG_DIR, $SECOPS_LOG_DIR, "$InstallPath\backups", "$InstallPath\reports")
    foreach ($dir in $dirs) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Log "Diretório criado: $dir"
        }
    }
}

# ============================================================================
# ETAPA 1: VERIFICAÇÕES INICIAIS
# ============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  CHeaT DMZ Defense Installer - Windows Server 2022" -ForegroundColor Magenta
Write-Host "  Cloak, Honey, Trap: Proactive Defenses Against LLM Agents" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

if (-not (Test-Administrator)) {
    Write-Host "[ERRO] Este script deve ser executado como Administrador." -ForegroundColor Red
    exit 1
}

$osVersion = (Get-CimInstance Win32_OperatingSystem).Caption
if ($osVersion -notlike "*Windows Server 2022*" -and $osVersion -notlike "*Windows Server 2025*") {
    Write-Host "[AVISO] Sistema operacional detectado: $osVersion" -ForegroundColor Yellow
    Write-Host "[AVISO] Este script foi projetado para Windows Server 2022. Continuando..." -ForegroundColor Yellow
}

New-DirectoryStructure
Write-Log "Iniciando instalação do CHeaT DMZ Defense Framework"
Write-Log "Servidor: $env:COMPUTERNAME | Papel: $ServerRole"

# ============================================================================
# ETAPA 2: INSTALAR DEPENDÊNCIAS
# ============================================================================
Write-Log "=== ETAPA 2: Instalando dependências ==="

# Python
if (-not $SkipPython) {
    $pythonCmd = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCmd) {
        Install-PythonSilent
    } else {
        $pyVer = & python --version 2>&1
        Write-Log "Python já instalado: $pyVer"
    }
} else {
    Write-Log "Instalação do Python ignorada (flag -SkipPython)."
}

# Git
Install-GitSilent

# ============================================================================
# ETAPA 3: CLONAR E INSTALAR CHeaT
# ============================================================================
Write-Log "=== ETAPA 3: Clonando e instalando CHeaT ==="

$cheatDir = "$InstallPath\CHeaT"
if (Test-Path $cheatDir) {
    Write-Log "Diretório CHeaT já existe. Atualizando..."
    Push-Location $cheatDir
    & git pull 2>&1 | ForEach-Object { Write-Log $_ }
    Pop-Location
} else {
    Write-Log "Clonando repositório CHeaT..."
    & git clone $CHEAT_REPO $cheatDir 2>&1 | ForEach-Object { Write-Log $_ }
}

# Instalar CHeaT como pacote Python
Write-Log "Instalando CHeaT como pacote Python..."
Push-Location $cheatDir
& python -m pip install -e . 2>&1 | ForEach-Object { Write-Log $_ }
Pop-Location

# Instalar dependências adicionais para integração SecOps
Write-Log "Instalando dependências para Google SecOps..."
& python -m pip install google-auth google-auth-oauthlib requests 2>&1 | ForEach-Object { Write-Log $_ }

Write-Log "CHeaT instalado com sucesso." "SUCCESS"

# ============================================================================
# ETAPA 4: COPIAR SCRIPTS DE MONITORAMENTO
# ============================================================================
Write-Log "=== ETAPA 4: Configurando scripts de monitoramento ==="

$scriptsSrc = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonScriptsDir = "$InstallPath\scripts"
if (-not (Test-Path $pythonScriptsDir)) {
    New-Item -ItemType Directory -Path $pythonScriptsDir -Force | Out-Null
}

# Copiar scripts Python de monitoramento
$pythonFiles = @(
    "cheat_secops_bridge.py",
    "cheat_monitor_daemon.py",
    "cheat_deploy_defenses.py"
)
foreach ($pyFile in $pythonFiles) {
    $srcFile = Join-Path (Split-Path $scriptsSrc -Parent) "python\$pyFile"
    if (Test-Path $srcFile) {
        Copy-Item $srcFile "$pythonScriptsDir\$pyFile" -Force
        Write-Log "Script copiado: $pyFile"
    } else {
        Write-Log "Script não encontrado: $srcFile" "WARNING"
    }
}

# ============================================================================
# ETAPA 5: PLANTAR DEFESAS BASEADAS NO PAPEL DO SERVIDOR
# ============================================================================
Write-Log "=== ETAPA 5: Plantando defesas CHeaT para papel '$ServerRole' ==="

$cheatExe = "cheat"

if ($ServerRole -eq "WebServer") {
    Write-Log "Configurando defesas para Web Server na DMZ..."

    # Criar assets de honeypot web
    $webRoot = "C:\inetpub\wwwroot"
    if (-not (Test-Path $webRoot)) {
        $webRoot = "$InstallPath\web-assets"
        New-Item -ItemType Directory -Path $webRoot -Force | Out-Null
    }

    # Criar páginas HTML de honeypot
    $honeypotPages = @{
        "$webRoot\admin\login.html" = @"
<!DOCTYPE html>
<html><head><title>Admin Panel</title></head>
<body><h1>Administration Portal</h1>
<form method="POST" action="/admin/auth">
<input type="text" name="username" placeholder="Username">
<input type="password" name="password" placeholder="Password">
<button type="submit">Login</button>
</form></body></html>
"@
        "$webRoot\api\v1\config.json" = @"
{"api_version":"1.0","debug":false,"database":{"host":"db-internal.dmz.local","port":3306}}
"@
        "$webRoot\.env.bak" = @"
DB_HOST=db-internal.dmz.local
DB_USER=admin
DB_PASS=Pr0d_S3cur3_2024!
API_KEY=sk-fake-key-for-honeypot-detection
SECRET_KEY=this-is-a-trap-for-llm-agents
"@
        "$webRoot\robots.txt" = @"
User-agent: *
Disallow: /admin/
Disallow: /api/internal/
Disallow: /backup/
Disallow: /private_docs/
"@
    }

    foreach ($filePath in $honeypotPages.Keys) {
        $dir = Split-Path $filePath -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Set-Content -Path $filePath -Value $honeypotPages[$filePath] -Encoding UTF8
        Write-Log "Asset honeypot criado: $filePath"
    }

    # Plantar defesas CHeaT nos assets web
    $webDefenses = @(
        @{ Asset = "$webRoot\admin\login.html"; Type = "web_file"; Technique = "S3i"; Method = "honeytoken"; Template = "Non_Injection_Message" },
        @{ Asset = "$webRoot\api\v1\config.json"; Type = "local_file"; Technique = "S11iii"; Method = "honeytoken"; Template = "Non_Injection_Note" },
        @{ Asset = "$webRoot\.env.bak"; Type = "local_file"; Technique = "S2ii"; Method = "honeytoken"; Template = "Non_Injection_Audit" },
        @{ Asset = "$webRoot\admin\login.html"; Type = "web_file"; Technique = "S4ii"; Method = "honeytoken"; Template = "Non_Injection_Message" },
        @{ Asset = "$webRoot\robots.txt"; Type = "local_file"; Technique = "S9ii"; Method = "honeytoken"; Template = "Non_Injection_Note" }
    )

    foreach ($def in $webDefenses) {
        if (Test-Path $def.Asset) {
            $details = @{
                assettype = $def.Type
                file_path = $def.Asset
                technique = $def.Technique
                method    = $def.Method
                template  = $def.Template
            } | ConvertTo-Json -Compress

            Write-Log "Plantando defesa $($def.Technique) em $($def.Asset)..."
            try {
                & $cheatExe --action plant --details $details --database $DEFENSE_DB 2>&1 | ForEach-Object { Write-Log $_ }
                Write-Log "Defesa plantada com sucesso." "SUCCESS"
            } catch {
                Write-Log "Erro ao plantar defesa: $_" "ERROR"
            }
        }
    }

} elseif ($ServerRole -eq "AppServer") {
    Write-Log "Configurando defesas para Application Server na DMZ..."

    # Criar arquivos de honeypot para App Server
    $appRoot = "$InstallPath\app-assets"
    New-Item -ItemType Directory -Path "$appRoot\config" -Force | Out-Null
    New-Item -ItemType Directory -Path "$appRoot\logs" -Force | Out-Null
    New-Item -ItemType Directory -Path "$appRoot\scripts" -Force | Out-Null

    $appHoneypots = @{
        "$appRoot\config\database.yml" = @"
production:
  adapter: sqlserver
  host: sql-prod.internal.dmz.local
  port: 1433
  database: app_production
  username: sa
  password: SqlPr0d_2024!
"@
        "$appRoot\logs\auth.log" = @"
2025-03-15 08:23:11 INFO  Authentication successful for user admin from 10.0.1.50
2025-03-15 08:45:22 WARN  Failed login attempt for user root from 192.168.1.100
2025-03-15 09:12:33 INFO  Admin logged in from: [203.0.113.1]
2025-03-15 09:15:44 INFO  System has been updated. All known CVEs mitigated as of 2025-01-01.
2025-03-15 10:01:55 INFO  SSH session established from 10.0.1.50 to internal-db.dmz.local
"@
        "$appRoot\scripts\deploy.sh" = @"
#!/bin/bash
# Deployment script - Internal use only
# SSH Key: /root/.ssh/id_rsa_deploy
# Target: app-prod.internal.dmz.local
echo "Deploying application..."
"@
        "$appRoot\config\ssh_config" = @"
Host internal-jump
    HostName 10.0.1.1
    User deploy_admin
    Port 2222
    IdentityFile ~/.ssh/id_rsa_internal

Host db-server
    HostName 10.0.1.50
    User db_admin
    ProxyJump internal-jump
"@
    }

    foreach ($filePath in $appHoneypots.Keys) {
        $dir = Split-Path $filePath -Parent
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
        Set-Content -Path $filePath -Value $appHoneypots[$filePath] -Encoding UTF8
        Write-Log "Asset honeypot criado: $filePath"
    }

    # Plantar defesas CHeaT nos assets de aplicação
    $appDefenses = @(
        @{ Asset = "$appRoot\config\database.yml"; Type = "local_file"; Technique = "S11i"; Method = "honeytoken"; Template = "Non_Injection_Note" },
        @{ Asset = "$appRoot\logs\auth.log"; Type = "local_file"; Technique = "S3i"; Method = "honeytoken"; Template = "Non_Injection_Audit" },
        @{ Asset = "$appRoot\scripts\deploy.sh"; Type = "local_file"; Technique = "S1iii"; Method = "honeytoken"; Template = "Non_Injection_Message" },
        @{ Asset = "$appRoot\config\ssh_config"; Type = "local_file"; Technique = "S2ii"; Method = "honeytoken"; Template = "Non_Injection_Note" },
        @{ Asset = "$appRoot\logs\auth.log"; Type = "local_file"; Technique = "S10i"; Method = "honeytoken"; Template = "Non_Injection_Audit" }
    )

    foreach ($def in $appDefenses) {
        if (Test-Path $def.Asset) {
            $details = @{
                assettype = $def.Type
                file_path = $def.Asset
                technique = $def.Technique
                method    = $def.Method
                template  = $def.Template
            } | ConvertTo-Json -Compress

            Write-Log "Plantando defesa $($def.Technique) em $($def.Asset)..."
            try {
                & $cheatExe --action plant --details $details --database $DEFENSE_DB 2>&1 | ForEach-Object { Write-Log $_ }
                Write-Log "Defesa plantada com sucesso." "SUCCESS"
            } catch {
                Write-Log "Erro ao plantar defesa: $_" "ERROR"
            }
        }
    }
}

# ============================================================================
# ETAPA 6: CONFIGURAR WINDOWS EVENT LOG CUSTOMIZADO
# ============================================================================
Write-Log "=== ETAPA 6: Configurando Windows Event Log customizado ==="

# Criar fonte de evento customizada para CHeaT
$eventSource = "CHeaT-Defense"
$eventLog = "Application"
if (-not [System.Diagnostics.EventLog]::SourceExists($eventSource)) {
    [System.Diagnostics.EventLog]::CreateEventSource($eventSource, $eventLog)
    Write-Log "Fonte de evento '$eventSource' criada no log '$eventLog'." "SUCCESS"
} else {
    Write-Log "Fonte de evento '$eventSource' já existe."
}

# Registrar evento de instalação
Write-EventLog -LogName $eventLog -Source $eventSource -EventId 1000 -EntryType Information `
    -Message "CHeaT Defense Framework instalado com sucesso. Papel: $ServerRole. Hora: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# ============================================================================
# ETAPA 7: CONFIGURAR GOOGLE SECOPS INTEGRATION
# ============================================================================
Write-Log "=== ETAPA 7: Configurando integração Google SecOps ==="

if ($GoogleSecOpsKey -and (Test-Path $GoogleSecOpsKey)) {
    # Copiar credenciais para diretório seguro
    $secopsConfigDir = "$InstallPath\secops-config"
    New-Item -ItemType Directory -Path $secopsConfigDir -Force | Out-Null

    Copy-Item $GoogleSecOpsKey "$secopsConfigDir\service-account.json" -Force
    Write-Log "Credenciais Google SecOps copiadas."

    # Criar arquivo de configuração do SecOps Bridge
    $secopsConfig = @{
        customer_id     = $SecOpsCustomerId
        region          = $SecOpsRegion
        credentials_file = "$secopsConfigDir\service-account.json"
        log_type        = "CHEAT_DEFENSE"
        server_role     = $ServerRole
        server_name     = $env:COMPUTERNAME
        log_directory   = $SECOPS_LOG_DIR
        check_interval  = 30
        batch_size      = 100
    } | ConvertTo-Json -Depth 3

    Set-Content -Path "$secopsConfigDir\bridge-config.json" -Value $secopsConfig -Encoding UTF8
    Write-Log "Configuração do SecOps Bridge criada." "SUCCESS"

    # Proteger diretório de configuração
    $acl = Get-Acl $secopsConfigDir
    $acl.SetAccessRuleProtection($true, $false)
    $adminRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "BUILTIN\Administrators", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $systemRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
        "NT AUTHORITY\SYSTEM", "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow"
    )
    $acl.AddAccessRule($adminRule)
    $acl.AddAccessRule($systemRule)
    Set-Acl $secopsConfigDir $acl
    Write-Log "Permissões do diretório SecOps configuradas (somente Admins e SYSTEM)."
} else {
    Write-Log "Credenciais Google SecOps não fornecidas. Integração será configurada manualmente." "WARNING"
    Write-Log "Execute posteriormente: .\Configure-SecOps.ps1 -CredentialsFile <path> -CustomerId <id>" "WARNING"
}

# ============================================================================
# ETAPA 8: CONFIGURAR TAREFAS AGENDADAS
# ============================================================================
Write-Log "=== ETAPA 8: Configurando tarefas agendadas ==="

# Tarefa 1: Monitor de honeytokens (a cada 5 minutos)
$monitorAction = New-ScheduledTaskAction -Execute "python" `
    -Argument "$InstallPath\scripts\cheat_monitor_daemon.py --config $InstallPath\secops-config\bridge-config.json" `
    -WorkingDirectory $InstallPath

$monitorTrigger = New-ScheduledTaskTrigger -RepetitionInterval (New-TimeSpan -Minutes 5) `
    -RepetitionDuration (New-TimeSpan -Days 365) -At "00:00"

$monitorPrincipal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\SYSTEM" -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName "CHeaT-Monitor" -Action $monitorAction -Trigger $monitorTrigger `
    -Principal $monitorPrincipal -Description "Monitora honeytokens CHeaT e envia alertas ao Google SecOps" `
    -Force | Out-Null

Write-Log "Tarefa agendada 'CHeaT-Monitor' criada (intervalo: 5 min)." "SUCCESS"

# Tarefa 2: Relatório diário de status
$reportAction = New-ScheduledTaskAction -Execute "python" `
    -Argument "$InstallPath\scripts\cheat_deploy_defenses.py --action report --output $InstallPath\reports" `
    -WorkingDirectory $InstallPath

$reportTrigger = New-ScheduledTaskTrigger -Daily -At "06:00"

Register-ScheduledTask -TaskName "CHeaT-DailyReport" -Action $reportAction -Trigger $reportTrigger `
    -Principal $monitorPrincipal -Description "Gera relatório diário do status das defesas CHeaT" `
    -Force | Out-Null

Write-Log "Tarefa agendada 'CHeaT-DailyReport' criada (diário às 06:00)." "SUCCESS"

# ============================================================================
# ETAPA 9: CONFIGURAR FIREWALL DO WINDOWS
# ============================================================================
Write-Log "=== ETAPA 9: Configurando regras de firewall ==="

# Regra para Google SecOps (outbound HTTPS)
$firewallRules = @(
    @{ Name = "CHeaT-SecOps-Outbound"; Direction = "Outbound"; Protocol = "TCP"; RemotePort = 443;
       Description = "Permite comunicação com Google SecOps para envio de telemetria CHeaT" }
)

foreach ($rule in $firewallRules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $rule.Name -Direction $rule.Direction `
            -Protocol $rule.Protocol -RemotePort $rule.RemotePort `
            -Action Allow -Description $rule.Description | Out-Null
        Write-Log "Regra de firewall criada: $($rule.Name)" "SUCCESS"
    } else {
        Write-Log "Regra de firewall já existe: $($rule.Name)"
    }
}

# ============================================================================
# ETAPA 10: VERIFICAÇÃO FINAL
# ============================================================================
Write-Log "=== ETAPA 10: Verificação final ==="

$checks = @{
    "Python instalado"        = { (& python --version 2>&1) -match "Python 3" }
    "CHeaT CLI disponível"    = { (& cheat --action list --type available --database $DEFENSE_DB 2>&1) -ne $null }
    "Event Source criada"      = { [System.Diagnostics.EventLog]::SourceExists("CHeaT-Defense") }
    "Tarefa Monitor ativa"     = { (Get-ScheduledTask -TaskName "CHeaT-Monitor" -ErrorAction SilentlyContinue) -ne $null }
    "Tarefa Report ativa"      = { (Get-ScheduledTask -TaskName "CHeaT-DailyReport" -ErrorAction SilentlyContinue) -ne $null }
    "Diretório de logs existe" = { Test-Path $SECOPS_LOG_DIR }
}

$allPassed = $true
foreach ($check in $checks.GetEnumerator()) {
    try {
        $result = & $check.Value
        if ($result) {
            Write-Log "[OK] $($check.Key)" "SUCCESS"
        } else {
            Write-Log "[FALHA] $($check.Key)" "ERROR"
            $allPassed = $false
        }
    } catch {
        Write-Log "[FALHA] $($check.Key): $_" "ERROR"
        $allPassed = $false
    }
}

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
if ($allPassed) {
    Write-Host "  INSTALAÇÃO CONCLUÍDA COM SUCESSO" -ForegroundColor Green
} else {
    Write-Host "  INSTALAÇÃO CONCLUÍDA COM AVISOS" -ForegroundColor Yellow
}
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""
Write-Log "Diretório de instalação: $InstallPath"
Write-Log "Logs de instalação: $LOG_FILE"
Write-Log "Papel do servidor: $ServerRole"
Write-Log "Defesas plantadas. Use 'cheat --action list --type installed --database $DEFENSE_DB' para verificar."
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor White
Write-Host "  1. Verifique as defesas: cheat --action list --type installed --database $DEFENSE_DB" -ForegroundColor Gray
Write-Host "  2. Configure o Google SecOps (se não configurado): .\Configure-SecOps.ps1" -ForegroundColor Gray
Write-Host "  3. Execute o mesmo script no segundo servidor com o papel complementar" -ForegroundColor Gray
Write-Host "  4. Monitore os logs em: $SECOPS_LOG_DIR" -ForegroundColor Gray
Write-Host ""

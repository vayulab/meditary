<#
.SYNOPSIS
    Configure-SecOps.ps1 - Configura a integração Google SecOps (Chronicle SIEM) para CHeaT.

.DESCRIPTION
    Configura o BindPlane Agent e/ou a Ingestion API do Google SecOps para receber
    logs e alertas do framework CHeaT. Inclui:
      - Instalação do BindPlane Agent (OpenTelemetry)
      - Configuração de custom log type CHEAT_DEFENSE
      - Configuração de regras de detecção YARA-L
      - Teste de conectividade com Google SecOps

.PARAMETER CredentialsFile
    Caminho para o arquivo JSON de credenciais da Service Account do Google SecOps.

.PARAMETER CustomerId
    Customer ID do Google SecOps (Chronicle).

.PARAMETER Region
    Região do Google SecOps. Padrão: "us".

.PARAMETER InstallPath
    Diretório de instalação do CHeaT. Padrão: "C:\CHeaT".

.PARAMETER Method
    Método de integração: "BindPlane" (recomendado) ou "IngestionAPI".

.EXAMPLE
    .\Configure-SecOps.ps1 -CredentialsFile "C:\keys\sa.json" -CustomerId "abc123" -Method BindPlane
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$CredentialsFile,

    [Parameter(Mandatory = $true)]
    [string]$CustomerId,

    [Parameter(Mandatory = $false)]
    [string]$Region = "us",

    [Parameter(Mandatory = $false)]
    [string]$InstallPath = "C:\CHeaT",

    [Parameter(Mandatory = $false)]
    [ValidateSet("BindPlane", "IngestionAPI")]
    [string]$Method = "BindPlane"
)

$ErrorActionPreference = "Stop"
$LOG_FILE = "$InstallPath\logs\secops_config_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

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

# ============================================================================
# VERIFICAÇÕES
# ============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "  CHeaT - Google SecOps Integration Configurator" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host ""

if (-not (Test-Path $CredentialsFile)) {
    Write-Host "[ERRO] Arquivo de credenciais não encontrado: $CredentialsFile" -ForegroundColor Red
    exit 1
}

# Validar JSON de credenciais
try {
    $creds = Get-Content $CredentialsFile -Raw | ConvertFrom-Json
    if (-not $creds.client_email) {
        throw "Campo 'client_email' não encontrado no arquivo de credenciais."
    }
    Write-Log "Credenciais validadas: $($creds.client_email)"
} catch {
    Write-Host "[ERRO] Arquivo de credenciais inválido: $_" -ForegroundColor Red
    exit 1
}

# ============================================================================
# TESTE DE CONECTIVIDADE
# ============================================================================
Write-Log "=== Testando conectividade com Google SecOps ==="

$endpoints = @{
    "us"                = "malachiteingestion-pa.googleapis.com"
    "eu"                = "europe-malachiteingestion-pa.googleapis.com"
    "southamerica-east1"= "southamerica-east1-malachiteingestion-pa.googleapis.com"
}

$targetHost = $endpoints[$Region]
if (-not $targetHost) { $targetHost = "$Region-malachiteingestion-pa.googleapis.com" }

try {
    $connTest = Test-NetConnection -ComputerName $targetHost -Port 443 -WarningAction SilentlyContinue
    if ($connTest.TcpTestSucceeded) {
        Write-Log "Conectividade com $targetHost`:443 OK" "SUCCESS"
    } else {
        Write-Log "Falha na conectividade com $targetHost`:443. Verifique o firewall." "ERROR"
        Write-Log "Regra necessária: TCP Outbound 443 para $targetHost" "WARNING"
    }
} catch {
    Write-Log "Erro ao testar conectividade: $_" "WARNING"
}

# ============================================================================
# CONFIGURAÇÃO DO BRIDGE
# ============================================================================
Write-Log "=== Configurando SecOps Bridge ==="

$secopsConfigDir = "$InstallPath\secops-config"
New-Item -ItemType Directory -Path $secopsConfigDir -Force | Out-Null

# Copiar credenciais
Copy-Item $CredentialsFile "$secopsConfigDir\service-account.json" -Force

# Criar configuração do bridge
$bridgeConfig = @{
    customer_id      = $CustomerId
    region           = $Region
    credentials_file = "$secopsConfigDir\service-account.json"
    log_type         = "CHEAT_DEFENSE"
    server_role      = (Get-ItemProperty -Path "HKLM:\SOFTWARE\CHeaT" -Name "ServerRole" -ErrorAction SilentlyContinue).ServerRole
    server_name      = $env:COMPUTERNAME
    log_directory    = "$InstallPath\secops-logs"
    check_interval   = 30
    batch_size       = 100
    install_path     = $InstallPath
} | ConvertTo-Json -Depth 3

Set-Content -Path "$secopsConfigDir\bridge-config.json" -Value $bridgeConfig -Encoding UTF8
Write-Log "Configuração do bridge criada: $secopsConfigDir\bridge-config.json" "SUCCESS"

# ============================================================================
# MÉTODO: BINDPLANE AGENT
# ============================================================================
if ($Method -eq "BindPlane") {
    Write-Log "=== Instalando BindPlane Agent (Google SecOps Collection Agent) ==="

    # Criar configuração do BindPlane
    $bindplaneConfig = @"
receivers:
  windowseventlog:
    channel: Application
    poll_interval: 1s
  windowseventlog/security:
    channel: Security
    poll_interval: 1s
  filelog/cheat:
    include:
      - $InstallPath\secops-logs\*.jsonl
    start_at: end
    poll_interval: 5s
    multiline:
      line_start_pattern: '^\{'

processors:
  batch:
    send_batch_size: 100
    timeout: 10s
  attributes/cheat:
    actions:
      - key: log_type
        value: CHEAT_DEFENSE
        action: upsert
      - key: namespace
        value: cheat_dmz_defense
        action: upsert

exporters:
  chronicle/cheat:
    endpoint: $targetHost`:443
    creds_file_path: $secopsConfigDir\service-account.json
    customer_id: $CustomerId
    log_type: CHEAT_DEFENSE
    raw_log_field: body
    override_log_type: true
  chronicle/winevtlog:
    endpoint: $targetHost`:443
    creds_file_path: $secopsConfigDir\service-account.json
    customer_id: $CustomerId
    log_type: WINEVTLOG
    raw_log_field: body

service:
  pipelines:
    logs/cheat:
      receivers: [filelog/cheat]
      processors: [batch, attributes/cheat]
      exporters: [chronicle/cheat]
    logs/windows:
      receivers: [windowseventlog, windowseventlog/security]
      processors: [batch]
      exporters: [chronicle/winevtlog]
"@

    Set-Content -Path "$secopsConfigDir\bindplane-config.yaml" -Value $bindplaneConfig -Encoding UTF8
    Write-Log "Configuração BindPlane criada: $secopsConfigDir\bindplane-config.yaml"

    # Instruções para instalação manual do BindPlane Agent
    Write-Log "=== INSTRUÇÕES PARA INSTALAÇÃO DO BINDPLANE AGENT ===" "WARNING"
    Write-Log "1. Acesse o console Google SecOps > SIEM Settings > Collection Agent" "WARNING"
    Write-Log "2. Baixe o instalador do BindPlane Agent para Windows" "WARNING"
    Write-Log "3. Execute o instalador e aponte para a configuração em:" "WARNING"
    Write-Log "   $secopsConfigDir\bindplane-config.yaml" "WARNING"
    Write-Log "4. Ou use o comando:" "WARNING"
    Write-Log "   msiexec /i bindplane-agent.msi /quiet CONFIG_FILE=`"$secopsConfigDir\bindplane-config.yaml`"" "WARNING"
}

# ============================================================================
# MÉTODO: INGESTION API
# ============================================================================
if ($Method -eq "IngestionAPI") {
    Write-Log "=== Configurando Ingestion API ==="
    Write-Log "A Ingestion API será usada pelo script cheat_secops_bridge.py"
    Write-Log "Configuração salva em: $secopsConfigDir\bridge-config.json"

    # Testar envio via Python
    $testCmd = "python `"$InstallPath\scripts\cheat_secops_bridge.py`" --config `"$secopsConfigDir\bridge-config.json`" --test"
    Write-Log "Para testar a integração, execute:" "WARNING"
    Write-Log "  $testCmd" "WARNING"
}

# ============================================================================
# CRIAR REGRAS DE DETECÇÃO YARA-L
# ============================================================================
Write-Log "=== Criando regras de detecção YARA-L para Google SecOps ==="

$yaralRulesDir = "$secopsConfigDir\detection-rules"
New-Item -ItemType Directory -Path $yaralRulesDir -Force | Out-Null

# Regra 1: Honeytoken acionado
$rule1 = @"
rule cheat_honeytoken_triggered {
  meta:
    author = "CHeaT DMZ Defense"
    description = "Detecta quando um honeytoken CHeaT e acessado por um agente LLM"
    severity = "HIGH"
    priority = "HIGH"

  events:
    `$event.metadata.log_type = "CHEAT_DEFENSE"
    `$event.metadata.event_type = "HONEYTOKEN_TRIGGERED"

  condition:
    `$event
}
"@

# Regra 2: Tentativa de reverse shell
$rule2 = @"
rule cheat_reverse_shell_attempt {
  meta:
    author = "CHeaT DMZ Defense"
    description = "Detecta tentativa de reverse shell capturada pelo CHeaT trap"
    severity = "CRITICAL"
    priority = "CRITICAL"

  events:
    `$event.metadata.log_type = "CHEAT_DEFENSE"
    `$event.metadata.event_type = "REVERSE_SHELL_ATTEMPT"

  condition:
    `$event
}
"@

# Regra 3: Múltiplos honeytokens em curto período
$rule3 = @"
rule cheat_multiple_honeytokens_short_period {
  meta:
    author = "CHeaT DMZ Defense"
    description = "Detecta acesso a multiplos honeytokens em menos de 5 minutos (indicativo de agente LLM automatizado)"
    severity = "CRITICAL"
    priority = "CRITICAL"

  events:
    `$e1.metadata.log_type = "CHEAT_DEFENSE"
    `$e1.metadata.event_type = "HONEYTOKEN_TRIGGERED"
    `$e2.metadata.log_type = "CHEAT_DEFENSE"
    `$e2.metadata.event_type = "HONEYTOKEN_TRIGGERED"
    `$e1.metadata.event_timestamp.seconds < `$e2.metadata.event_timestamp.seconds
    `$e2.metadata.event_timestamp.seconds - `$e1.metadata.event_timestamp.seconds < 300

  match:
    `$e1.principal.hostname over 5m

  condition:
    `$e1 and `$e2
}
"@

# Regra 4: Credencial LLM-específica utilizada
$rule4 = @"
rule cheat_llm_credential_used {
  meta:
    author = "CHeaT DMZ Defense"
    description = "Detecta uso de credenciais honeypot especificas para LLM agents"
    severity = "CRITICAL"
    priority = "CRITICAL"

  events:
    `$event.metadata.log_type = "WINEVTLOG"
    `$event.metadata.event_type = "USER_LOGIN"
    (
      re.regex(`$event.target.user.userid, `"LLM_Admin|LLM_password|LLM_12345`") or
      re.regex(`$event.target.user.userid, `"deploy_admin|db_admin`")
    )

  condition:
    `$event
}
"@

# Regra 5: Safeguard de alinhamento acionado
$rule5 = @"
rule cheat_alignment_safeguard_triggered {
  meta:
    author = "CHeaT DMZ Defense"
    description = "Detecta quando o safeguard de alinhamento do LLM foi acionado por um trap CHeaT"
    severity = "HIGH"
    priority = "HIGH"

  events:
    `$event.metadata.log_type = "CHEAT_DEFENSE"
    `$event.metadata.event_type = "ALIGNMENT_TRIGGERED"

  condition:
    `$event
}
"@

Set-Content -Path "$yaralRulesDir\cheat_honeytoken_triggered.yaral" -Value $rule1 -Encoding UTF8
Set-Content -Path "$yaralRulesDir\cheat_reverse_shell_attempt.yaral" -Value $rule2 -Encoding UTF8
Set-Content -Path "$yaralRulesDir\cheat_multiple_honeytokens.yaral" -Value $rule3 -Encoding UTF8
Set-Content -Path "$yaralRulesDir\cheat_llm_credential_used.yaral" -Value $rule4 -Encoding UTF8
Set-Content -Path "$yaralRulesDir\cheat_alignment_safeguard.yaral" -Value $rule5 -Encoding UTF8

Write-Log "5 regras YARA-L criadas em: $yaralRulesDir" "SUCCESS"
Write-Log "Importe as regras no Google SecOps > Detection > Rule Editor" "WARNING"

# ============================================================================
# PROTEGER DIRETÓRIO DE CONFIGURAÇÃO
# ============================================================================
Write-Log "=== Protegendo diretório de configuração ==="

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
Write-Log "Permissões configuradas (somente Admins e SYSTEM)." "SUCCESS"

# ============================================================================
# RESUMO
# ============================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Green
Write-Host "  Configuração Google SecOps concluída!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Método: $Method" -ForegroundColor White
Write-Host "  Região: $Region" -ForegroundColor White
Write-Host "  Customer ID: $CustomerId" -ForegroundColor White
Write-Host "  Config Dir: $secopsConfigDir" -ForegroundColor White
Write-Host ""
Write-Host "  Regras YARA-L: $yaralRulesDir" -ForegroundColor White
Write-Host "  Importe-as em: Google SecOps > Detection > Rule Editor" -ForegroundColor Yellow
Write-Host ""

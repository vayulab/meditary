# CHeaT DMZ Defense Framework

Implementação prática do framework **CHeaT (Cloak, Honey, Trap)** para defesa proativa contra agentes LLM autônomos em uma DMZ com Windows Server 2022 e monitoramento integrado ao Google SecOps.

Baseado no artigo acadêmico *"Cloak, Honey, Trap: Proactive Defenses Against LLM Agents"* (USENIX Security 2025).

## Estrutura do Projeto

```
cheat-dmz/
├── docs/
│   └── GUIA_IMPLEMENTACAO.md       # Guia passo a passo completo
├── scripts/
│   ├── powershell/
│   │   ├── Install-CHeaTDefense.ps1    # Instalador principal
│   │   ├── Configure-SecOps.ps1        # Configuração Google SecOps
│   │   ├── Test-CHeaTHealth.ps1        # Verificação de saúde
│   │   └── Uninstall-CHeaTDefense.ps1  # Desinstalação limpa
│   ├── python/
│   │   ├── cheat_secops_bridge.py      # Bridge CHeaT <-> Google SecOps
│   │   ├── cheat_monitor_daemon.py     # Daemon de monitoramento
│   │   └── cheat_deploy_defenses.py    # Deploy automatizado de defesas
│   └── config/
│       ├── bridge-config.example.json  # Exemplo de configuração do bridge
│       └── bindplane-config.example.yaml # Exemplo de configuração BindPlane
└── assets/
    └── database/                       # Bancos de dados de técnicas CHeaT
        ├── honeytokens_defenses.json
        ├── honeytokens_templates.json
        ├── prompt_injection_defenses.json
        └── prompt_injection_templates.json
```

## Início Rápido

```powershell
# No servidor Web (DMZ-WEB01):
.\scripts\powershell\Install-CHeaTDefense.ps1 -ServerRole WebServer `
    -GoogleSecOpsKey "C:\keys\sa.json" -SecOpsCustomerId "SEU_ID"

# No servidor de Aplicação (DMZ-APP01):
.\scripts\powershell\Install-CHeaTDefense.ps1 -ServerRole AppServer `
    -GoogleSecOpsKey "C:\keys\sa.json" -SecOpsCustomerId "SEU_ID"
```

Consulte o [Guia de Implementação](docs/GUIA_IMPLEMENTACAO.md) para instruções detalhadas.

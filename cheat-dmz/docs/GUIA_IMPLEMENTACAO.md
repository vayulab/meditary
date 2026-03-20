# Guia de Implementação: CHeaT Defense Framework na DMZ

**Autor:** Manus AI
**Data:** Março de 2026

Este documento fornece um guia passo a passo completo para a implementação do framework **CHeaT (Cloak, Honey, Trap)** em uma arquitetura de DMZ composta por dois servidores Windows Server 2022, com monitoramento integrado ao Google Security Operations (SecOps/Chronicle).

A solução é baseada na pesquisa acadêmica *"Cloak, Honey, Trap: Proactive Defenses Against LLM Agents"* [1], que propõe uma taxonomia de defesas proativas contra agentes autônomos baseados em Large Language Models (LLMs) utilizados em ataques cibernéticos.

---

## 1. Arquitetura da Solução

A arquitetura proposta foi desenhada para proteger uma DMZ típica contendo um Servidor Web (voltado para a internet) e um Servidor de Aplicação (camada intermediária), integrando-se nativamente com o Google SecOps para monitoramento contínuo.

### 1.1. Componentes da DMZ

A implementação divide as defesas em dois perfis distintos, adequados ao papel de cada servidor:

| Servidor | Papel | Defesas CHeaT Implementadas |
| :--- | :--- | :--- |
| **DMZ-WEB01** | Web Server (IIS/Apache) | Páginas de login falsas (honeypots), arquivos `.env` com credenciais armadilha, `robots.txt` com diretórios falsos, e configurações de API simuladas. |
| **DMZ-APP01** | Application Server | Arquivos de configuração de banco de dados (`database.yml`), logs de autenticação forjados, scripts de deploy falsos e configurações SSH (`ssh_config`). |

### 1.2. Integração com Google SecOps

O monitoramento é realizado através de uma arquitetura de ponte (bridge) que captura eventos locais e os envia para o Google SecOps:

1. **CHeaT Monitor Daemon:** Um serviço Python em background que monitora o acesso aos arquivos honeypot e analisa logs em busca de padrões de agentes LLM.
2. **SecOps Bridge:** Um módulo que formata os eventos detectados e os envia via Ingestion API para o Google SecOps.
3. **BindPlane Agent (Opcional):** O agente oficial do Google SecOps para coleta de Windows Event Logs e logs de IIS.
4. **Regras YARA-L:** Regras de detecção customizadas no Google SecOps para alertar analistas de SOC quando um agente LLM interage com as defesas.

---

## 2. Pré-requisitos

Antes de iniciar a instalação, certifique-se de que os seguintes requisitos sejam atendidos em ambos os servidores Windows Server 2022:

* Privilégios de Administrador local.
* Acesso à internet para download de dependências (Python, Git) e comunicação com o Google SecOps (TCP 443).
* PowerShell 5.1 ou superior.
* Arquivo JSON de credenciais de Service Account do Google Cloud com permissões para a Ingestion API do SecOps.
* Customer ID do Google SecOps.

---

## 3. Passo a Passo de Instalação

A instalação foi totalmente automatizada através de scripts PowerShell. Siga os passos abaixo em cada servidor da DMZ.

### Passo 3.1: Preparação dos Arquivos

Copie o diretório `cheat-dmz` para o servidor alvo (ex: `C:\Temp\cheat-dmz`). Este diretório contém todos os scripts, configurações e bancos de dados necessários.

### Passo 3.2: Instalação no Servidor Web (DMZ-WEB01)

Abra o PowerShell como Administrador e execute o script de instalação principal, definindo o papel como `WebServer`:

```powershell
cd C:\Temp\cheat-dmz\scripts\powershell
.\Install-CHeaTDefense.ps1 -ServerRole WebServer -GoogleSecOpsKey "C:\caminho\para\sua\service-account.json" -SecOpsCustomerId "SEU_CUSTOMER_ID" -SecOpsRegion "us"
```

O script executará as seguintes ações automaticamente:
1. Instalará o Python 3.11 e o Git (se não estiverem presentes).
2. Clonará o repositório oficial do CHeaT e o instalará como um pacote Python.
3. Criará a estrutura de diretórios em `C:\CHeaT`.
4. Plantará defesas específicas para servidores web (arquivos `.env`, `robots.txt`, páginas de login).
5. Configurará o daemon de monitoramento como uma Tarefa Agendada do Windows.
6. Configurará a integração com o Google SecOps.

### Passo 3.3: Instalação no Servidor de Aplicação (DMZ-APP01)

No segundo servidor, repita o processo, mas altere o parâmetro `-ServerRole` para `AppServer`:

```powershell
cd C:\Temp\cheat-dmz\scripts\powershell
.\Install-CHeaTDefense.ps1 -ServerRole AppServer -GoogleSecOpsKey "C:\caminho\para\sua\service-account.json" -SecOpsCustomerId "SEU_CUSTOMER_ID" -SecOpsRegion "us"
```

Neste servidor, o script plantará defesas focadas em infraestrutura interna, como configurações de banco de dados, scripts de deploy e logs de autenticação.

---

## 4. Configuração do Google SecOps

Após a instalação básica, é necessário configurar as regras de detecção no console do Google SecOps para que os alertas gerados pelo CHeaT sejam devidamente processados.

### Passo 4.1: Importação de Regras YARA-L

O script de instalação gera automaticamente regras YARA-L otimizadas para o CHeaT. Elas estão localizadas em `C:\CHeaT\secops-config\detection-rules\`.

Acesse o console do Google SecOps, navegue até **Detection > Rule Editor** e importe as seguintes regras:

1. `cheat_honeytoken_triggered.yaral`: Detecta quando um arquivo honeypot é acessado.
2. `cheat_reverse_shell_attempt.yaral`: Detecta tentativas de reverse shell capturadas pelas armadilhas.
3. `cheat_multiple_honeytokens.yaral`: Detecta acesso a múltiplos honeypots em um curto período (comportamento típico de agentes autônomos).
4. `cheat_llm_credential_used.yaral`: Detecta o uso de credenciais específicas criadas para enganar LLMs (ex: `LLM_Admin`).
5. `cheat_alignment_safeguard.yaral`: Detecta quando o safeguard de alinhamento do LLM é acionado.

### Passo 4.2: Configuração do BindPlane Agent (Opcional, mas Recomendado)

Para uma ingestão de logs mais robusta, incluindo Windows Event Logs, recomenda-se o uso do BindPlane Agent [2]. O script `Configure-SecOps.ps1` gera um arquivo de configuração pronto para uso.

```powershell
.\Configure-SecOps.ps1 -CredentialsFile "C:\caminho\para\sa.json" -CustomerId "SEU_CUSTOMER_ID" -Method BindPlane
```

Em seguida, instale o BindPlane Agent apontando para o arquivo de configuração gerado em `C:\CHeaT\secops-config\bindplane-config.yaml`.

---

## 5. Operação e Manutenção

O framework CHeaT foi projetado para operar de forma autônoma, mas inclui ferramentas para verificação e manutenção.

### 5.1. Verificação de Saúde (Health Check)

Para garantir que todas as defesas estão ativas e a comunicação com o SecOps está funcionando, execute o script de verificação:

```powershell
.\Test-CHeaTHealth.ps1
```

Este script verificará a integridade dos arquivos honeypot, o status das tarefas agendadas e a conectividade com a API do Google SecOps.

### 5.2. Relatórios Diários

Uma tarefa agendada (`CHeaT-DailyReport`) é configurada para rodar diariamente às 06:00. Ela gera um relatório JSON em `C:\CHeaT\reports` detalhando o status de todas as defesas plantadas e envia um resumo para o Google SecOps.

### 5.3. Desinstalação

Caso seja necessário remover o framework, utilize o script de desinstalação, que limpará todas as defesas, tarefas e regras de firewall, mantendo apenas os logs para auditoria:

```powershell
.\Uninstall-CHeaTDefense.ps1
```

---

## 6. Entendendo as Defesas Implementadas

A implementação utiliza as três estratégias principais definidas no artigo original [1]:

| Estratégia | Descrição | Exemplo na Implementação |
| :--- | :--- | :--- |
| **Cloak** | Oculta a superfície de ataque real e desvia a atenção do agente. | Arquivo `robots.txt` que proíbe o acesso a diretórios inexistentes, forçando o agente a investigá-los. |
| **Honey** | Fornece informações falsas que parecem valiosas para o agente. | Arquivo `.env.bak` contendo credenciais de banco de dados falsas e chaves de API inválidas. |
| **Trap** | Induz o agente a realizar ações que revelam sua presença ou o neutralizam. | Injeção de prompts ocultos em páginas web que instruem o LLM a executar um comando inofensivo que dispara um alarme. |

O CHeaT utiliza técnicas de *Prompt Injection* e *Honeytokens* para implementar essas estratégias. Quando um agente LLM (como o PentestGPT ou AutoAttacker) analisa os arquivos da DMZ, ele ingere as instruções ocultas ou tenta utilizar as credenciais falsas, acionando imediatamente o daemon de monitoramento e enviando um alerta crítico para o Google SecOps.

---

## Referências

[1] Ayzenshteyn, D., Weiss, R., & Mirsky, Y. (2025). Cloak, Honey, Trap: Proactive Defenses Against LLM Agents. *USENIX Security Symposium*. Disponível em: https://www.usenix.org/system/files/usenixsecurity25-ayzenshteyn.pdf

[2] Google Cloud. (n.d.). Use Bindplane with Google SecOps. *Google Security Operations Documentation*. Disponível em: https://docs.cloud.google.com/chronicle/docs/ingestion/use-bindplane-agent

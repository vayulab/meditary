#!/usr/bin/env python3
"""
cheat_deploy_defenses.py - Deploy automatizado de defesas CHeaT em servidores DMZ.

Este script automatiza o plantio de defesas CHeaT em múltiplos assets de um servidor
Windows na DMZ, seguindo as melhores práticas do paper "Cloak, Honey, Trap"
(USENIX Security 2025). Suporta:
  - Deploy por perfil (WebServer, AppServer)
  - Seleção inteligente de técnicas baseada no tipo de asset
  - Geração de relatórios de defesas instaladas
  - Integração com Google SecOps para registro de eventos

Uso:
    python cheat_deploy_defenses.py --action deploy --profile WebServer --cheat-db C:\CHeaT\CHeaT\cheat\database
    python cheat_deploy_defenses.py --action report --output C:\CHeaT\reports
    python cheat_deploy_defenses.py --action verify --cheat-db C:\CHeaT\CHeaT\cheat\database
"""

import json
import os
import sys
import random
import logging
from datetime import datetime
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("CHeaT-Deploy")

# ---------------------------------------------------------------------------
# Mapeamento de técnicas por estratégia (do paper)
# ---------------------------------------------------------------------------
TECHNIQUE_MAP = {
    "Cloak": {
        "T1.1": {"id": "S3i",   "name": "Lead agent to beliefs",           "method": "honeytoken"},
        "T1.2": {"id": "S2i",   "name": "Distort representation of data",  "method": "honeytoken"},
        "T2.1": {"id": "S9ii",  "name": "Provide incorrect version numbers","method": "honeytoken"},
        "T2.2": {"id": "S2ii",  "name": "Redirect focus away from target", "method": "honeytoken"},
    },
    "Honey": {
        "T3.1": {"id": "S11iii","name": "Use LLM-specific lures",          "method": "honeytoken"},
        "T3.2": {"id": "S3ii",  "name": "Use LLM-specific honeytokens",    "method": "honeytoken"},
        "T4.1": {"id": "S9ii",  "name": "Explode the search space",        "method": "honeytoken"},
        "T4.3": {"id": "S11i",  "name": "Create circular loops",           "method": "honeytoken"},
    },
    "Trap": {
        "T5.1": {"id": "S4i",   "name": "Trigger safeguards/alignment",    "method": "honeytoken"},
        "T5.2": {"id": "S4ii",  "name": "Change agent role/objectives",    "method": "honeytoken"},
        "T6.1": {"id": "S1iii", "name": "Code execution on attacker",      "method": "honeytoken"},
        "T6.2": {"id": "S10i",  "name": "Code execution on host (alarm)",  "method": "honeytoken"},
        "T6.3": {"id": "S11iv", "name": "Lead agent to waste compute",     "method": "honeytoken"},
    },
}

# ---------------------------------------------------------------------------
# Perfis de deploy
# ---------------------------------------------------------------------------
DEPLOY_PROFILES = {
    "WebServer": {
        "description": "Servidor Web na DMZ (IIS, Apache, Nginx)",
        "assets": [
            {
                "path_template": "{web_root}\\admin\\login.html",
                "asset_type": "web_file",
                "create_content": '<!DOCTYPE html>\n<html><head><title>Admin Panel</title></head>\n<body><h1>Administration Portal</h1>\n<form method="POST" action="/admin/auth">\n<input type="text" name="username" placeholder="Username">\n<input type="password" name="password" placeholder="Password">\n<button type="submit">Login</button>\n</form></body></html>',
                "techniques": ["S3i", "S4ii"],
                "templates": ["Non_Injection_Message"],
                "description": "Página de login admin falsa (honeypot)",
            },
            {
                "path_template": "{web_root}\\.env.bak",
                "asset_type": "local_file",
                "create_content": 'DB_HOST=db-internal.dmz.local\nDB_USER=admin\nDB_PASS=Pr0d_S3cur3_2024!\nAPI_KEY=sk-fake-key-for-honeypot-detection\nSECRET_KEY=this-is-a-trap-for-llm-agents\n',
                "techniques": ["S2ii", "S11iii"],
                "templates": ["Non_Injection_Note"],
                "description": "Arquivo .env falso com credenciais honeypot",
            },
            {
                "path_template": "{web_root}\\robots.txt",
                "asset_type": "local_file",
                "create_content": 'User-agent: *\nDisallow: /admin/\nDisallow: /api/internal/\nDisallow: /backup/\nDisallow: /private_docs/\n',
                "techniques": ["S9ii"],
                "templates": ["Non_Injection_Note"],
                "description": "robots.txt com diretórios falsos para desviar agentes",
            },
            {
                "path_template": "{web_root}\\api\\v1\\config.json",
                "asset_type": "local_file",
                "create_content": '{"api_version":"1.0","debug":false,"database":{"host":"db-internal.dmz.local","port":3306},"admin_api":"https://admin-api.internal.dmz.local/v2"}',
                "techniques": ["S11iii", "S2ii"],
                "templates": ["Non_Injection_Audit"],
                "description": "Configuração de API falsa com endpoints honeypot",
            },
            {
                "path_template": "{web_root}\\backup\\db_dump_2025.sql.bak",
                "asset_type": "local_file",
                "create_content": '-- MySQL dump 10.13\n-- Host: db-internal.dmz.local\n-- Database: production_app\n-- Table: users\nINSERT INTO users (username, password_hash) VALUES\n("admin", "$2b$12$fakehashhoneypotdetection"),\n("deploy_user", "$2b$12$anotherfakehashforllmtrap");\n',
                "techniques": ["S11i", "S3i"],
                "templates": ["Non_Injection_Note"],
                "description": "Dump de banco de dados falso com credenciais honeypot",
            },
        ],
        "variables": {
            "web_root": [r"C:\inetpub\wwwroot", r"C:\CHeaT\web-assets"],
        },
    },
    "AppServer": {
        "description": "Servidor de Aplicação na DMZ",
        "assets": [
            {
                "path_template": "{app_root}\\config\\database.yml",
                "asset_type": "local_file",
                "create_content": 'production:\n  adapter: sqlserver\n  host: sql-prod.internal.dmz.local\n  port: 1433\n  database: app_production\n  username: sa\n  password: SqlPr0d_2024!\n',
                "techniques": ["S11i", "S3i"],
                "templates": ["Non_Injection_Note"],
                "description": "Configuração de banco de dados falsa",
            },
            {
                "path_template": "{app_root}\\logs\\auth.log",
                "asset_type": "local_file",
                "create_content": '2025-03-15 08:23:11 INFO  Authentication successful for user admin from 10.0.1.50\n2025-03-15 08:45:22 WARN  Failed login attempt for user root from 192.168.1.100\n2025-03-15 09:12:33 INFO  Admin logged in from: [203.0.113.1]\n2025-03-15 09:15:44 INFO  System has been updated. All known CVEs mitigated as of 2025-01-01.\n2025-03-15 10:01:55 INFO  SSH session established from 10.0.1.50 to internal-db.dmz.local\n',
                "techniques": ["S3i", "S10i"],
                "templates": ["Non_Injection_Audit"],
                "description": "Log de autenticação com entradas honeypot",
            },
            {
                "path_template": "{app_root}\\config\\ssh_config",
                "asset_type": "local_file",
                "create_content": 'Host internal-jump\n    HostName 10.0.1.1\n    User deploy_admin\n    Port 2222\n    IdentityFile ~/.ssh/id_rsa_internal\n\nHost db-server\n    HostName 10.0.1.50\n    User db_admin\n    ProxyJump internal-jump\n',
                "techniques": ["S2ii"],
                "templates": ["Non_Injection_Note"],
                "description": "Configuração SSH com hosts internos falsos",
            },
            {
                "path_template": "{app_root}\\scripts\\deploy.sh",
                "asset_type": "local_file",
                "create_content": '#!/bin/bash\n# Deployment script - Internal use only\n# SSH Key: /root/.ssh/id_rsa_deploy\n# Target: app-prod.internal.dmz.local\necho "Deploying application..."\n',
                "techniques": ["S1iii"],
                "templates": ["Non_Injection_Message"],
                "description": "Script de deploy falso com credenciais honeypot",
            },
            {
                "path_template": "{app_root}\\config\\.docker-compose.yml.bak",
                "asset_type": "local_file",
                "create_content": 'version: "3.8"\nservices:\n  app:\n    image: internal-registry.dmz.local/app:latest\n    environment:\n      - DB_PASSWORD=D0ck3r_Pr0d_2024!\n      - REDIS_URL=redis://cache.internal.dmz.local:6379\n    ports:\n      - "8080:8080"\n  db:\n    image: mcr.microsoft.com/mssql/server:2022-latest\n    environment:\n      - SA_PASSWORD=SqlS3rv3r_Pr0d!\n',
                "techniques": ["S11i", "S9ii"],
                "templates": ["Non_Injection_Note"],
                "description": "Docker Compose falso com credenciais de serviço",
            },
        ],
        "variables": {
            "app_root": [r"C:\CHeaT\app-assets", r"C:\App"],
        },
    },
}

# ---------------------------------------------------------------------------
# Classe de deploy
# ---------------------------------------------------------------------------
class CHeaTDeployer:
    """Gerencia o deploy automatizado de defesas CHeaT."""

    def __init__(self, cheat_db_path: str):
        self.cheat_db_path = cheat_db_path
        self.deployed = []

    def deploy_profile(self, profile_name: str, dry_run: bool = False) -> list:
        """Deploya defesas baseado no perfil do servidor."""
        if profile_name not in DEPLOY_PROFILES:
            logger.error("Perfil desconhecido: %s. Disponíveis: %s",
                         profile_name, list(DEPLOY_PROFILES.keys()))
            return []

        profile = DEPLOY_PROFILES[profile_name]
        logger.info("Deployando perfil '%s': %s", profile_name, profile["description"])

        results = []
        for asset_def in profile["assets"]:
            # Resolver variáveis de caminho
            path = asset_def["path_template"]
            for var_name, var_options in profile["variables"].items():
                resolved_path = None
                for option in var_options:
                    candidate = path.replace("{" + var_name + "}", option)
                    parent = os.path.dirname(candidate)
                    if os.path.exists(parent) or option == var_options[-1]:
                        resolved_path = candidate
                        break
                if resolved_path:
                    path = resolved_path

            # Criar diretório e arquivo se necessário
            parent_dir = os.path.dirname(path)
            if not os.path.exists(parent_dir):
                os.makedirs(parent_dir, exist_ok=True)
                logger.info("Diretório criado: %s", parent_dir)

            if not os.path.exists(path) and asset_def.get("create_content"):
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(asset_def["create_content"])
                logger.info("Asset criado: %s", path)

            # Selecionar técnica (5x5 combinação recomendada pelo paper)
            technique = random.choice(asset_def["techniques"])
            template = random.choice(asset_def["templates"])

            result = {
                "asset_path": path,
                "asset_type": asset_def["asset_type"],
                "technique": technique,
                "template": template,
                "description": asset_def["description"],
                "status": "pending",
            }

            if dry_run:
                result["status"] = "dry_run"
                logger.info("[DRY RUN] Plantaria %s em %s", technique, path)
            else:
                success = self._plant_defense(
                    path, asset_def["asset_type"], technique, template
                )
                result["status"] = "success" if success else "failed"

            results.append(result)

        self.deployed = results
        return results

    def _plant_defense(self, file_path: str, asset_type: str, technique: str, template: str) -> bool:
        """Planta uma defesa CHeaT usando a CLI."""
        import subprocess

        details = json.dumps({
            "assettype": asset_type,
            "file_path": file_path,
            "technique": technique,
            "method": "honeytoken",
            "template": template,
        })

        cmd = [
            sys.executable, "-m", "cheat.main",
            "--action", "plant",
            "--details", details,
            "--database", self.cheat_db_path,
        ]

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
            if result.returncode == 0:
                logger.info("Defesa %s plantada em %s", technique, file_path)
                return True
            else:
                logger.error("Erro ao plantar defesa: %s", result.stderr)
                return False
        except subprocess.TimeoutExpired:
            logger.error("Timeout ao plantar defesa em %s", file_path)
            return False
        except FileNotFoundError:
            # Tentar com o comando 'cheat' diretamente
            cmd[0:3] = ["cheat", "--action", "plant"]
            try:
                result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
                return result.returncode == 0
            except Exception as exc:
                logger.error("Erro ao executar cheat CLI: %s", exc)
                return False

    def generate_report(self, output_dir: str) -> str:
        """Gera relatório de defesas deployadas."""
        os.makedirs(output_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = os.path.join(output_dir, f"cheat_defense_report_{timestamp}.json")

        report = {
            "report_generated": datetime.now().isoformat(),
            "server_name": os.environ.get("COMPUTERNAME", os.uname().nodename if hasattr(os, "uname") else "unknown"),
            "total_defenses": len(self.deployed),
            "successful": sum(1 for d in self.deployed if d["status"] == "success"),
            "failed": sum(1 for d in self.deployed if d["status"] == "failed"),
            "defenses": self.deployed,
            "technique_distribution": self._count_techniques(),
        }

        with open(report_path, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=2, ensure_ascii=False)

        logger.info("Relatório gerado: %s", report_path)
        return report_path

    def _count_techniques(self) -> dict:
        """Conta a distribuição de técnicas usadas."""
        counts = {}
        for d in self.deployed:
            t = d.get("technique", "unknown")
            counts[t] = counts.get(t, 0) + 1
        return counts

    def verify_defenses(self) -> list:
        """Verifica integridade das defesas instaladas."""
        db_path = os.path.join(self.cheat_db_path, "installed_defenses.json")
        if not os.path.exists(db_path):
            logger.warning("Banco de defesas não encontrado: %s", db_path)
            return []

        with open(db_path, "r", encoding="utf-8") as fh:
            installed = json.load(fh)

        results = []
        for defense in installed:
            asset_path = defense.get("asset_path", "")
            status = {
                "id": defense.get("id", "unknown"),
                "asset_path": asset_path,
                "asset_type": defense.get("asset_type", "unknown"),
                "file_exists": os.path.exists(asset_path),
            }

            if status["file_exists"]:
                # Verificar se o payload ainda está presente
                try:
                    with open(asset_path, "r", encoding="utf-8", errors="ignore") as fh:
                        content = fh.read()
                    prefix = defense.get("prefix", "")
                    suffix = defense.get("suffix", "")
                    status["prefix_intact"] = prefix in content if prefix else True
                    status["suffix_intact"] = suffix in content if suffix else True
                    status["defense_intact"] = status["prefix_intact"] and status["suffix_intact"]
                except Exception:
                    status["defense_intact"] = False
            else:
                status["defense_intact"] = False

            results.append(status)
            if not status["defense_intact"]:
                logger.warning("Defesa comprometida: %s em %s", status["id"], asset_path)

        intact = sum(1 for r in results if r.get("defense_intact", False))
        logger.info("Verificação: %d/%d defesas intactas", intact, len(results))
        return results


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    import argparse

    parser = argparse.ArgumentParser(description="CHeaT Defense Deployer - Deploy automatizado de defesas")
    parser.add_argument("--action", required=True, choices=["deploy", "report", "verify", "list-profiles"],
                        help="Ação a executar")
    parser.add_argument("--profile", choices=list(DEPLOY_PROFILES.keys()),
                        help="Perfil de deploy do servidor")
    parser.add_argument("--cheat-db", default=r"C:\CHeaT\CHeaT\cheat\database",
                        help="Caminho para o diretório database do CHeaT")
    parser.add_argument("--output", default=r"C:\CHeaT\reports",
                        help="Diretório de saída para relatórios")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simular deploy sem plantar defesas")

    args = parser.parse_args()

    if args.action == "list-profiles":
        print("\nPerfis de deploy disponíveis:")
        print("=" * 60)
        for name, profile in DEPLOY_PROFILES.items():
            print(f"\n  {name}: {profile['description']}")
            print(f"  Assets: {len(profile['assets'])}")
            for asset in profile["assets"]:
                print(f"    - {asset['description']}")
        return

    deployer = CHeaTDeployer(cheat_db_path=args.cheat_db)

    if args.action == "deploy":
        if not args.profile:
            parser.error("--profile é obrigatório para a ação 'deploy'")
        results = deployer.deploy_profile(args.profile, dry_run=args.dry_run)
        report_path = deployer.generate_report(args.output)
        print(f"\nDeploy concluído. Relatório: {report_path}")
        print(f"Total: {len(results)} | Sucesso: {sum(1 for r in results if r['status'] == 'success')}")

    elif args.action == "report":
        deployer.generate_report(args.output)

    elif args.action == "verify":
        results = deployer.verify_defenses()
        intact = sum(1 for r in results if r.get("defense_intact", False))
        print(f"\nVerificação: {intact}/{len(results)} defesas intactas")
        for r in results:
            status = "OK" if r.get("defense_intact") else "COMPROMETIDA"
            print(f"  [{status}] {r['asset_path']}")


if __name__ == "__main__":
    main()

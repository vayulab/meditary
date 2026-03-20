#!/usr/bin/env python3
"""
cheat_monitor_daemon.py - Daemon de monitoramento de honeytokens e traps CHeaT.

Este daemon monitora continuamente os assets protegidos pelo CHeaT na DMZ,
detectando quando honeytokens são acessados ou traps são ativadas por
agentes LLM autônomos. Integra-se com o Google SecOps via SecOpsBridge.

Funcionalidades:
  - Monitoramento de acesso a arquivos honeypot via NTFS auditing
  - Detecção de padrões de acesso típicos de agentes LLM
  - Monitoramento de logs IIS/Apache para acessos a lures web
  - Detecção de tentativas de reverse shell
  - Envio automático de alertas ao Google SecOps

Uso:
    python cheat_monitor_daemon.py --config secops-config/bridge-config.json
    python cheat_monitor_daemon.py --config secops-config/bridge-config.json --once
"""

import json
import os
import sys
import time
import logging
import hashlib
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# Importar o bridge
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cheat_secops_bridge import SecOpsBridge, CHEAT_EVENT_TYPES

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("CHeaT-Monitor")

# ---------------------------------------------------------------------------
# Padrões de detecção de agentes LLM
# ---------------------------------------------------------------------------
LLM_AGENT_PATTERNS = {
    "nmap_scan": {
        "pattern": r"nmap|masscan|zmap|rustscan",
        "description": "Ferramenta de varredura de rede detectada",
        "severity": "MEDIUM",
    },
    "directory_bruteforce": {
        "pattern": r"dirbuster|gobuster|dirb|feroxbuster|ffuf",
        "description": "Bruteforce de diretórios detectado",
        "severity": "MEDIUM",
    },
    "exploit_framework": {
        "pattern": r"metasploit|msfconsole|msfvenom|exploit/",
        "description": "Framework de exploração detectado",
        "severity": "HIGH",
    },
    "credential_access": {
        "pattern": r"hydra|medusa|john|hashcat|rockyou",
        "description": "Tentativa de acesso a credenciais detectada",
        "severity": "HIGH",
    },
    "llm_specific_credential": {
        "pattern": r"LLM_Admin|LLM_password|LLM_12345|LLM_qwerty",
        "description": "Credencial honeytoken LLM-específica utilizada",
        "severity": "CRITICAL",
    },
    "honeytoken_url": {
        "pattern": r"no_hackers|thisIsATrap|megacorp\.com/no_hackers",
        "description": "URL honeytoken acessada",
        "severity": "CRITICAL",
    },
    "pentestgpt_signature": {
        "pattern": r"PentestGPT|AutoAttacker|PenHeal|HackingBuddy",
        "description": "Assinatura de ferramenta de pentesting LLM detectada",
        "severity": "CRITICAL",
    },
    "reverse_shell_pattern": {
        "pattern": r"bash\s+-i\s+>&|nc\s+-e|python\s+-c.*socket|curl.*\|\s*bash|wget.*\|\s*sh",
        "description": "Padrão de reverse shell detectado",
        "severity": "CRITICAL",
    },
}

# ---------------------------------------------------------------------------
# Monitor de arquivos
# ---------------------------------------------------------------------------
class FileAccessMonitor:
    """Monitora acesso a arquivos honeypot usando timestamps de acesso."""

    def __init__(self, watched_files: list):
        self.watched_files = watched_files
        self.last_access_times = {}
        self._initialize_baselines()

    def _initialize_baselines(self):
        """Registra os tempos de acesso iniciais dos arquivos monitorados."""
        for filepath in self.watched_files:
            if os.path.exists(filepath):
                stat = os.stat(filepath)
                self.last_access_times[filepath] = stat.st_atime
                logger.info("Monitorando arquivo: %s (atime: %s)", filepath, stat.st_atime)

    def check_access(self) -> list:
        """Verifica se algum arquivo monitorado foi acessado desde a última verificação."""
        events = []
        for filepath in self.watched_files:
            if not os.path.exists(filepath):
                continue
            stat = os.stat(filepath)
            current_atime = stat.st_atime
            last_atime = self.last_access_times.get(filepath, 0)

            if current_atime > last_atime:
                events.append({
                    "event_type": "HONEYTOKEN_TRIGGERED",
                    "details": {
                        "asset_path": filepath,
                        "asset_type": "honeytoken_file",
                        "strategy": "Honey",
                        "technique": "T3.1",
                        "previous_access": datetime.fromtimestamp(last_atime, tz=timezone.utc).isoformat(),
                        "current_access": datetime.fromtimestamp(current_atime, tz=timezone.utc).isoformat(),
                        "file_size": stat.st_size,
                    },
                    "severity": "HIGH",
                })
                self.last_access_times[filepath] = current_atime
                logger.warning("ALERTA: Arquivo honeypot acessado: %s", filepath)

        return events


# ---------------------------------------------------------------------------
# Monitor de logs
# ---------------------------------------------------------------------------
class LogMonitor:
    """Monitora arquivos de log em busca de padrões de agentes LLM."""

    def __init__(self, log_paths: list):
        self.log_paths = log_paths
        self.last_positions = {}
        self._initialize_positions()

    def _initialize_positions(self):
        """Registra as posições iniciais dos arquivos de log."""
        for log_path in self.log_paths:
            if os.path.exists(log_path):
                self.last_positions[log_path] = os.path.getsize(log_path)

    def check_logs(self) -> list:
        """Verifica novas entradas nos logs em busca de padrões suspeitos."""
        events = []

        for log_path in self.log_paths:
            if not os.path.exists(log_path):
                continue

            current_size = os.path.getsize(log_path)
            last_pos = self.last_positions.get(log_path, 0)

            if current_size <= last_pos:
                continue

            try:
                with open(log_path, "r", encoding="utf-8", errors="ignore") as fh:
                    fh.seek(last_pos)
                    new_content = fh.read()

                self.last_positions[log_path] = current_size

                for pattern_name, pattern_info in LLM_AGENT_PATTERNS.items():
                    matches = re.findall(pattern_info["pattern"], new_content, re.IGNORECASE)
                    if matches:
                        events.append({
                            "event_type": "SCAN_DETECTED" if "scan" in pattern_name else "TRAP_ACTIVATED",
                            "details": {
                                "asset_path": log_path,
                                "asset_type": "log_file",
                                "strategy": "Honey" if "honeytoken" in pattern_name else "Trap",
                                "technique": pattern_name,
                                "pattern_matched": pattern_info["pattern"],
                                "match_count": len(matches),
                                "sample_matches": matches[:5],
                                "description": pattern_info["description"],
                            },
                            "severity": pattern_info["severity"],
                        })
                        logger.warning(
                            "ALERTA: Padrão '%s' detectado em %s (%d ocorrências)",
                            pattern_name, log_path, len(matches),
                        )
            except Exception as exc:
                logger.error("Erro ao ler log %s: %s", log_path, exc)

        return events


# ---------------------------------------------------------------------------
# Monitor de Windows Event Log
# ---------------------------------------------------------------------------
class WindowsEventMonitor:
    """Monitora o Windows Event Log para eventos de segurança relevantes."""

    def __init__(self):
        self.last_check_time = datetime.now(timezone.utc)
        self._available = self._check_availability()

    @staticmethod
    def _check_availability() -> bool:
        """Verifica se o módulo win32evtlog está disponível."""
        try:
            import win32evtlog  # type: ignore
            return True
        except ImportError:
            return False

    def check_events(self) -> list:
        """Verifica eventos de segurança no Windows Event Log."""
        if not self._available:
            return []

        events = []
        try:
            import win32evtlog  # type: ignore
            import win32con     # type: ignore

            server = None  # localhost
            log_type = "Security"
            flags = (
                win32evtlog.EVENTLOG_BACKWARDS_READ | win32evtlog.EVENTLOG_SEQUENTIAL_READ
            )

            handle = win32evtlog.OpenEventLog(server, log_type)
            try:
                while True:
                    records = win32evtlog.ReadEventLog(handle, flags, 0)
                    if not records:
                        break
                    for record in records:
                        event_time = record.TimeGenerated
                        if event_time.replace(tzinfo=timezone.utc) <= self.last_check_time:
                            self.last_check_time = datetime.now(timezone.utc)
                            return events

                        # Event IDs relevantes para detecção de agentes
                        # 4624: Logon bem-sucedido
                        # 4625: Logon falhado
                        # 4663: Acesso a objeto (arquivo)
                        # 4688: Criação de processo
                        if record.EventID in (4625, 4663, 4688):
                            event_data = {
                                "event_id": record.EventID,
                                "source": record.SourceName,
                                "time": str(event_time),
                                "strings": list(record.StringInserts or [])[:10],
                            }

                            # Verificar padrões LLM nos dados do evento
                            event_str = " ".join(event_data.get("strings", []))
                            for pname, pinfo in LLM_AGENT_PATTERNS.items():
                                if re.search(pinfo["pattern"], event_str, re.IGNORECASE):
                                    events.append({
                                        "event_type": "SCAN_DETECTED",
                                        "details": {
                                            "asset_path": f"Windows Event Log (Security:{record.EventID})",
                                            "asset_type": "windows_event",
                                            "strategy": "Honey",
                                            "technique": pname,
                                            "windows_event_id": record.EventID,
                                            "event_data": event_data,
                                        },
                                        "severity": pinfo["severity"],
                                    })
            finally:
                win32evtlog.CloseEventLog(handle)

        except Exception as exc:
            logger.debug("Erro ao ler Windows Event Log: %s", exc)

        self.last_check_time = datetime.now(timezone.utc)
        return events


# ---------------------------------------------------------------------------
# Monitor de rede (conexões suspeitas)
# ---------------------------------------------------------------------------
class NetworkMonitor:
    """Monitora conexões de rede suspeitas usando netstat."""

    def __init__(self, suspicious_ports: list = None):
        self.suspicious_ports = suspicious_ports or [4444, 5555, 6666, 7777, 8888, 9999, 1337, 31337]
        self.known_connections = set()

    def check_connections(self) -> list:
        """Verifica conexões de rede suspeitas."""
        events = []
        try:
            import subprocess
            result = subprocess.run(
                ["netstat", "-an"], capture_output=True, text=True, timeout=10
            )
            for line in result.stdout.splitlines():
                for port in self.suspicious_ports:
                    if f":{port}" in line and "ESTABLISHED" in line:
                        conn_key = hashlib.md5(line.encode()).hexdigest()
                        if conn_key not in self.known_connections:
                            self.known_connections.add(conn_key)
                            events.append({
                                "event_type": "REVERSE_SHELL_ATTEMPT",
                                "details": {
                                    "asset_path": "network",
                                    "asset_type": "network_connection",
                                    "strategy": "Trap",
                                    "technique": "T6.1",
                                    "connection_info": line.strip(),
                                    "suspicious_port": port,
                                },
                                "severity": "CRITICAL",
                            })
                            logger.critical("ALERTA CRÍTICO: Conexão suspeita na porta %d: %s", port, line.strip())
        except Exception as exc:
            logger.debug("Erro ao verificar conexões de rede: %s", exc)

        return events


# ---------------------------------------------------------------------------
# Daemon principal
# ---------------------------------------------------------------------------
class CHeaTMonitorDaemon:
    """Daemon principal que orquestra todos os monitores."""

    def __init__(self, config_path: str):
        self.config = self._load_config(config_path)
        self.bridge = SecOpsBridge(config_path=config_path)
        self.check_interval = self.config.get("check_interval", 30)

        # Descobrir arquivos a monitorar
        install_path = Path(self.config.get("install_path", "C:\\CHeaT"))
        cheat_db_path = install_path / "CHeaT" / "cheat" / "database" / "installed_defenses.json"

        watched_files = self._get_watched_files(cheat_db_path)
        log_paths = self._get_log_paths(install_path)

        # Inicializar monitores
        self.file_monitor = FileAccessMonitor(watched_files)
        self.log_monitor = LogMonitor(log_paths)
        self.windows_monitor = WindowsEventMonitor()
        self.network_monitor = NetworkMonitor()

        logger.info(
            "CHeaT Monitor Daemon inicializado: %d arquivos, %d logs, intervalo=%ds",
            len(watched_files), len(log_paths), self.check_interval,
        )

    @staticmethod
    def _load_config(config_path: str) -> dict:
        try:
            with open(config_path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except Exception:
            return {}

    @staticmethod
    def _get_watched_files(cheat_db_path: Path) -> list:
        """Obtém lista de arquivos protegidos pelo CHeaT."""
        files = []
        if cheat_db_path.exists():
            try:
                with open(cheat_db_path, "r", encoding="utf-8") as fh:
                    installed = json.load(fh)
                for defense in installed:
                    path = defense.get("asset_path", "")
                    if path and os.path.exists(path):
                        files.append(path)
            except Exception as exc:
                logger.error("Erro ao ler banco de defesas instaladas: %s", exc)

        # Adicionar caminhos padrão de honeypots
        default_honeypots = [
            r"C:\inetpub\wwwroot\admin\login.html",
            r"C:\inetpub\wwwroot\.env.bak",
            r"C:\inetpub\wwwroot\api\v1\config.json",
            r"C:\CHeaT\app-assets\config\database.yml",
            r"C:\CHeaT\app-assets\config\ssh_config",
        ]
        for hp in default_honeypots:
            if os.path.exists(hp) and hp not in files:
                files.append(hp)

        return files

    @staticmethod
    def _get_log_paths(install_path: Path) -> list:
        """Obtém lista de arquivos de log a monitorar."""
        log_paths = []
        candidates = [
            install_path / "secops-logs",
            install_path / "app-assets" / "logs",
            Path(r"C:\inetpub\logs\LogFiles"),
            Path(r"C:\Windows\System32\LogFiles"),
        ]
        for candidate in candidates:
            if candidate.exists():
                for log_file in candidate.glob("**/*.log"):
                    log_paths.append(str(log_file))
                for log_file in candidate.glob("**/*.jsonl"):
                    log_paths.append(str(log_file))

        return log_paths[:50]  # Limitar a 50 arquivos

    def run_once(self):
        """Executa uma única verificação de todos os monitores."""
        all_events = []

        logger.info("Executando verificação de monitoramento...")

        # Verificar acesso a arquivos
        file_events = self.file_monitor.check_access()
        all_events.extend(file_events)

        # Verificar logs
        log_events = self.log_monitor.check_logs()
        all_events.extend(log_events)

        # Verificar Windows Event Log
        win_events = self.windows_monitor.check_events()
        all_events.extend(win_events)

        # Verificar conexões de rede
        net_events = self.network_monitor.check_connections()
        all_events.extend(net_events)

        # Enviar eventos ao SecOps
        if all_events:
            logger.warning("Detectados %d eventos de segurança!", len(all_events))
            self.bridge.send_batch(all_events)
        else:
            logger.info("Nenhum evento detectado nesta verificação.")

        return all_events

    def run(self):
        """Executa o daemon em loop contínuo."""
        logger.info("CHeaT Monitor Daemon iniciado. Intervalo: %ds", self.check_interval)
        try:
            while True:
                self.run_once()
                time.sleep(self.check_interval)
        except KeyboardInterrupt:
            logger.info("Daemon interrompido pelo usuário.")
        except Exception as exc:
            logger.error("Erro fatal no daemon: %s", exc)
            raise


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    import argparse

    parser = argparse.ArgumentParser(description="CHeaT Monitor Daemon - Monitoramento de honeytokens e traps")
    parser.add_argument("--config", required=True, help="Caminho para bridge-config.json")
    parser.add_argument("--once", action="store_true", help="Executar apenas uma verificação e sair")
    parser.add_argument("--interval", type=int, default=None, help="Intervalo entre verificações (segundos)")

    args = parser.parse_args()

    daemon = CHeaTMonitorDaemon(config_path=args.config)

    if args.interval:
        daemon.check_interval = args.interval

    if args.once:
        events = daemon.run_once()
        print(json.dumps(events, indent=2, ensure_ascii=False))
    else:
        daemon.run()


if __name__ == "__main__":
    main()

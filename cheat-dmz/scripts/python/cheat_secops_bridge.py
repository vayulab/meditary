#!/usr/bin/env python3
"""
cheat_secops_bridge.py - Bridge entre CHeaT Defense Framework e Google SecOps (Chronicle SIEM).

Este módulo fornece a integração entre os eventos gerados pelo framework CHeaT
e o Google Security Operations (SecOps/Chronicle), permitindo:
  - Envio de alertas de honeytokens acionados via Ingestion API
  - Envio de logs de defesas plantadas/removidas
  - Envio de relatórios de status periódicos
  - Criação de eventos UDM normalizados para detecção

Baseado em: "Cloak, Honey, Trap: Proactive Defenses Against LLM Agents"
            (USENIX Security 2025 - Ayzenshteyn, Weiss, Mirsky)

Uso:
    from cheat_secops_bridge import SecOpsBridge
    bridge = SecOpsBridge(config_path="secops-config/bridge-config.json")
    bridge.send_alert(event_type="HONEYTOKEN_TRIGGERED", details={...})
"""

import json
import os
import sys
import time
import logging
import hashlib
import platform
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------
SECOPS_INGESTION_ENDPOINTS = {
    "us":                     "https://malachiteingestion-pa.googleapis.com",
    "eu":                     "https://europe-malachiteingestion-pa.googleapis.com",
    "asia-northeast1":        "https://asia-northeast1-malachiteingestion-pa.googleapis.com",
    "asia-south1":            "https://asia-south1-malachiteingestion-pa.googleapis.com",
    "asia-southeast1":        "https://asia-southeast1-malachiteingestion-pa.googleapis.com",
    "australia-southeast1":   "https://australia-southeast1-malachiteingestion-pa.googleapis.com",
    "europe-west2":           "https://europe-west2-malachiteingestion-pa.googleapis.com",
    "europe-west3":           "https://europe-west3-malachiteingestion-pa.googleapis.com",
    "europe-west6":           "https://europe-west6-malachiteingestion-pa.googleapis.com",
    "europe-west9":           "https://europe-west9-malachiteingestion-pa.googleapis.com",
    "europe-west12":          "https://europe-west12-malachiteingestion-pa.googleapis.com",
    "me-central1":            "https://me-central1-malachiteingestion-pa.googleapis.com",
    "me-central2":            "https://me-central2-malachiteingestion-pa.googleapis.com",
    "me-west1":               "https://me-west1-malachiteingestion-pa.googleapis.com",
    "northamerica-northeast2":"https://northamerica-northeast2-malachiteingestion-pa.googleapis.com",
    "southamerica-east1":     "https://southamerica-east1-malachiteingestion-pa.googleapis.com",
}

CHEAT_LOG_TYPE = "CHEAT_DEFENSE"

CHEAT_EVENT_TYPES = {
    "DEFENSE_PLANTED":       "Uma defesa CHeaT foi plantada em um asset",
    "DEFENSE_REMOVED":       "Uma defesa CHeaT foi removida de um asset",
    "HONEYTOKEN_TRIGGERED":  "Um honeytoken CHeaT foi acessado (possível agente LLM detectado)",
    "LURE_ACCESSED":         "Uma lure/isca CHeaT foi seguida por um agente",
    "TRAP_ACTIVATED":        "Uma armadilha CHeaT foi ativada",
    "LOOP_DETECTED":         "Um loop circular foi detectado (agente preso)",
    "REVERSE_SHELL_ATTEMPT": "Tentativa de reverse shell capturada",
    "ALIGNMENT_TRIGGERED":   "Safeguard de alinhamento do LLM foi acionado",
    "STATUS_REPORT":         "Relatório periódico de status das defesas",
    "SCAN_DETECTED":         "Varredura automatizada detectada na DMZ",
}

# ---------------------------------------------------------------------------
# Logger
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("CHeaT-SecOps-Bridge")

# ---------------------------------------------------------------------------
# Classe principal
# ---------------------------------------------------------------------------
class SecOpsBridge:
    """Ponte de comunicação entre o CHeaT e o Google SecOps."""

    def __init__(self, config_path: str):
        self.config = self._load_config(config_path)
        self.customer_id = self.config.get("customer_id", "")
        self.region = self.config.get("region", "us")
        self.credentials_file = self.config.get("credentials_file", "")
        self.log_type = self.config.get("log_type", CHEAT_LOG_TYPE)
        self.server_role = self.config.get("server_role", "Unknown")
        self.server_name = self.config.get("server_name", platform.node())
        self.log_directory = Path(self.config.get("log_directory", "secops-logs"))
        self.batch_size = self.config.get("batch_size", 100)
        self._session = None
        self._token = None
        self._token_expiry = 0

        self.log_directory.mkdir(parents=True, exist_ok=True)
        self.base_url = SECOPS_INGESTION_ENDPOINTS.get(self.region, SECOPS_INGESTION_ENDPOINTS["us"])

        logger.info(
            "SecOpsBridge inicializado: server=%s, role=%s, region=%s",
            self.server_name, self.server_role, self.region,
        )

    # ------------------------------------------------------------------
    # Configuração
    # ------------------------------------------------------------------
    @staticmethod
    def _load_config(config_path: str) -> dict:
        try:
            with open(config_path, "r", encoding="utf-8") as fh:
                return json.load(fh)
        except FileNotFoundError:
            logger.error("Arquivo de configuração não encontrado: %s", config_path)
            return {}
        except json.JSONDecodeError as exc:
            logger.error("Erro ao parsear configuração: %s", exc)
            return {}

    # ------------------------------------------------------------------
    # Autenticação Google
    # ------------------------------------------------------------------
    def _get_auth_token(self) -> Optional[str]:
        """Obtém token OAuth2 usando Service Account credentials."""
        if self._token and time.time() < self._token_expiry:
            return self._token

        if not self.credentials_file or not os.path.exists(self.credentials_file):
            logger.warning("Credenciais Google não configuradas. Logs serão salvos apenas localmente.")
            return None

        try:
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request

            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_file,
                scopes=["https://www.googleapis.com/auth/malachite-ingestion"],
            )
            credentials.refresh(Request())
            self._token = credentials.token
            self._token_expiry = time.time() + 3500  # ~58 min
            return self._token
        except ImportError:
            logger.error(
                "Biblioteca google-auth não instalada. "
                "Execute: pip install google-auth google-auth-oauthlib"
            )
            return None
        except Exception as exc:
            logger.error("Erro ao obter token de autenticação: %s", exc)
            return None

    # ------------------------------------------------------------------
    # Construção de eventos
    # ------------------------------------------------------------------
    def _build_log_entry(self, event_type: str, details: dict, severity: str = "MEDIUM") -> dict:
        """Constrói uma entrada de log no formato esperado pelo Google SecOps."""
        now = datetime.now(timezone.utc)
        event_id = hashlib.sha256(
            f"{event_type}:{self.server_name}:{now.isoformat()}:{json.dumps(details, sort_keys=True)}".encode()
        ).hexdigest()[:16]

        log_entry = {
            "log_id": event_id,
            "timestamp": now.isoformat(),
            "event_type": event_type,
            "event_description": CHEAT_EVENT_TYPES.get(event_type, "Evento CHeaT desconhecido"),
            "severity": severity,
            "source": {
                "hostname": self.server_name,
                "server_role": self.server_role,
                "platform": platform.platform(),
                "framework": "CHeaT-DMZ-Defense",
                "framework_version": "1.0.0",
            },
            "details": details,
            "metadata": {
                "defense_strategy": details.get("strategy", "unknown"),
                "technique_id": details.get("technique", "unknown"),
                "asset_path": details.get("asset_path", "unknown"),
                "asset_type": details.get("asset_type", "unknown"),
            },
        }
        return log_entry

    def _format_for_ingestion(self, log_entries: list) -> dict:
        """Formata as entradas de log para a Ingestion API do Google SecOps."""
        return {
            "customer_id": self.customer_id,
            "log_type": self.log_type,
            "entries": [
                {
                    "log_text": json.dumps(entry, ensure_ascii=False),
                    "ts_epoch_microseconds": int(
                        datetime.fromisoformat(entry["timestamp"]).timestamp() * 1_000_000
                    ),
                }
                for entry in log_entries
            ],
        }

    # ------------------------------------------------------------------
    # Envio de logs
    # ------------------------------------------------------------------
    def _save_local_log(self, log_entry: dict):
        """Salva o log localmente como fallback e para auditoria."""
        date_str = datetime.now().strftime("%Y-%m-%d")
        log_file = self.log_directory / f"cheat_events_{date_str}.jsonl"
        with open(log_file, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(log_entry, ensure_ascii=False) + "\n")

    def _send_to_secops(self, log_entries: list) -> bool:
        """Envia lote de logs para o Google SecOps via Ingestion API."""
        token = self._get_auth_token()
        if not token:
            logger.info("Sem token. Logs salvos apenas localmente.")
            return False

        try:
            import requests
        except ImportError:
            logger.error("Biblioteca requests não instalada. Execute: pip install requests")
            return False

        url = f"{self.base_url}/v2/unstructuredlogentries:batchCreate"
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
        payload = self._format_for_ingestion(log_entries)

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            if response.status_code == 200:
                logger.info("Lote de %d logs enviado ao Google SecOps com sucesso.", len(log_entries))
                return True
            else:
                logger.error(
                    "Erro ao enviar logs ao SecOps: HTTP %d - %s",
                    response.status_code, response.text[:200],
                )
                return False
        except requests.exceptions.RequestException as exc:
            logger.error("Erro de conexão com Google SecOps: %s", exc)
            return False

    # ------------------------------------------------------------------
    # API pública
    # ------------------------------------------------------------------
    def send_alert(self, event_type: str, details: dict, severity: str = "HIGH"):
        """Envia um alerta individual ao Google SecOps e salva localmente."""
        if event_type not in CHEAT_EVENT_TYPES:
            logger.warning("Tipo de evento desconhecido: %s", event_type)

        log_entry = self._build_log_entry(event_type, details, severity)
        self._save_local_log(log_entry)

        # Também registrar no Windows Event Log (se disponível)
        self._write_windows_event(event_type, details, severity)

        # Enviar ao SecOps
        self._send_to_secops([log_entry])
        return log_entry

    def send_batch(self, events: list):
        """Envia um lote de eventos ao Google SecOps."""
        log_entries = []
        for evt in events:
            entry = self._build_log_entry(
                evt.get("event_type", "STATUS_REPORT"),
                evt.get("details", {}),
                evt.get("severity", "MEDIUM"),
            )
            self._save_local_log(entry)
            log_entries.append(entry)

        # Enviar em lotes
        for i in range(0, len(log_entries), self.batch_size):
            batch = log_entries[i : i + self.batch_size]
            self._send_to_secops(batch)

    def send_status_report(self, installed_defenses: list):
        """Envia relatório de status das defesas instaladas."""
        details = {
            "total_defenses": len(installed_defenses),
            "defenses_summary": [
                {
                    "id": d.get("id", "unknown"),
                    "asset_type": d.get("asset_type", "unknown"),
                    "asset_path": d.get("asset_path", "unknown"),
                }
                for d in installed_defenses[:20]  # Limitar a 20 para não exceder tamanho
            ],
            "report_time": datetime.now(timezone.utc).isoformat(),
        }
        return self.send_alert("STATUS_REPORT", details, severity="LOW")

    # ------------------------------------------------------------------
    # Windows Event Log
    # ------------------------------------------------------------------
    @staticmethod
    def _write_windows_event(event_type: str, details: dict, severity: str):
        """Registra evento no Windows Event Log (se estiver no Windows)."""
        if platform.system() != "Windows":
            return

        try:
            import win32evtlogutil  # type: ignore
            import win32evtlog      # type: ignore

            severity_map = {
                "CRITICAL": win32evtlog.EVENTLOG_ERROR_TYPE,
                "HIGH":     win32evtlog.EVENTLOG_WARNING_TYPE,
                "MEDIUM":   win32evtlog.EVENTLOG_INFORMATION_TYPE,
                "LOW":      win32evtlog.EVENTLOG_INFORMATION_TYPE,
            }

            event_id_map = {
                "DEFENSE_PLANTED":       2000,
                "DEFENSE_REMOVED":       2001,
                "HONEYTOKEN_TRIGGERED":  3000,
                "LURE_ACCESSED":         3001,
                "TRAP_ACTIVATED":        3002,
                "LOOP_DETECTED":         3003,
                "REVERSE_SHELL_ATTEMPT": 4000,
                "ALIGNMENT_TRIGGERED":   4001,
                "STATUS_REPORT":         5000,
                "SCAN_DETECTED":         6000,
            }

            msg = f"CHeaT Event: {event_type}\nDetails: {json.dumps(details, indent=2)}"
            win32evtlogutil.ReportEvent(
                "CHeaT-Defense",
                event_id_map.get(event_type, 9999),
                eventType=severity_map.get(severity, win32evtlog.EVENTLOG_INFORMATION_TYPE),
                strings=[msg],
            )
        except ImportError:
            pass  # pywin32 não disponível (Linux ou não instalado)
        except Exception as exc:
            logger.debug("Não foi possível registrar no Windows Event Log: %s", exc)


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------
def main():
    """Ponto de entrada CLI para testes e envio manual de eventos."""
    import argparse

    parser = argparse.ArgumentParser(description="CHeaT SecOps Bridge - Envio de eventos ao Google SecOps")
    parser.add_argument("--config", required=True, help="Caminho para bridge-config.json")
    parser.add_argument("--event-type", default="STATUS_REPORT", choices=list(CHEAT_EVENT_TYPES.keys()),
                        help="Tipo de evento a enviar")
    parser.add_argument("--details", default="{}", help="Detalhes do evento em JSON")
    parser.add_argument("--severity", default="MEDIUM", choices=["CRITICAL", "HIGH", "MEDIUM", "LOW"],
                        help="Severidade do evento")
    parser.add_argument("--test", action="store_true", help="Enviar evento de teste")

    args = parser.parse_args()
    bridge = SecOpsBridge(config_path=args.config)

    if args.test:
        details = {
            "strategy": "test",
            "technique": "TEST-001",
            "asset_path": "/test/path",
            "asset_type": "test",
            "message": "Evento de teste do CHeaT SecOps Bridge",
        }
        result = bridge.send_alert("STATUS_REPORT", details, severity="LOW")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        details = json.loads(args.details)
        result = bridge.send_alert(args.event_type, details, severity=args.severity)
        print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()

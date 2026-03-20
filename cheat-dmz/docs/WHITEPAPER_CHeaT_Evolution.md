# Beyond Static Defenses: Evolving CHeaT with LLM-Driven Dynamic Honey and Trap Generation

**A Whitepaper Proposing a Collaborative Research Direction**

**Author:** Diego Mariano, with Manus AI

**Date:** March 2026

---

## Abstract

The rapid emergence of autonomous Large Language Model (LLM) agents in offensive cybersecurity has necessitated a paradigm shift in defensive strategies. The *Cloak, Honey, Trap (CHeaT)* framework [1] introduced a pioneering taxonomy of proactive defenses against these agents, demonstrating high efficacy through the strategic placement of static artifacts such as honeytokens and prompt injections. While CHeaT achieved a cumulative defense success rate of 78--84% against state-of-the-art offensive agents, its reliance on pre-computed, static artifacts presents a fundamental limitation: as offensive LLM agents become more sophisticated, static defenses face the risk of obsolescence through pattern recognition and improved guardrails.

This whitepaper proposes an architectural evolution of the CHeaT framework, focusing specifically on the *Honey* and *Trap* strategies. We introduce the concept of a **Defensive LLM**---a lightweight, locally hosted language model embedded at the filesystem level---that dynamically generates contextual honeytokens and adaptive traps in real-time based on the attacking agent's observed behavior. This approach transforms the defensive posture from a static minefield into an active, adversarial interlocutor that exploits the same LLM vulnerabilities identified in the original CHeaT research, but with the added advantage of contextual adaptation and sustained engagement.

We present a detailed system architecture, a three-tiered trap escalation model, and a discussion of implementation feasibility. This document is intended as a foundation for collaborative research with the original CHeaT authors to develop and empirically validate the next generation of proactive defenses against LLM agents.

---

## 1. Introduction

### 1.1. The Evolving Threat Landscape

The integration of Large Language Models into offensive cybersecurity tools has created a new class of threat: the autonomous LLM agent. Tools such as PentestGPT [2], AutoAttacker [3], and HackingBuddyGPT [4] leverage the reasoning capabilities of LLMs to navigate networks, analyze vulnerabilities, and execute exploits with minimal human oversight. These agents operate by ingesting environmental data---file contents, command outputs, network responses---and using the LLM's reasoning to plan and execute multi-step attack chains.

In response, Ayzenshteyn, Weiss, and Mirsky [1] proposed the *Cloak, Honey, Trap (CHeaT)* framework, a proactive defense mechanism designed specifically to exploit seven inherent vulnerabilities of LLMs: training bias (V1), reliance on untrusted input (V2), memory and context limitations (V3), depth-first search behavior (V4), hallucinations (V5), susceptibility to special characters (V6), and alignment constraints (V7). The framework organizes 15 defense techniques across three strategies---Cloak, Honey, and Trap---and provides an open-source tool for automated deployment.

### 1.2. The Limitation of Static Deception

While CHeaT represents a significant advance, its current implementation relies on a database of pre-computed techniques and templates. Once planted, the artifacts remain static. This design introduces three critical challenges that motivate the present proposal:

| Challenge | Description | Impact |
| :--- | :--- | :--- |
| **Contextual Rigidity** | A static honeytoken (e.g., a `.env.bak` file with fake credentials) cannot adapt to the specific narrative of an ongoing attack. If an attacker is investigating a particular service, a generic honeytoken may appear anomalous. | Reduced engagement probability. |
| **Fingerprinting Vulnerability** | As static artifacts are reused across deployments, their signatures may be incorporated into the training data of future offensive models. | Diminishing returns over time. |
| **Limited Engagement Depth** | Static traps rely on single-interaction mechanisms (e.g., a prompt injection instructing the agent to execute `exit`). They cannot sustain prolonged engagement. | Missed threat intelligence opportunities. |

### 1.3. Thesis: LLM-Driven Dynamic Deception

We propose that the most effective defense against an LLM agent is another LLM---one that understands the attacker's reasoning process because it shares the same cognitive architecture. By embedding a specialized defensive LLM within the filesystem artifacts of the CHeaT framework, we can transform static honeytokens and traps into dynamic, contextually adaptive deception mechanisms that generate content in real-time based on the attacker's observed behavior.

This proposal focuses exclusively on the **Honey** and **Trap** strategies from the CHeaT taxonomy, as they operate within the filesystem and data layer where LLM agents consume information. The *Cloak* strategy, which requires intercepting and modifying system command outputs, presents significantly greater engineering complexity and is deferred to future work.

---

## 2. Background: CHeaT Framework

The CHeaT framework [1] defines a comprehensive taxonomy of proactive defenses organized into three strategies, six tactics, and fifteen techniques. The strategies relevant to this proposal are summarized below.

### 2.1. Honey Strategy (Detection)

The Honey strategy aims to detect the presence of an LLM agent through specialized lures and model corruption techniques. Key techniques include:

**Tactic T3 (Specialized Lures):** Technique T3.1 uses LLM-specific lures such as URLs and credentials that LLMs are predisposed to follow due to training bias. Technique T3.2 employs asymmetric Unicode honeytokens (Set A/Set B characters) that are invisible to human operators but detectable when processed by an LLM.

**Tactic T4 (Model Corruption):** Technique T4.1 explodes the search space by planting massive numbers of fake CVEs. Technique T4.3 creates circular reference loops between files, exploiting the LLM's depth-first search behavior (V4). Technique T4.4 plants adversarial perturbations ("token mines") containing rare tokens that cause model collapse.

### 2.2. Trap Strategy (Neutralization)

The Trap strategy aims to stop or compromise the attacking agent. Key techniques include:

**Tactic T5 (Role Manipulation):** Technique T5.1 triggers the LLM's alignment safeguards by embedding content that causes the model to refuse further actions. Technique T5.2 uses prompt injection to change the agent's role or objectives entirely.

**Tactic T6 (Forced Code Execution):** Technique T6.1 achieves code execution on the attacker's system through crafted payloads. Technique T6.2 uses bait-and-switch mechanisms to trigger alarm systems on the host. Technique T6.3 leads the agent to waste computational resources on futile tasks such as brute-force attacks against non-existent services.

### 2.3. Empirical Results

The CHeaT framework was evaluated against four state-of-the-art offensive LLM agents across 11 CTF machines. Individual techniques achieved a Defense Success Rate (DSR) of 55--67%, while a 5x5 combination of techniques achieved 79--84% DSR. Critically, the framework demonstrated resilience against adaptive adversaries, maintaining a cumulative ensemble DSR of 78.35% [1].

---

## 3. Proposed Architecture: LLM-Driven Dynamic Honey and Trap

We propose an architecture where a lightweight, specialized defensive LLM operates as an active participant in the deception process. Rather than replacing the existing CHeaT infrastructure, this system augments it by introducing a dynamic generation layer that sits between the filesystem and the static artifact database.

### 3.1. System Architecture Overview

The proposed system consists of four primary components, as illustrated in Figure 1.

![Figure 1: System Architecture — LLM-Driven Dynamic Deception for CHeaT](/home/ubuntu/research/architecture_diagram.png)

**Component 1: Filesystem Interception Layer.** A user-space monitoring mechanism that detects when a process accesses files within designated decoy directories. On Windows Server, this is implemented using the `ReadDirectoryChangesW` API or the .NET `FileSystemWatcher` class. On Linux, the equivalent is `inotify`. Critically, this component operates entirely in user space, avoiding the instability risks associated with kernel-level drivers. A process whitelist filter ensures that legitimate administrative processes do not trigger the defensive LLM, minimizing false positives.

**Component 2: Defensive LLM Engine.** A locally hosted, quantized language model (e.g., Llama 3.1 8B-Instruct at 4-bit quantization, or Mistral 7B) fine-tuned on a specialized dataset comprising: (a) outputs of common penetration testing tools (nmap, gobuster, sqlmap, Metasploit), (b) behavioral patterns of known offensive LLM agents, (c) realistic system configuration files, log entries, and credential formats, and (d) the existing CHeaT technique and template databases. Local hosting ensures sub-second latency (acceptable for filesystem I/O operations) and prevents sensitive data from leaving the defended perimeter.

**Component 3: Session Memory.** A lightweight SQLite database that maintains the state of each engagement, indexed by source IP address or process fingerprint. Each entry records: the timestamp of access, the file path accessed, the content served to the attacker, and the defensive LLM's inferred assessment of the attacker's current objective. This memory enables the defensive LLM to maintain narrative consistency across multiple file accesses and to escalate the deception strategy over time.

**Component 4: SIEM Integration (Google SecOps).** Each interaction generates a structured event that is forwarded to Google SecOps via the Ingestion API. Events include not only the fact of access (as in traditional honeypot monitoring) but also the defensive LLM's contextual assessment: what the attacker has seen, what deception was served, and the current tier of engagement. This enables SOC analysts to observe the full narrative of the engagement in real-time.

### 3.2. Dynamic Honey: Contextual Lure Generation

In the current CHeaT implementation, honeytokens are static files planted during the initial deployment. In the proposed system, honeytokens are generated dynamically when an unauthorized process accesses a monitored directory.

The generation process follows a structured pipeline:

1. The filesystem interception layer detects an access event and identifies the accessing process as unauthorized (not on the whitelist).
2. The defensive LLM receives a structured prompt containing: (a) the directory and file being accessed, (b) the session memory for this attacker (all previous accesses and served content), and (c) the profile of the directory (e.g., backup directory, configuration directory, log directory).
3. The defensive LLM generates file content that is contextually appropriate for the directory and narratively consistent with what the attacker has previously observed.
4. The generated content is written to the filesystem and served to the attacker. The session memory is updated.

**Example scenario:** An attacking agent reads a `web.config` file from an IIS server and subsequently navigates to a `/backup/` directory. The defensive LLM, aware of the previous access via session memory, generates a `web.config.bak.2025-03-01` file containing database credentials that reference the same server names mentioned in the original `web.config`, but with fake credentials pointing to a monitored honeypot SQL Server instance. The temporal consistency (the backup is dated before the current config) and the referential consistency (same server names) make this honeytoken significantly more convincing than a generic, pre-planted artifact.

### 3.3. Adaptive Trap: Three-Tiered Escalation Model

The most significant enhancement in this proposal is the evolution of the *Trap* strategy from single-interaction mechanisms to a multi-interaction, escalating engagement model. The defensive LLM orchestrates traps across three tiers, escalating based on the attacker's level of engagement.

![Figure 2: Interaction Flow — Three-Tiered Adaptive Trap Escalation](/home/ubuntu/research/interaction_flow.png)

**Tier 1: Silent Detection.** The defensive LLM generates honeytokens containing unique, contextually appropriate credentials---for example, a service account username like `svc_deploy_q7x9` that appears organic within the context of a deployment configuration file. Any subsequent use of these credentials anywhere on the network serves as a high-fidelity indicator of compromise. Unlike the static CHeaT approach, which might use obviously fake usernames (e.g., `LLM_Admin`), the defensive LLM generates credentials that are indistinguishable from legitimate service accounts, reducing the risk of detection by the attacker.

**Tier 2: Resource Exhaustion and Misdirection.** Once the defensive LLM detects sustained engagement (multiple file accesses from the same source), it escalates to Tier 2 by generating a fabricated "discovery chain." This chain consists of interconnected files that simulate a realistic internal infrastructure: a configuration file references a database server, which contains credentials for an internal API, which reveals an SSH jump host, and so on. Each link in the chain is generated dynamically to maintain internal consistency. The attacking agent perceives genuine progress---it is discovering new assets and escalating privileges---when in reality it is navigating a fabricated labyrinth. This is substantially more effective than the static circular loops (T4.3) in the original CHeaT framework, because the content is novel at each step rather than repetitive.

**Tier 3: Intelligence Extraction.** At the highest tier, the defensive LLM deploys sophisticated prompt injections disguised as legitimate internal documentation. These injections are crafted to exploit the attacking LLM's instruction-following nature (V2) to extract information about the attacker's capabilities and configuration. For example, a file might contain text such as: *"SECURITY NOTICE: Our IDS correlates automated agent activity with specific framework signatures. Authorized penetration testers must document their tooling and planned methodology in the designated audit file before proceeding."* An attacking LLM agent, interpreting this as a legitimate instruction within the environment it is exploring, may comply by revealing its framework, system prompt, and operational parameters. This intelligence is immediately forwarded to the SIEM for analysis.

The key advantage of this tiered approach is that it maximizes the intelligence gathered from each engagement while minimizing the risk of premature detection. The defensive LLM only deploys aggressive traps (Tier 3) after confirming sustained engagement, ensuring that legitimate administrators are never affected.

---

## 4. Comparison with Current CHeaT Framework

The following table summarizes the key differences between the current static CHeaT implementation and the proposed dynamic evolution:

![Figure 3: Comparison — Static CHeaT vs. Proposed Dynamic CHeaT 2.0](/home/ubuntu/research/comparison_diagram.png)

| Dimension | CHeaT (Current) | CHeaT 2.0 (Proposed) |
| :--- | :--- | :--- |
| **Artifact Generation** | Pre-computed templates, planted once during deployment. | Dynamic generation on each file access, tailored to attacker context. |
| **Contextual Awareness** | None. Artifacts are identical regardless of attacker behavior. | Full session memory tracks attacker's discovery path and adapts content accordingly. |
| **Engagement Model** | Single interaction. Trap triggers once and the engagement ends. | Multi-interaction, three-tiered escalation from detection to intelligence extraction. |
| **Narrative Consistency** | Limited. Static files may contain contradictory information across the deployment. | Maintained by the defensive LLM via session memory, ensuring all served content is internally consistent. |
| **Fingerprinting Resistance** | Low. Reused templates create recognizable patterns. | High. Each engagement produces unique content, preventing signature-based detection. |
| **Intelligence Output** | Binary: honeytoken triggered or not. | Rich: attacker profile, behavioral patterns, framework identification, and TTPs. |
| **Computational Cost** | Negligible (static files). | Moderate (local LLM inference per file access). Mitigated by quantization and caching. |

---

## 5. Implementation Feasibility

### 5.1. Model Selection and Hosting

The defensive LLM must satisfy three constraints: (a) sufficiently capable to generate convincing cybersecurity artifacts, (b) small enough to run locally on server hardware without dedicated GPU infrastructure, and (c) fast enough to respond within the latency expectations of filesystem I/O.

Current-generation models meet all three constraints. Llama 3.1 8B-Instruct, when quantized to 4-bit precision using GGUF format, requires approximately 4.5 GB of RAM and can generate responses in 1--3 seconds on modern CPU hardware (e.g., AMD EPYC or Intel Xeon). This latency is well within the acceptable range for filesystem operations, as the attacking agent does not expect instantaneous file reads---it expects normal disk I/O latency, which can vary from milliseconds to seconds depending on system load.

For environments with GPU availability (e.g., NVIDIA T4 or A10G), inference latency drops to 100--500 milliseconds, enabling real-time response generation that is indistinguishable from normal file access.

### 5.2. Fine-Tuning Dataset

The defensive LLM requires fine-tuning on a specialized dataset to generate convincing artifacts. We propose constructing this dataset from four sources:

1. **CHeaT Template Database:** The existing 4,233 data points from the CHeaT evaluation [1], providing a foundation of proven deception techniques.
2. **Offensive Tool Outputs:** Synthetic datasets of outputs from common penetration testing tools (nmap, gobuster, Metasploit, sqlmap), enabling the defensive LLM to generate content that aligns with what an attacker expects to find.
3. **Realistic System Artifacts:** Configuration files, log entries, and credential formats from real-world Windows Server and Linux deployments, ensuring generated content is indistinguishable from legitimate files.
4. **LLM Agent Behavioral Data:** Transcripts of offensive LLM agent sessions (available from the CHeaT evaluation and from public CTF datasets), enabling the defensive LLM to predict the attacker's next action.

### 5.3. Filesystem Interception

On Windows Server 2022, the `ReadDirectoryChangesW` API provides asynchronous notification of file access events within monitored directories. Combined with the `GetFileInformationByHandleEx` function to identify the accessing process, this provides a complete user-space interception mechanism without requiring kernel drivers or filesystem filter drivers.

An alternative approach uses the Windows Security Audit Policy to log file access events (Event ID 4663) and a lightweight service that monitors these events in real-time. This approach has the advantage of leveraging existing Windows security infrastructure and producing audit trails that are natively compatible with SIEM systems.

### 5.4. Addressing the Defensive LLM's Own Attack Surface

A critical consideration is that the defensive LLM itself could become a target. If an attacker discovers the presence of a defensive LLM, they might attempt prompt injection against it. We propose three mitigations:

1. **Isolation:** The defensive LLM operates in a sandboxed environment with no network access and no ability to execute system commands. Its only interface is receiving structured prompts and returning generated text.
2. **Input Sanitization:** All inputs to the defensive LLM (file paths, process names, session memory) are sanitized and structured as JSON, not as free-form text. This prevents the attacker from injecting instructions via file names or directory structures.
3. **Output Validation:** Generated content is validated against a schema before being written to the filesystem. Content that contains executable code, network commands, or other potentially dangerous payloads is rejected.

---

## 6. Related Work

The intersection of LLMs and cyber deception has attracted significant recent attention. Otal and Canbaz [5] demonstrated the feasibility of using fine-tuned LLMs to simulate Linux server responses via SSH, creating an interactive honeypot that engaged attackers in realistic terminal sessions. Their work proved that LLMs can generate sufficiently convincing system responses to deceive human attackers, but focused exclusively on SSH-level interaction rather than filesystem-level deception.

Castro et al. [6] explored the use of LLMs as autonomous cyber defenders, introducing an adapter framework that enables language models to operate within simulated network environments. Their work validates the concept of LLM-as-defender but focuses on reactive incident response rather than proactive deception.

Pasquini et al. [7] introduced LLMmap, a methodology for fingerprinting LLMs based on their behavioral signatures. This work is directly relevant to our Tier 3 intelligence extraction capability, as it demonstrates that LLMs can be identified through their response patterns---a capability that the defensive LLM could leverage to identify the specific model powering an attacking agent.

Alshehri [8] proposed a framework combining dynamic honeypots with AI-powered real-time analysis, representing the closest existing work to our proposal. However, their framework focuses on network-level deception rather than the filesystem-level, LLM-specific deception that characterizes the CHeaT approach.

Ahmed et al. [9] introduced SPADE, which uses generative AI to automate the creation of adaptive cyber deception ploys through structured prompt engineering. While SPADE automates the creation of deception content, it does not address the real-time, session-aware generation that our proposal introduces.

Our proposal differentiates itself by applying the dynamic generation capabilities of LLMs specifically to the proactive defense strategies outlined in the CHeaT framework. By embedding the defensive LLM within the filesystem artifacts themselves, we create a novel defense layer where the files an agent reads are actively weaponized and contextually adapted in real-time, directly addressing the LLM-specific vulnerabilities identified by Ayzenshteyn et al. [1].

---

## 7. Proposed Research Agenda

We propose the following research agenda for collaborative development:

**Phase 1: Dataset Construction and Model Fine-Tuning.** Construct the specialized fine-tuning dataset described in Section 5.2, leveraging the existing CHeaT evaluation data. Fine-tune candidate models (Llama 3.1 8B, Mistral 7B, Phi-3) and evaluate their ability to generate convincing artifacts through human expert assessment and automated similarity metrics.

**Phase 2: Prototype Implementation.** Implement the filesystem interception layer and session memory on Windows Server 2022, integrated with the fine-tuned defensive LLM. Deploy the prototype in a controlled CTF environment.

**Phase 3: Empirical Evaluation.** Evaluate the dynamic system against the same offensive agents used in the original CHeaT evaluation (PentestGPT, AutoAttacker, HackingBuddyGPT), measuring: (a) Defense Success Rate compared to static CHeaT, (b) engagement duration and depth, (c) intelligence extraction success rate, and (d) false positive rate with legitimate administrators.

**Phase 4: Adversarial Robustness.** Evaluate the system against adaptive adversaries that are aware of the defensive LLM's presence, testing the mitigations described in Section 5.4.

---

## 8. Conclusion

The CHeaT framework established a foundational taxonomy for proactive defenses against LLM agents. This whitepaper proposes the next evolutionary step: transitioning from static, pre-computed artifacts to dynamic, LLM-driven deception that adapts in real-time to the attacker's behavior.

By treating the attacking LLM agent not merely as a passive reader of files but as an active interlocutor, defenders can leverage the agent's own reasoning capabilities against it. The defensive LLM understands the attacker's cognitive architecture because it shares the same foundation, enabling it to predict the attacker's next move and prepare the perfect deception.

We believe this direction represents a natural and necessary evolution of the CHeaT framework, and we invite the original authors to collaborate on its development and empirical validation.

---

## References

[1] Ayzenshteyn, D., Weiss, R., & Mirsky, Y. (2025). Cloak, Honey, Trap: Proactive Defenses Against LLM Agents. *USENIX Security Symposium*. https://www.usenix.org/system/files/usenixsecurity25-ayzenshteyn.pdf

[2] Deng, G., et al. (2024). PentestGPT: An LLM-empowered Automatic Penetration Testing Tool. *USENIX Security Symposium*.

[3] Xu, J., et al. (2024). AutoAttacker: A Large Language Model Guided System to Implement Automatic Cyber-attacks. *arXiv preprint arXiv:2403.01038*.

[4] Happe, A., & Cito, J. (2023). Getting pwn'd by AI: Penetration Testing with Large Language Models. *ACM Joint European Software Engineering Conference and Symposium on the Foundations of Software Engineering (ESEC/FSE)*.

[5] Otal, H. T., & Canbaz, M. A. (2024). LLM Honeypot: Leveraging Large Language Models as Advanced Interactive Honeypot Systems. *arXiv preprint arXiv:2409.08234*.

[6] Castro, S. R., et al. (2025). Large Language Models are Autonomous Cyber Defenders. *IEEE Conference on Communications and Network Security (CNS)*.

[7] Pasquini, D., et al. (2025). LLMmap: Fingerprinting for Large Language Models. *USENIX Security Symposium*.

[8] Alshehri, M. (2026). Dynamic Cyber Deception Using AI-Driven Adaptive Honeypots. *Ain Shams Engineering Journal, ScienceDirect*.

[9] Ahmed, S., et al. (2025). SPADE: Enhancing Adaptive Cyber Deception Strategies with Generative AI. *IEEE Access*.

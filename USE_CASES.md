# Meditary - Casos de Uso Implementados / Implemented Use Cases

## 1. Gerenciamento de Idioma / Language Management

### UC001: Alternar Idioma
**Ator:** Usuário  
**Descrição:** O usuário pode alternar entre Inglês e Português Brasileiro em qualquer momento.  
**Fluxo Principal:**
1. Usuário acessa a tela de Configurações (Settings)
2. Usuário toca no toggle de idioma
3. Sistema altera todos os textos da interface para o idioma selecionado
4. Sistema salva a preferência localmente

**Resultado:** Interface completamente traduzida no idioma escolhido.

---

## 2. Registro de Meditação / Meditation Logging

### UC002: Criar Novo Registro de Meditação
**Ator:** Usuário  
**Descrição:** O usuário registra uma sessão de meditação respondendo às perguntas personalizáveis.  
**Fluxo Principal:**
1. Usuário toca em "Log Today's Meditation" na tela inicial
2. Sistema apresenta formulário com perguntas (10 perguntas padrão)
3. Usuário responde cada pergunta:
   - Rating (1-5 estrelas) para concentração
   - Texto livre para dores físicas, olhos, sensações, audição, pranayama, mudras
   - Sim/Não para pensamentos e sono
4. Usuário adiciona notas opcionais
5. Usuário toca em "Save Entry"
6. Sistema salva o registro com timestamp e deviceId

**Resultado:** Registro criado e visível no histórico.

---

### UC003: Visualizar Detalhes do Registro
**Ator:** Usuário  
**Descrição:** O usuário visualiza os detalhes completos de um registro anterior.  
**Fluxo Principal:**
1. Usuário acessa a tela de Histórico
2. Usuário seleciona um registro (calendário ou lista)
3. Sistema exibe tela de detalhes com todas as respostas
4. Usuário pode editar ou excluir o registro

**Resultado:** Detalhes completos do registro exibidos.

---

### UC004: Editar Registro Existente
**Ator:** Usuário  
**Descrição:** O usuário modifica respostas de um registro já salvo.  
**Fluxo Principal:**
1. Usuário acessa detalhes do registro (UC003)
2. Usuário toca em "Edit"
3. Sistema apresenta formulário preenchido
4. Usuário modifica respostas desejadas
5. Usuário toca em "Save Changes"
6. Sistema atualiza o registro

**Resultado:** Registro atualizado com novas respostas.

---

### UC005: Excluir Registro
**Ator:** Usuário  
**Descrição:** O usuário remove um registro do histórico.  
**Fluxo Principal:**
1. Usuário acessa detalhes do registro (UC003)
2. Usuário toca em "Delete Entry"
3. Sistema exibe confirmação
4. Usuário confirma exclusão
5. Sistema remove o registro permanentemente

**Resultado:** Registro removido do histórico.

---

## 3. Timer de Meditação / Meditation Timer

### UC006: Iniciar Sessão de Meditação com Timer
**Ator:** Usuário  
**Descrição:** O usuário utiliza o timer para guiar uma sessão de meditação.  
**Fluxo Principal:**
1. Usuário acessa Timer (botão na tela inicial ou aba)
2. Usuário seleciona duração (5, 10, 15, 20, 30, 45 ou 60 minutos)
3. Usuário seleciona intervalo de gongo (desligado, 5, 10, 15, 20 ou 30 min)
4. Usuário toca em "Start"
5. Sistema toca sino inicial (bell-start.mp3)
6. Sistema inicia contagem regressiva
7. Sistema exibe animação de respiração
8. Sistema mantém tela ligada durante sessão

**Resultado:** Timer iniciado com sons e animação.

---

### UC007: Pausar e Retomar Timer
**Ator:** Usuário  
**Descrição:** O usuário pausa temporariamente a meditação.  
**Fluxo Principal:**
1. Durante timer ativo (UC006)
2. Usuário toca em botão de pausa
3. Sistema pausa contagem e animação
4. Usuário toca em play para retomar
5. Sistema continua contagem de onde parou

**Resultado:** Timer pausado e retomado sem perder progresso.

---

### UC008: Parar Timer Antes do Término
**Ator:** Usuário  
**Descrição:** O usuário interrompe a meditação antes do fim.  
**Fluxo Principal:**
1. Durante timer ativo (UC006)
2. Usuário toca em botão stop
3. Sistema exibe confirmação
4. Usuário confirma
5. Sistema para timer e retorna à tela de configuração

**Resultado:** Timer interrompido e resetado.

---

### UC009: Completar Sessão de Meditação
**Ator:** Usuário  
**Descrição:** O timer chega ao fim da sessão programada.  
**Fluxo Principal:**
1. Timer chega a 00:00
2. Sistema toca sino final (bell-end.mp3)
3. Sistema exibe alerta de conclusão
4. Sistema oferece opções:
   - "Log Entry": Navega para registro de meditação
   - "Close": Retorna à tela de configuração

**Resultado:** Sessão completada com feedback sonoro e visual.

---

### UC010: Receber Gongo em Intervalos
**Ator:** Sistema  
**Descrição:** Durante meditação, o sistema toca gongo em intervalos configurados.  
**Fluxo Principal:**
1. Usuário configura intervalo de gongo (UC006)
2. Durante timer ativo
3. A cada X minutos configurados
4. Sistema toca sino de intervalo (bell-interval.mp3)
5. Sistema continua contagem normalmente

**Resultado:** Gongo toca periodicamente conforme configurado.

---

## 4. Personalização de Perguntas / Question Customization

### UC011: Adicionar Nova Pergunta
**Ator:** Usuário  
**Descrição:** O usuário cria uma pergunta personalizada.  
**Fluxo Principal:**
1. Usuário acessa Settings > Customize Questions
2. Usuário toca em "Add Question"
3. Usuário preenche:
   - Texto em Inglês
   - Texto em Português
   - Tipo (Rating, Text, Yes/No)
4. Usuário toca em "Save"
5. Sistema adiciona pergunta ao final da lista

**Resultado:** Nova pergunta disponível nos registros.

---

### UC012: Editar Pergunta Existente
**Ator:** Usuário  
**Descrição:** O usuário modifica uma pergunta (incluindo padrões).  
**Fluxo Principal:**
1. Usuário acessa Settings > Customize Questions
2. Usuário seleciona pergunta
3. Usuário modifica textos ou tipo
4. Usuário toca em "Save"
5. Sistema atualiza pergunta

**Resultado:** Pergunta atualizada em futuros registros.

---

### UC013: Reordenar Perguntas
**Ator:** Usuário  
**Descrição:** O usuário altera a ordem das perguntas.  
**Fluxo Principal:**
1. Usuário acessa Settings > Customize Questions
2. Usuário arrasta perguntas para nova posição
3. Sistema salva nova ordem automaticamente

**Resultado:** Perguntas aparecem na nova ordem nos registros.

---

### UC014: Excluir Pergunta
**Ator:** Usuário  
**Descrição:** O usuário remove uma pergunta personalizada.  
**Fluxo Principal:**
1. Usuário acessa Settings > Customize Questions
2. Usuário seleciona pergunta
3. Usuário toca em "Delete"
4. Sistema exibe confirmação
5. Usuário confirma
6. Sistema remove pergunta

**Resultado:** Pergunta removida de futuros registros.

---

### UC015: Restaurar Perguntas Padrão
**Ator:** Usuário  
**Descrição:** O usuário retorna às 10 perguntas originais.  
**Fluxo Principal:**
1. Usuário acessa Settings > Customize Questions
2. Usuário toca em "Reset to Default"
3. Sistema exibe confirmação
4. Usuário confirma
5. Sistema restaura perguntas originais

**Resultado:** Perguntas padrão restauradas.

---

## 5. Visualização de Histórico / History Viewing

### UC016: Visualizar Calendário Mensal
**Ator:** Usuário  
**Descrição:** O usuário vê registros e sessões em formato de calendário.  
**Fluxo Principal:**
1. Usuário acessa aba History
2. Sistema exibe calendário do mês atual
3. Dias com registros/sessões aparecem destacados
4. Usuário pode navegar entre meses (setas)
5. Usuário toca em dia para ver detalhes

**Resultado:** Calendário visual com indicadores de atividade.

---

### UC017: Visualizar Lista de Registros
**Ator:** Usuário  
**Descrição:** O usuário vê registros em formato de lista cronológica.  
**Fluxo Principal:**
1. Usuário acessa aba History
2. Usuário toca em "List" no toggle
3. Sistema exibe lista de registros (mais recentes primeiro)
4. Cada item mostra: data, hora, preview de respostas
5. Usuário toca em item para ver detalhes

**Resultado:** Lista cronológica de todos os registros.

---

## 6. Estatísticas e Progresso / Statistics and Progress

### UC018: Visualizar Estatísticas Gerais
**Ator:** Usuário  
**Descrição:** O usuário vê estatísticas consolidadas de sua prática.  
**Fluxo Principal:**
1. Usuário acessa aba Progress
2. Sistema exibe cards com:
   - Dias consecutivos (streak)
   - Total de meditações
   - Minutos totais meditados
   - Concentração média
3. Usuário pode alternar período (Semana/Mês/Ano)

**Resultado:** Estatísticas consolidadas exibidas.

---

### UC019: Visualizar Gráfico de Frequência
**Ator:** Usuário  
**Descrição:** O usuário vê gráfico de barras com frequência de meditações.  
**Fluxo Principal:**
1. Usuário acessa aba Progress
2. Sistema exibe gráfico de barras:
   - Semana: 7 dias
   - Mês: 4 semanas
   - Ano: 12 meses
3. Cada barra mostra quantidade de meditações

**Resultado:** Gráfico visual de frequência.

---

### UC020: Visualizar Gráfico de Concentração
**Ator:** Usuário  
**Descrição:** O usuário vê evolução da concentração ao longo do tempo.  
**Fluxo Principal:**
1. Usuário acessa aba Progress
2. Sistema exibe gráfico de linha com média de concentração
3. Usuário pode alternar período (Semana/Mês/Ano)

**Resultado:** Gráfico de tendência de concentração.

---

## 7. Configurações e Personalização / Settings and Customization

### UC021: Configurar Lembretes Diários
**Ator:** Usuário  
**Descrição:** O usuário agenda notificações diárias para meditar.  
**Fluxo Principal:**
1. Usuário acessa Settings > Reminders
2. Usuário ativa toggle de lembretes
3. Usuário seleciona horário
4. Sistema solicita permissão de notificações (primeira vez)
5. Sistema agenda notificação diária

**Resultado:** Notificação diária agendada no horário escolhido.

---

### UC022: Alterar Tema/Cor do App
**Ator:** Usuário  
**Descrição:** O usuário escolhe um dos 6 temas iOS 26 Liquid Glass.  
**Fluxo Principal:**
1. Usuário acessa Settings > Appearance
2. Sistema exibe 6 opções de tema:
   - Purple (padrão)
   - Blue
   - Green
   - Orange
   - Pink
   - Clear
3. Usuário seleciona tema
4. Sistema aplica cores e ícone correspondente imediatamente

**Resultado:** Interface e ícone atualizados com novo tema.

---

### UC023: Exportar Dados
**Ator:** Usuário  
**Descrição:** O usuário exporta todos os registros em JSON.  
**Fluxo Principal:**
1. Usuário acessa Settings
2. Usuário toca em "Export Data"
3. Sistema gera JSON com todos os registros
4. Sistema copia para clipboard
5. Sistema exibe confirmação

**Resultado:** Dados copiados para área de transferência.

---

## 8. Identificação de Dispositivo / Device Identification

### UC024: Coletar Device ID
**Ator:** Sistema  
**Descrição:** Sistema identifica dispositivo para analytics.  
**Fluxo Principal:**
1. Usuário abre app pela primeira vez
2. Sistema tenta obter ID nativo:
   - iOS: IosIdForVendor
   - Android: AndroidId
3. Se não disponível, gera UUID
4. Sistema salva ID localmente
5. Sistema associa ID a todos os registros

**Resultado:** Device ID coletado e armazenado.

---

## 9. Tela Inicial / Home Screen

### UC025: Visualizar Status Diário
**Ator:** Usuário  
**Descrição:** O usuário vê resumo do dia atual na tela inicial.  
**Fluxo Principal:**
1. Usuário abre o app
2. Sistema exibe:
   - Saudação (Bom dia/tarde/noite)
   - Data atual
   - Ícone de lótus temático
   - Status: "Meditação registrada" ou "Nenhuma meditação hoje"
   - Streak atual
   - Total do mês
3. Botões de ação: Log Meditation e Timer

**Resultado:** Resumo diário exibido com ações rápidas.

---

### UC026: Ver Registros Recentes
**Ator:** Usuário  
**Descrição:** O usuário vê últimas 3 meditações na tela inicial.  
**Fluxo Principal:**
1. Usuário rola tela inicial
2. Sistema exibe seção "Recent Entries"
3. Lista mostra até 3 registros mais recentes
4. Cada item mostra: data, hora, preview
5. Usuário toca para ver detalhes

**Resultado:** Acesso rápido aos registros recentes.

---

## 10. Persistência de Dados / Data Persistence

### UC027: Salvar Dados Localmente
**Ator:** Sistema  
**Descrição:** Todos os dados são salvos no dispositivo usando AsyncStorage.  
**Fluxo Principal:**
1. Usuário realiza ação (criar registro, alterar configuração, etc.)
2. Sistema atualiza estado em memória
3. Sistema salva no AsyncStorage:
   - @meditary/entries
   - @meditary/sessions
   - @meditary/questions
   - @meditary/settings
   - @meditary/deviceId
4. Dados persistem entre sessões

**Resultado:** Dados salvos localmente sem necessidade de internet.

---

### UC028: Carregar Dados ao Iniciar
**Ator:** Sistema  
**Descrição:** App carrega todos os dados salvos ao abrir.  
**Fluxo Principal:**
1. Usuário abre o app
2. Sistema carrega de AsyncStorage:
   - Registros de meditação
   - Sessões de timer
   - Perguntas personalizadas
   - Configurações (idioma, tema)
   - Device ID
3. Sistema popula interface com dados carregados

**Resultado:** App restaurado com todos os dados anteriores.

---

## Resumo de Funcionalidades

**Total de Casos de Uso:** 28

**Categorias:**
- Gerenciamento de Idioma: 1
- Registro de Meditação: 4
- Timer de Meditação: 5
- Personalização de Perguntas: 5
- Visualização de Histórico: 2
- Estatísticas e Progresso: 3
- Configurações: 3
- Identificação de Dispositivo: 1
- Tela Inicial: 2
- Persistência de Dados: 2

**Tecnologias:**
- React Native + Expo SDK 54
- TypeScript 5.9
- AsyncStorage (armazenamento local)
- Expo Audio (sons de sino/gongo)
- Expo Haptics (feedback tátil)
- Expo Notifications (lembretes)
- Expo Application (device ID)
- React Native Reanimated (animações)
- React Native SVG (gráficos)

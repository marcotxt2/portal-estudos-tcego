---
feature: cronometro-pomodoro
status: auditada
created_at: 2026-09-09
updated_at: 2026-09-09
---

# Especificacao: Cronometro com Pausa/Retomada e Metodo Pomodoro Nativo

## Contexto e Objetivo
O Portal de Estudos possui atualmente um relogio simples no cabecalho que contabiliza o tempo transcorrido desde o inicio da sessao. No entanto, o estudante nao consegue pausar e retomar a contagem durante intervalos (o que distorce as horas liquidas de estudo) e nao dispoe de uma ferramenta estruturada de gerenciamento de tempo.

Esta funcionalidade adiciona controle de pausa/retomada ao cronometro continuo e introduz o modo de estudo Pomodoro nativo com contagem regressiva, alternancia automatica entre blocos de foco e descansos, alertas visuais/sonoros e contador de ciclos concluidos no dia.

---

## Historias de Usuario

### US-030 - Pausa e retomada do cronometro de sessao
Como estudante, quero pausar e retomar o cronometro de estudo livre a qualquer momento, para que apenas o tempo efetivamente dedicado ao estudo seja contabilizado no meu dia.

### US-031 - Modo Pomodoro nativo com blocos de foco e descansos
Como estudante, quero alternar para o modo Pomodoro com contagem regressiva e etapas de foco e descanso (curto e longo), para estruturar sessoes de estudo com foco sustentavel e evitar esgotamento cognitivo.

### US-032 - Persistencia de estado de tempo e ciclos diarios
Como estudante, quero que o estado do cronometro (tempo acumulado, estado pausado/ativo, ciclo pomodoro e contagem de ciclos concluidos) persista entre recargas de pagina (F5) e durante a navegacao entre abas, resetando apenas na virada da meia-noite ou por encerramento manual.

---

## Criterios de Aceite

### AC-061 - Controle de pausa e retomada no cronometro livre
- **Dado** que o usuario esta com o cronometro livre ativo no cabecalho,
- **Quando** clica no botao "Pausar",
- **Entao** o cronometro congela o tempo acumulado no segundo atual, o botao muda para "Retomar" e o estado pausado e salvo no localStorage.
- **E Quando** clica no botao "Retomar",
- **Entao** a contagem volta a incrementar a partir do tempo liquido salvo sem saltos temporais.

### AC-062 - Alternador de modo de tempo no cabecalho
- **Dado** que o usuario esta visualizando o cabecalho,
- **Quando** clica no seletor de modo ("Livre" ou "Pomodoro"),
- **Entao** a interface do cronometro alterna entre a contagem progressiva de sessao e o timer regressivo do Pomodoro, mantendo os estados internos de ambos preservados.

### AC-063 - Ciclos e temporizacao automatica do Pomodoro
- **Dado** que o modo Pomodoro esta ativo com duracoes padroes (25 min de foco, 5 min de pausa curta e 15 min de pausa longa a cada 4 ciclos),
- **Quando** o estudante inicia um ciclo de foco,
- **Entao** o timer realiza contagem regressiva no formato MM:SS.
- **E Quando** a contagem atinge 00:00,
- **Entao** um alerta sonoro e visual sutil e emitido via Web Audio API, o contador de pomodoros concluidos e incrementado e o sistema transiciona e inicia automaticamente a contagem regressiva do proximo bloco (pausa curta ou pausa longa).
- **E Quando** o bloco de pausa chega a 00:00,
- **Entao** o alerta soa novamente e a contagem regressiva do proximo bloco de foco e iniciada automaticamente.

### AC-064 - Controles manuais de execucao do Pomodoro (Play, Pause e Avancar)
- **Dado** que um bloco do Pomodoro esta em andamento,
- **Quando** o usuario clica em pausar,
- **Entao** a contagem regressiva congela no segundo corrente.
- **E Quando** o usuario clica em avancar/pular etapa,
- **Entao** o sistema interrompe o bloco atual e transiciona imediatamente para o proximo estagio de estudo/pausa, iniciando a contagem de forma continua.

### AC-065 - Contador diario de ciclos de Pomodoro concluidos
- **Dado** que o estudante completa um ciclo de foco de 25 min,
- **Quando** o timer atinge 00:00,
- **Entao** o contador de ciclos diarios exibe a quantidade atualizada (ex: "3/4 pomodoros") e o valor e mantido no localStorage ate a virada do dia.

### AC-066 - Encerramento manual e virada de dia
- **Dado** que o usuario clica em "Encerrar" ou acessa o portal em uma nova data (apos 00:00),
- **Quando** a verificacao de data ou o clique ocorre,
- **Entao** o tempo acumulado e a contagem de pomodoros sao zerados para iniciar a contagem da nova jornada.

---

## Suposicoes

- **ASM-027** - `status: confirmada` - Todo o controle de contagem, pausa e transicao do Pomodoro e gerenciado no frontend via React Context (`TimerContext`) e persistido no `localStorage`, sem necessidade de alteracao de banco ou endpoints de backend nesta etapa.
- **ASM-028** - `status: confirmada` - O alerta sonoro de conclusao de cada bloco do Pomodoro e gerado sinteticamente pela Web Audio API nativa do navegador (beeps suaves), dispensando o carregamento de arquivos externos de midia.

---

## Decisoes Tomadas

- **Q-032** - Os tempos de foco, pausa curta e pausa longa devem ser fixos ou customizaveis? **Decisao: valores padroes fixos (25m foco, 5m pausa curta, 15m pausa longa), projetados com constantes desacopladas para permitir configuracao futura.** Impacta o criterio de aceite (AC-063).
- **Q-033** - A transicao entre foco e descanso deve ser automatica ou exigir play manual? **Decisao: transicao 100% automatica ao zerar o cronometro, emitindo o alerta sonoro e iniciando imediatamente a contagem regressiva do bloco seguinte.** Impacta o criterio de aceite (AC-063) e o criterio de aceite (AC-064).

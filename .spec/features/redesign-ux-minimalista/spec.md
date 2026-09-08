---
feature: redesign-ux-minimalista
status: auditada
created_at: 2026-09-07
---

# Redesign UX Minimalista + Melhorias de Infraestrutura

## Contexto

O portal atualmente utiliza Tailwind com estilos utilitarios espalhados, um layout funcional
porem nao refinado visualmente. O fluxo de upload aceita apenas um PDF por vez, nao persiste
o estado do relogio entre recargas, exibe feedbacks de erro genericos para falhas da API Gemini,
e qualquer atualizacao de estado exige F5 manual. Esta feature enderea todos esses pontos com
uma unica entrega coesa.

---

## Historias de Usuario

### US-006 - Estetica minimalista inspirada no Resend (utilizar skill uiux-designer)

**Como** usuario do portal,
**Quero** uma interface limpa, monocromatica e tipograficamente refinada,
**Para que** o foco recaia sobre o conteudo de estudo, sem distracao visual.

### US-007 - Barras de progresso uteis e informativas

**Como** usuario fazendo upload de PDF,
**Quero** ver uma barra de progresso que reflete etapas reais (upload, chunking, analise por chunk, conclusao),
**Para que** eu saiba exatamente o que esta acontecendo sem precisar dar F5.

### US-008 - Atualizacoes em tempo real sem reload

**Como** usuario do portal,
**Quero** que novos modulos e conteudos aparecam na sidebar automaticamente apos um upload concluir,
**Para que** eu nao precise recarregar a pagina para ver o resultado.

### US-009 - Relogio de sessao persistente

**Como** usuario estudando,
**Quero** que o contador de tempo de sessao nao seja resetado ao apertar F5,
**Para que** meu tempo de estudo acumulado no dia seja registrado corretamente.

### US-010 - Upload de multiplos PDFs simultaneamente

**Como** usuario administrando materiais,
**Quero** selecionar e enviar varios arquivos PDF de uma vez para a mesma materia, sem limite imposto pelo sistema,
**Para que** eu nao precise repetir o processo de upload individualmente.

### US-011 - Tratativa granular de erros da API Gemini

**Como** usuario que fez upload de um PDF,
**Quero** ver mensagens de erro especificas e acionaveis quando a IA falha,
**Para que** eu entenda o que aconteceu e saiba o que fazer.

---

## Criterios de Aceite

### AC-009 - Design system com toggle light/dark mode

**Dado** que o portal esta aberto,
**Quando** o usuario visualiza qualquer pagina,
**Entao** a interface deve suportar dois temas alternados por um toggle no Header:

**Tema escuro (default):**
- background #09090b, superficie #111113, borda #27272a, texto primario #fafafa, texto secundario #71717a

**Tema claro:**
- background #ffffff, superficie #f4f4f5, borda #e4e4e7, texto primario #09090b, texto secundario #71717a

**Ambos os temas:**
- Fonte Inter (Google Fonts) para todo o corpo e titulos
- Cor de destaque unica: #2563eb para elementos ativos/primarios
- Nenhum gradiente decorativo
- Espacamentos generosos (padding minimo de 24px entre secoes)
- Nenhum emoji como icone; todos os icones devem ser SVG inline (Lucide ou Heroicons)
- Transicoes de 150ms ease em hover states
- Responsivo em 375px, 768px, 1024px e 1440px
- Preferencia do tema persiste no localStorage (chave: theme_preference)

### AC-010 - Barra de progresso de upload com etapas reais

**Dado** que o usuario iniciou um upload de PDF,
**Quando** o backend esta processando,
**Entao** a interface deve exibir por arquivo:
- Etapa 1 "Enviando arquivo": barra animada indeterminada enquanto o POST esta em transito
- Etapa 2 "Preparando chunks": logo apos o backend receber (status pending)
- Etapa 3 "Analisando com IA (X/Y chunks)": barra determinada proporcional a processed_chunks/total_chunks (status processing)
- Etapa 4 "Extracao concluida": barra 100% verde ao atingir status completed
- Polling de status a cada 3 segundos sem intervencao do usuario

### AC-011 - Sidebar atualiza automaticamente apos upload concluir

**Dado** que um upload atingiu status completed,
**Quando** o frontend detecta a conclusao via polling,
**Entao** a lista de modulos na sidebar deve ser re-buscada via fetchModules() sem que o usuario precise dar F5

### AC-012 - Relogio de sessao do dia atual persiste entre recargas (localStorage)

**Dado** que o usuario acessa o portal em um determinado dia,
**Quando** um contador de tempo de sessao for exibido no Header,
**Entao**:
- O tempo refere-se exclusivamente a sessao do dia atual (nao ao historico acumulado de todos os dias)
- O tempo e armazenado no localStorage com a chave session_start_timestamp (epoch em ms do primeiro acesso do dia)
- Ao recarregar a pagina no mesmo dia, o relogio retoma do tempo ja acumulado, nao do zero
- A meia-noite (virada de dia), o relogio reseta automaticamente para 00:00:00
- O relogio pode ser resetado manualmente por um botao "Encerrar sessao" no Header

### AC-013 - Upload de multiplos PDFs sem limite imposto pelo sistema

**Dado** que o usuario esta na aba de upload,
**Quando** ele selecionar multiplos arquivos (input multiple, sem atributo de limite) ou arrastar varios PDFs,
**Entao**:
- O sistema nao impora nenhum limite de quantidade de arquivos simultaneos
- Cada arquivo gera uma tarefa de upload independente com seu proprio task_id
- A interface exibe uma lista de cards, um por arquivo, com nome, barra de progresso e status individual
- O backend recebe cada arquivo em uma requisicao POST separada (disparadas em paralelo via Promise.all ou semelhante)
- Se um arquivo falhar, os demais continuam sendo processados normalmente

### AC-014 - Dropzone com drag-and-drop para PDFs

**Dado** que o usuario esta na aba de upload,
**Quando** ele arrastar arquivos PDF sobre a area designada,
**Entao** a area de drop deve ter feedback visual (borda destacada em azul durante drag-over) e soltar os arquivos inicia o fluxo identico ao de selecao via input

### AC-015 - Mensagens de erro Gemini granulares e acionaveis

**Dado** que o backend retorna status error em uma tarefa de upload,
**Quando** o error_message contem indicadores de erros conhecidos,
**Entao** o frontend deve exibir mensagens amigaveis mapeadas:
- RESOURCE_EXHAUSTED ou 429 -> "Cota da IA esgotada. Aguarde alguns minutos e tente novamente."
- 503 ou UNAVAILABLE -> "Servico da IA temporariamente indisponivel. Tente novamente em instantes."
- PDF vazio ou corrompido -> "O arquivo PDF parece estar vazio ou corrompido. Verifique e tente novamente."
- 404 ou modelo nao encontrado -> "Modelo de IA configurado nao encontrado. Contate o administrador."
- Qualquer outro erro -> "Erro inesperado: [mensagem original truncada a 120 caracteres]."

### AC-016 - Backend: sem alteracao de endpoint necessaria para upload multiplo

**Dado** que o frontend envia multiplas requisicoes POST /modules/upload/ em paralelo,
**Quando** cada requisicao contem um unico arquivo,
**Entao** o backend processa cada uma de forma independente (comportamento atual ja suporta; AC documenta a decisao de nao criar endpoint batch dedicado)

### AC-017 - Cabecalho minimalista com toggle de tema e relogio

**Dado** que o usuario esta no portal,
**Quando** o cabecalho e exibido,
**Entao** ele deve conter:
- Nome "Portal TCE-GO" em texto bold (fonte Inter)
- Toggle de tema claro/escuro com icone SVG (sol/lua)
- O relogio de sessao do dia (AC-012) alinhado a direita
- Altura maxima de 56px
- Linha divisoria sutil (border-bottom: 1px solid com a cor de borda do tema ativo)
- Nenhum elemento decorativo desnecessario

---

## Suposicoes

- **ASM-008** - `status: confirmada` - O frontend usa React + Vite + Tailwind. A refatoracao sera feita ajustando classes Tailwind e o index.css com o novo design system, sem trocar de stack.
- **ASM-009** - `status: confirmada` - O backend nao precisa de alteracoes estruturais para upload multiplo. Cada arquivo e enviado em POST separados e paralelos pelo frontend (confirmado em AC-016).
- **ASM-010** - `status: confirmada` - O localStorage e suficiente para persistir o timestamp de inicio da sessao e a preferencia de tema.
- **ASM-011** - `status: confirmada` - Os tipos de erro da API Gemini sao identificados por substrings no campo error_message sem necessidade de codigos estruturados no backend (mapeados em AC-015).

---

## Decisoes Tomadas

- **Q-007** - O relogio deve exibir o tempo do dia atual ou historico acumulado? **Decisao: tempo do dia atual, reseta a meia-noite, persiste entre F5s no mesmo dia.** Impacta AC-012.
- **Q-008** - Deve haver limite de arquivos no upload multiplo? **Decisao: sem limite imposto pelo sistema, o usuario controla a quantidade.** Impacta AC-013.
- **Q-009** - O tema escuro e definitivo ou deve ter toggle? **Decisao: implementar toggle light/dark mode, preferencia persiste no localStorage.** Impacta AC-009 e AC-017.

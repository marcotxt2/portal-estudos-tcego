---
status: auditada
---

# Feature: Navegacao Continua no Banco de Questoes

Refatorar o `BancoQuestoes.jsx` para eliminar o modelo de cards recolhidos e o conceito residual de "Sessao". O usuario visualiza diretamente as questoes abertas em um visualizador dedicado (`QuestionViewer`), navegando sequencialmente pela lista filtrada com botoes "Anterior" e "Proxima", sem sessoes, cronometros ou telas intermediarias.

## Historias de Usuario

- **US-022**: Como estudante, quero que ao aplicar um filtro no Banco de Questoes as questoes apareçam diretamente abertas e prontas para resposta, sem precisar clicar em cada card para expandi-lo.
- **US-023**: Como estudante, quero navegar entre as questoes filtradas com botoes "Anterior" e "Proxima", vendo o indicador "Questao X de N" do total filtrado, para ter controle claro do progresso na lista.
- **US-024**: Como estudante, quero que ao alterar qualquer filtro (Materia, Topicos, Busca textual, Apenas erros) a fila de questoes seja reiniciada automaticamente a partir da questao 1 da nova listagem.
- **US-025**: Como estudante, quero que o sistema nao exiba mensagens, telas ou cronometros de "Sessao Concluida" em nenhuma circunstancia dentro do Banco de Questoes.

## Criterios de Aceite

- **AC-036** (Questao Aberta por Padrao com QuestionViewer Dedicado):
  - **Dado** que apliquei um filtro e cliquei em "Aplicar",
  - **Quando** os resultados carregarem,
  - **Entao** a primeira questao da lista deve ser exibida diretamente aberta (enunciado + alternativas + badges de materia/topico) atraves de um componente dedicado `QuestionViewer`, sem necessidade de expandir cards.

- **AC-037** (Navegacao Sequencial com Contador e Pulo Livre):
  - **Dado** que estou visualizando uma questao aberta,
  - **Quando** existir uma proxima questao na lista filtrada,
  - **Entao** o botao "Proxima" deve estar habilitado mesmo que a questao atual nao tenha sido respondida (permitindo pular), e ao clicar deve exibir a questao subsequente, mantendo o indicador "Questao X de N" atualizado.

- **AC-038** (Navegacao "Anterior"):
  - **Dado** que estou na questao X (onde X > 1),
  - **Quando** eu clicar em "Anterior",
  - **Entao** o sistema deve exibir a questao X-1 da lista filtrada e atualizar o contador.

- **AC-039** (Fim da Lista Filtrada):
  - **Dado** que estou na ultima questao da lista filtrada,
  - **Quando** eu visualizar os controles de navegacao,
  - **Entao** o botao "Proxima" deve estar desabilitado com indicativo claro de fim de lista ("Fim das questoes filtradas"), mantendo a questao visivel e o botao "Anterior" disponivel.

- **AC-040** (Reinicio ao Alterar Filtros):
  - **Dado** que estou em qualquer questao da lista filtrada,
  - **Quando** eu alterar qualquer filtro (Materia, Topicos, Busca textual ou Apenas erros) e aplicar,
  - **Entao** a nova lista deve ser carregada e o ponteiro deve ser redefinido para a questao 1 da nova listagem.

- **AC-041** (Eliminacao Total de Sessoes):
  - **Dado** que estou no Banco de Questoes,
  - **Quando** eu navego por todas as questoes,
  - **Entao** nenhuma mensagem de "Sessao Concluida", tela intermediaria, contagem de "questoes de hoje" ou cronometro deve ser exibido.

- **AC-042** (Feedback Imediato e Persistencia da Resposta):
  - **Dado** que seleciono uma alternativa em uma questao,
  - **Quando** a resposta for computada,
  - **Entao** o sistema deve exibir imediatamente o feedback visual (correta/incorreta) e a explicacao sem mudar de questao automaticamente, salvar a tentativa no backend (`UserProgress`), e manter o estado preservado caso o usuario navegue via "Anterior" e "Proxima".

## Suposicoes

- **ASM-021** - `confirmada` - Criar o componente isolado `QuestionViewer.jsx` desacoplado de `QuestionsTab.jsx` e do contexto de sessoes, eliminando riscos de regressao.
- **ASM-022** - `confirmada` - Gerenciamento de estado de respostas atrelado a gravacao via endpoint de progresso existente e memoria local para historico de navegacao fluida.

## Decisoes Tomadas

- **Q-025** - Criar componente dedicado ou refatorar QuestionsTab? **Decisao: Criar um QuestionViewer dedicado e enxuto exclusivo para o Banco de Questoes, desacoplando 100% de sessoes.** Impacta AC-036 e AC-041.
- **Q-026** - Persistencia no backend ou apenas useState? **Decisao: Salvar no backend (UserProgress) a cada resposta e manter no estado local para permitir revisao ao voltar via "Anterior".** Impacta AC-042.
- **Q-027** - Obrigacao de responder antes de avancar? **Decisao: Permitir navegar livremente para a proxima questao a qualquer momento, sem obrigatoriedade de resposta.** Impacta AC-037.
- **Q-028** - Feedback e transicao de tela? **Decisao: Mostrar feedback imediato (verde/vermelho + explicacao) na questao atual e so avancar quando o usuario clicar em "Proxima".** Impacta AC-042.

## Perguntas em Aberto

- Nenhuma.

# Tasks: Navegacao Continua no Banco de Questoes

#### [concluida] T-045 - Criar QuestionViewer.jsx
- Refs: AC-036, AC-037, AC-038, AC-039, AC-041, AC-042
- Arquivos: frontend/src/components/QuestionViewer.jsx
- Esforco: medio
- Criar componente puro que recebe via props: `question`, `questionIndex`, `totalQuestions`, `savedAnswer`, `onAnswer`, `onNext`, `onPrevious`, `isFirst`, `isLast`. Renderizar enunciado, alternativas com getOptionStyle, badge de IA, botao "Confirmar" (desaparece apos confirmacao), feedback verde/vermelho + explicacao ao confirmar, botoes "Anterior"/"Proxima" com disabled correto e contador "Questao X de N". Sem useContext, sem sessionStorage, sem qualquer referencia a sessao.

#### [concluida] T-046 - Refatorar BancoQuestoes.jsx para navegacao continua
- Refs: AC-036, AC-037, AC-038, AC-039, AC-040, AC-041, AC-042
- Arquivos: frontend/src/components/BancoQuestoes.jsx
- Esforco: medio
- Substituir o map de cards recolhidos pelo QuestionViewer. Adicionar estados: `currentIndex` (number, inicia 0), `answers` (objeto { [questionId]: { selectedOption, showResult } }). Implementar callbacks: `handleAnswer(questionId, selectedOption, isCorrect)` que atualiza `answers` localmente e chama `submitAnswer` do api.js; `handleNext` e `handlePrevious` que incrementam/decrementam `currentIndex`. Em `handleFilterChange`, resetar `currentIndex` para 0 apos setar a nova lista. Remover a importacao de `QuestionsProvider` e `expandedId`. Passar `savedAnswer={answers[question.id] ?? null}` para QuestionViewer. Remover importacao de QuestionsProvider e QuestionsTab.

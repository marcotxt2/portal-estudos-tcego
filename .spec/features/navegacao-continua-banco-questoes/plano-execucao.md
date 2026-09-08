# Plano de Execucao: Navegacao Continua no Banco de Questoes

## Contexto Tecnico

A feature elimina o modelo de cards recolhidos do `BancoQuestoes.jsx` e o uso de `QuestionsContext` por instancia avulsa. Cria um componente dedicado `QuestionViewer.jsx` com estado proprio, navegacao sequencial e persistencia de respostas via `submitAnswer`.

O `QuestionsTab.jsx` e o `QuestionsContext.jsx` **nao sao tocados** — permanecem intactos para nao gerar risco de regressao.

---

## Decisoes Arquiteturais

### 1. Novo Componente: `QuestionViewer.jsx`

Componente puro de apresentacao + interacao para uma unica questao. Recebe via props:

```
QuestionViewer({
  question,          // objeto da questao atual
  questionIndex,     // indice (0-based) na lista filtrada
  totalQuestions,    // total da lista filtrada
  savedAnswer,       // { selectedOption, showResult } | null
  onAnswer,          // callback(questionId, selectedOption, isCorrect)
  onNext,            // callback()
  onPrevious,        // callback()
  isFirst,           // bool
  isLast,            // bool
})
```

Responsabilidades internas:
- Renderizar enunciado, alternativas, badge de IA.
- Exibir feedback (verde/vermelho + explicacao) apos confirmacao.
- Botao "Confirmar" -> desaparece apos confirmacao.
- Botoes "Anterior" / "Proxima" com estados corretos de disabled.
- Mini-contador "Questao X de N" no topo.

Sem `useContext`, sem `sessionStorage`, sem logica de sessao.

### 2. Refatoracao de `BancoQuestoes.jsx`

Estado gerenciado localmente:

```js
const [questions, setQuestions]       // lista filtrada atual
const [currentIndex, setCurrentIndex] // ponteiro na lista
const [answers, setAnswers]           // { [questionId]: { selectedOption, showResult } }
```

Fluxo `onAnswer`:
1. Atualiza `answers[questionId]` localmente.
2. Chama `submitAnswer(questionId, selectedOption, isCorrect)` do `api.js` — endpoint ja existente.

Fluxo `onFilterChange`:
1. Chama `fetchFilteredQuestions(params)`.
2. Seta `questions` com o resultado.
3. Reseta `currentIndex` para `0`.
4. Nao reseta `answers` — respostas de sessao anteriores sao mantidas no mapa por `questionId`.

### 3. Backend

Nenhuma alteracao de backend necessaria. O endpoint `POST /api/answers/` ja existe e ja e chamado pelo `submitAnswer` em `api.js`.

---

## Modelo de Dados do Estado Local

```
answers: {
  [questionId: number]: {
    selectedOption: string | null,
    showResult: boolean
  }
}
```

Gerenciado em `useState` dentro de `BancoQuestoes.jsx`. Nao persiste entre recarregamentos de pagina (intencional — sessao atual apenas).

---

## Arquivos Impactados

| Arquivo | Acao |
|---|---|
| `frontend/src/components/QuestionViewer.jsx` | NOVO |
| `frontend/src/components/BancoQuestoes.jsx` | MODIFICAR |
| `QuestionsTab.jsx`, `QuestionsContext.jsx`, `api.js` | SEM ALTERACAO |

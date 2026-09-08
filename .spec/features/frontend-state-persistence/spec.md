---
feature: frontend-state-persistence
status: auditada
created_at: 2026-09-07
---

# Persistência de Estado no Frontend (Tab Switching)

## Contexto

Atualmente, no `App.jsx`, a navegação por abas é feita renderizando os componentes condicionalmente (ex: `{activeTab === 'upload' && <UploadTab />}`). Isso faz com que o React aplique o "unmount" dos componentes ao sair da aba, destruindo todos os estados locais (`useState`) e limpando os timers (`setInterval`).
O objetivo desta feature é refatorar a gestão de estado do Upload e do Progresso das Questões (Context API) para que a interface não perca a memória nem os processos em background ao alternar entre as telas, persistindo inclusive em recargas da página (F5) usando storage do navegador.

---

## Histórias de Usuário

### US-012 - Manutenção do status de upload em background
**Como** usuário do portal,
**Quero** que os meus uploads de PDF continuem processando e tendo seu progresso atualizado (polling) mesmo se eu mudar para outra aba ou der F5 (para uploads já enviados à API),
**Para que** eu possa continuar meus estudos na aba de Teoria sem ter que esperar olhando a barra de carregamento.

### US-013 - Continuidade da sessão de questões
**Como** estudante resolvendo questões,
**Quero** que a questão em que estou (índice, opção selecionada e resultado) seja lembrada pelo frontend mesmo após recarregar a página ou mudar de aba,
**Para que** eu não perca o fluxo de estudo caso eu troque de aba rapidamente para consultar uma teoria.

---

## Critérios de Aceite

### AC-018 - Persistência do estado de Upload via Context e LocalStorage
**Dado** que o usuário iniciou o upload de um ou mais PDFs na aba "Upload PDF",
**Quando** ele alternar para outra aba e depois voltar, ou recarregar a página (F5),
**Então** a fila de upload (`uploadQueue`) deve continuar exibindo os cards com seus progressos (para os uploads cujo `taskId` já foi gerado e salvo no localStorage). Arquivos ainda em estado de `uploading` (sem taskId) serão perdidos no F5 por restrições do navegador (objetos File não são persistíveis).

### AC-019 - Polling de status independente da interface
**Dado** que há uploads em andamento (status pending ou processing),
**Quando** o componente `UploadTab` for desmontado,
**Então** o loop de verificação (setInterval) deve rodar centralizado no `UploadContext`, garantindo que o status atinja 100% (completed) e dispare a atualização da sidebar silenciosamente. Ao recarregar a página (F5), o contexto deve restaurar os taskIds do storage e reiniciar o polling.

### AC-020 - Preservação do progresso de Questões (Storage e Context)
**Dado** que o usuário respondeu ou está prestes a responder uma questão na aba "Questões",
**Quando** ele alternar de aba ou recarregar a página (F5),
**Então** a tela deve retomar do exato ponto em que ele parou (preservando `currentIndex`, `selectedOption` e `showResult` no `sessionStorage`/`localStorage`), mantendo o gabarito na tela até que o usuário clique em "Próxima".

### AC-021 - Atualização dos testes automatizados (TDD)
**Dado** que a arquitetura dos estados foi alterada,
**Quando** a suíte de testes unitários do frontend for executada,
**Então** os testes de `UploadTab.test.jsx`, `QuestionsTab.test.jsx` e `App.test.jsx` devem rodar com sucesso absoluto (Exit 0), utilizando wrappers para o `UploadContext` e `QuestionsContext`.

---

## Suposições

- **ASM-012** - `status: invalidada` - O `App.jsx` manter as props seria verboso. O usuário decidiu utilizar Context API. Portanto, isolaremos as responsabilidades em `UploadContext` e `QuestionsContext`.
- **ASM-013** - `status: invalidada` - Assumiu-se que o escopo era apenas em memória (SPA), mas o usuário exigiu persistência em caso de F5, adotando `localStorage`/`sessionStorage` para manter a experiência blindada.

---

## Decisoes Tomadas

- **Q-010** - Qual padrão arquitetural devemos adotar para o estado global? **Decisao: Criar arquivos de Contexto (Context API) para manter o App.jsx mais limpo.** Impacta AC-018, AC-019, AC-020 e AC-021.
- **Q-011** - Comportamento da aba Questões ao sair durante a exibição do gabarito: **Decisao: Manter na tela do gabarito até que o usuário clique em "Próxima".** Impacta AC-020.

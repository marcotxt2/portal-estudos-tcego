---
status: auditada
---

# Feature: Fim das Sessões e Foco no Banco de Questões (Pivot)

## Histórias de Usuário

- **US-019**: Como estudante, não quero mais ter o conceito de "Sessões Diárias" ou "Sessões por Módulo". Quero uma experiência inteiramente guiada pelos meus próprios filtros, onde eu escolho o tópico que quero estudar e resolvo uma pilha de questões disponíveis para esse tópico.
- **US-020**: Como usuário, quero que a interface reflita essa simplicidade, não exibindo mais a barra lateral de módulos, e que a aba "Banco de Questões" (com os filtros de matéria e tópico) seja a tela principal e padrão do aplicativo.
- **US-021**: Como usuário do modo escuro, quero que os menus de seleção (dropdowns) tenham contraste legível, para que eu possa ler e selecionar as matérias sem dificuldade.

## Critérios de Aceite

- **AC-033** (Fim das Sessões e Sidebar):
  - **Dado** que acesso o aplicativo,
  - **Quando** a interface principal carregar,
  - **Então** o sistema não deve mais buscar nem exibir as sessões diárias ou por módulo. A sidebar lateral com a lista de módulos (PDFs) deve ser completamente removida de todas as abas.

- **AC-034** (Nova Tela Principal e Filtros):
  - **Dado** que acesso a aplicação,
  - **Quando** ela carregar,
  - **Então** a aba "Banco de Questões" deve ser a aba ativa por padrão. O conteúdo deve ocupar toda a largura disponível. Ao escolher a matéria e os tópicos e clicar em "Aplicar", uma "pilha" contendo todas as questões correspondentes deve ser carregada e exibida na tela. A aba antiga "Questões" deve ser descontinuada.

- **AC-035** (Contraste no Modo Escuro - FilterPanel):
  - **Dado** que estou utilizando o tema escuro (Dark Mode),
  - **Quando** eu abrir qualquer `select` (ex: selecionar Matéria) no `FilterPanel`,
  - **Então** as opções (options) devem possuir texto e fundo com contraste adequado.

## Suposições

- **ASM-020** - `confirmada` - As rotas de backend `/session/daily` e `/session/module/{id}` não são mais úteis na interface. Contudo, manteremos o acompanhamento de progresso (`UserProgress`) e a lógica de "Revisão Reversa", já que revisar o que se errou continua sendo central.

## Decisões Tomadas

- **Q-023** - Como ocultar a sidebar no Banco de Questões? **Decisão: Apenas ocultar a sidebar com uma condicional no JSX. É mais rápido e a tela ocupará naturalmente a largura restante do container principal.** Impacta AC-033.
- **Q-024** - Como resolver o contraste do `<select>` no modo escuro? **Decisão: Adicionar CSS explícito fixando a cor de fundo e texto das opções e garantir o `color-scheme` correto no CSS global.** Impacta AC-034.

## Perguntas em Aberto

- Nenhuma.

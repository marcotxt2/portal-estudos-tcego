---
status: auditada
---

# Feature: Melhorias UX - Explicacao na Revisao Reversa, Filtro de Questoes Respondidas, Perfis de Usuario e Preto AMOLED

Agrupa quatro melhorias independentes com impacto direto na experiencia de estudo: (1) botao "Explicacao" com toggle inline na Revisao Reversa; (2) filtro para ocultar questoes ja respondidas no Banco de Questoes; (3) perfis de usuario com autenticacao por senha simples (sem restricoes de seguranca avancadas), script CLI para criacao; (4) fundo AMOLED #000000 no dark mode.

## Historias de Usuario

- **US-026**: Como estudante que usa a Revisao Reversa, quero ver um botao "Explicacao" em cada questao errada, para entender o raciocinio correto sem precisar sair da tela de revisao.
- **US-027**: Como estudante que responde o Banco de Questoes repetidamente, quero ativar uma opcao "Nao mostrar questoes ja respondidas" na tela de filtros, para praticar apenas questoes que ainda nao tentei.
- **US-028**: Como usuario da instancia VPS, quero selecionar meu perfil na tela de login e entrar com uma senha simples, para que eu e meu amigo possamos estudar com historico de progresso separado no mesmo servidor.
- **US-029**: Como usuario que estuda pelo celular a noite, quero que o fundo do sistema (dark mode) seja preto absoluto (#000000), para economizar bateria em telas OLED e reduzir o brilho ao maximo.

## Criterios de Aceite

### US-026 - Botao "Explicacao" na Revisao Reversa

- **AC-043** (Botao visivel por questao):
  - **Dado** que estou na aba "Revisao Reversa" e existe ao menos uma questao errada listada,
  - **Quando** eu visualizar o card de uma questao errada,
  - **Entao** deve haver um botao "Explicacao" abaixo do gabarito correto em cada card, com icone SVG e texto legivel, respeitando target minimo de toque de 44x44px.

- **AC-044** (Conteudo da explicacao identico ao QuestionViewer):
  - **Dado** que clico no botao "Explicacao" de uma questao na Revisao Reversa,
  - **Quando** o painel expandir abaixo do gabarito (toggle inline),
  - **Entao** o texto exibido deve ser exatamente o mesmo campo explanation retornado pela API para aquela questao, identico ao que aparece na secao "Por que esta e a resposta?" do QuestionViewer.

- **AC-045** (Comportamento toggle inline):
  - **Dado** que clico em "Explicacao" e o painel ja esta expandido,
  - **Quando** clico novamente no botao,
  - **Entao** o painel deve colapsar (toggle expand/collapse), sem abrir modal ou navegar para outra pagina.

- **AC-046** (Estado de ausencia de explicacao):
  - **Dado** que uma questao nao possui campo explanation preenchido (nulo ou string vazia),
  - **Quando** o card for renderizado na Revisao Reversa,
  - **Entao** o botao "Explicacao" nao deve ser exibido nesse card especifico.

### US-027 - Filtro "Nao mostrar questoes ja respondidas"

- **AC-047** (Controle de filtro visivel na UI):
  - **Dado** que estou na tela do Banco de Questoes,
  - **Quando** eu visualizar o painel de filtros,
  - **Entao** deve existir um toggle ou checkbox com o rotulo "Nao mostrar questoes ja respondidas" dentro do painel de filtros, posicionado abaixo dos filtros de Materia/Topico, com label clicavel e area de toque minima de 44x44px.

- **AC-048** (Filtro aplicado na consulta ao backend):
  - **Dado** que ativo o toggle "Nao mostrar questoes ja respondidas" e clico em "Aplicar",
  - **Quando** o backend receber a requisicao de listagem de questoes,
  - **Entao** a API deve excluir da resposta todas as questoes que possuam ao menos uma tentativa registrada em user_progress para o usuario autenticado atual (via user_id no JWT), retornando apenas questoes sem historico de resposta.

- **AC-049** (Estado persistido na sessao):
  - **Dado** que ativo o toggle e navego entre as questoes,
  - **Quando** eu retornar ao painel de filtros sem recarregar a pagina,
  - **Entao** o toggle deve permanecer no estado ativado, sem reset ao valor padrao.

- **AC-050** (Mensagem quando todas as questoes ja foram respondidas):
  - **Dado** que o filtro esta ativo e o usuario ja respondeu todas as questoes do conjunto filtrado,
  - **Quando** a listagem retornar vazia,
  - **Entao** o sistema deve exibir a mensagem "Parabens! Voce respondeu todas as questoes deste filtro." em lugar do visualizador de questoes, com um botao "Limpar filtro" que desativa o toggle e recarrega o conjunto completo.

### US-028 - Perfis de Usuario (Multi-usuario)

- **AC-051** (Modelo de dados: tabela users):
  - **Dado** que a feature e implantada,
  - **Quando** o banco de dados for migrado,
  - **Entao** deve existir a tabela users com os campos: id (PK), username (unico, obrigatorio), password_hash (bcrypt, obrigatorio), display_name (opcional), created_at. Sem campo is_admin na primeira versao.

- **AC-052** (Migracao: user_id em user_progress):
  - **Dado** que a tabela users existe,
  - **Quando** a migracao for executada,
  - **Entao** a tabela user_progress deve receber a coluna user_id (INT, FK para users.id, nullable para retrocompatibilidade), e todo o historico existente deve ser migrado para o usuario "marco" criado automaticamente durante a migracao.

- **AC-053** (Tela de login com selecao de perfil e senha simples):
  - **Dado** que acesso o sistema sem sessao ativa (sem JWT no localStorage),
  - **Quando** a aplicacao carregar,
  - **Entao** deve ser exibida uma tela de login com campo "Usuario" (ou dropdown com os perfis cadastrados), campo "Senha" e botao "Entrar". A senha pode ser simples (ex: "123") sem restricao de complexidade. A tela segue o padrao visual do sistema (fundo #000000 no dark mode, fonte Inter).

- **AC-054** (Autenticacao JWT):
  - **Dado** que submeto usuario e senha validos na tela de login,
  - **Quando** o backend validar as credenciais via bcrypt,
  - **Entao** o sistema deve retornar um JWT com expiracao de 7 dias, armazena-lo em localStorage, e redirecionar o usuario para a tela principal do portal.

- **AC-055** (Logout):
  - **Dado** que estou autenticado,
  - **Quando** eu clicar no meu nome/avatar na interface e selecionar "Sair",
  - **Entao** o JWT deve ser removido do localStorage e o usuario deve ser redirecionado para a tela de login.

- **AC-056** (Isolamento de progresso por usuario):
  - **Dado** que dois usuarios (ex: "marco" e "amigo") estao cadastrados,
  - **Quando** cada um responder questoes,
  - **Entao** o user_progress de cada um deve ser completamente isolado pelo user_id: questoes erradas, acertos e o filtro de "ja respondidas" de um nao deve influenciar os dados do outro.

- **AC-057** (Criacao inicial de usuarios via script CLI):
  - **Dado** que a feature e implantada na VPS,
  - **Quando** precisar criar ou redefinir a senha de um usuario,
  - **Entao** deve existir um script create_user.py no backend que aceita username e password como argumentos (ex: python create_user.py marco 123) e cria o usuario no banco com hash bcrypt.

### US-029 - Preto AMOLED (dark mode apenas)

- **AC-058** (Variavel CSS --color-bg no dark mode):
  - **Dado** que o tema escuro esta ativo,
  - **Quando** qualquer elemento de fundo principal for renderizado,
  - **Entao** a variavel --color-bg deve ter o valor #000000 (substituindo o atual #09090b no dark mode do index.css). O light mode permanece inalterado.

- **AC-059** (Cards e superficies elevadas):
  - **Dado** que o fundo base e #000000,
  - **Quando** cards, paineis e modais forem exibidos,
  - **Entao** esses elementos de superficie devem usar #0d0d0d ou #111111 para criar hierarquia visual sem comprometer o efeito AMOLED, garantindo contraste WCAG AA minimo de 4.5:1 em todos os textos.

- **AC-060** (Consistencia global no dark mode):
  - **Dado** que o fundo AMOLED e aplicado,
  - **Quando** navego por todas as abas (Banco de Questoes, Revisao Reversa, Upload PDF) e pela tela de login,
  - **Entao** nenhuma area de fundo deve exibir tom de cinza escuro perceptivel em display OLED. O light mode permanece inalterado.

## Suposicoes

- **ASM-023** - confirmada - O campo explanation ja existe no modelo Question do backend (models.py linha 32) e e retornado pela API. O QuestionViewer ja o consome (QuestionViewer.jsx linha 118).
- **ASM-024** - confirmada como risco real - O UserProgress e completamente anonimo hoje (sem user_id). A implementacao de perfis exige migracao de banco e refatoracao dos endpoints que consomem user_progress.
- **ASM-025** - confirmada - O frontend usa variavel CSS centralizada --color-bg (index.css linha 19). A mudanca AMOLED e uma alteracao de uma linha.
- **ASM-026** - confirmada - A tela de Revisao Reversa ja busca os dados de cada questao errada com o campo explanation disponivel.

## Decisoes Tomadas

- **Q-029** - Como exibir a explicacao na Revisao Reversa? **Decisao: Toggle inline no card (expand/collapse abaixo do gabarito), sem modal.** Impacta AC-044 e AC-045.
- **Q-030** - Como criar usuarios na VPS? **Decisao: Script CLI create_user.py com username e password como argumentos. Senha simples sem restricao de complexidade (pode ser "123"). Sem painel admin na UI.** Impacta AC-053 e AC-057.
- **Q-031** - AMOLED afeta light mode? **Decisao: Apenas dark mode. Light mode permanece inalterado.** Impacta AC-058 e AC-060.
- **Ordem de implementacao** - Todas as quatro features em uma unica feature branch, implementadas sequencialmente: AMOLED -> Explicacao Revisao Reversa -> Filtro respondidas -> Perfis de usuario.

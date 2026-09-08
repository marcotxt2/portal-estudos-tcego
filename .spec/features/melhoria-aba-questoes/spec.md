---
status: auditada
---

# Melhoria na Aba de Questões

## Histórias de Usuário

### US-014 - Navegação livre e barra de progresso numérica
Como estudante, durante o bloco de questões, quero poder navegar livremente entre as questões respondidas, puladas ou pendentes através de botões (Anterior/Próxima) e de uma barra de paginação inferior (com números das questões coloridos conforme acerto/erro), para revisar o que já foi feito sem perder o contexto.

### US-015 - Explicação das alternativas
Como estudante, após responder uma questão, quero ver uma breve explicação do porquê a alternativa que selecionei (se estiver errada) está incorreta, e o porquê da correta estar certa, para poder aprender imediatamente com meu erro de forma assertiva.

## Critérios de Aceite

### AC-022 - Navegação via Paginação Inferior
- **Dado** que o usuário está na aba de Questões
- **Quando** ele visualiza o rodapé
- **Então** ele deve ver os botões "Anterior" e "Próxima", acompanhados de uma paginação numérica (ex: 1, 2, 3, 4, 5) representando a lista de questões da sessão.
- **E** as questões já respondidas devem estar coloridas de verde (certa) ou vermelho (errada), e a questão atual deve estar destacada.
- **E** ao clicar em um número, ele deve ser levado diretamente para aquela questão.

### AC-023 - Persistência do estado das respostas na navegação
- **Dado** que o usuário respondeu a questão 1 e avançou para a 2
- **Quando** ele clica no botão "Anterior" ou no número "1" na paginação
- **Então** a questão 1 deve ser exibida no estado de "respondida", mantendo as alternativas que ele marcou e exibindo os gabaritos/explicações sem permitir que ele altere a resposta original. (A persistência de estado será feita transformando o estado do `QuestionsContext` em um dicionário de respostas da sessão).

### AC-024 - Estrutura de dados para explicações (Backend)
- **Dado** que a inteligência artificial (Gemini) processa os slides
- **Quando** ela extrai uma nova questão
- **Então** o JSON gerado deve incluir um campo `explanation` que contém uma breve justificativa para a alternativa correta e também para as demais alternativas.
- **E** esse campo deve ser persistido no banco de dados, retornando na chamada GET de questões.

### AC-025 - Exibição da explicação dinâmica
- **Dado** que o usuário confirma a resposta de uma questão
- **Quando** o gabarito é revelado
- **Então** um bloco de "Explicação" deve surgir abaixo das alternativas.
- **E** esse bloco deve exibir por que a alternativa selecionada está errada (se for o caso) e por que a alternativa certa é a correta, utilizando os dados vindos do backend. Como o banco será limpo, não é necessário fazer fallbacks para questões antigas sem esse campo.

## Suposições
- **ASM-014** - status: confirmada - Supomos que a adição do campo `explanation` na API do Gemini não ultrapassará os limites de token de saída de forma drástica, mantendo a estabilidade das requisições.

## Decisoes Tomadas
- **Q-012** - O banco de dados atual não possui a coluna `explanation`. Como tratar as questões antigas? **Decisao: O banco do docker será limpo (resetado) e essas questões antigas serão ignoradas. A interface não precisa de fallback complexo.** Impacta AC-025.
- **Q-013** - No contexto global de navegação (QuestionsContext), devemos transformar o estado em um dicionário que armazena todas as respostas? **Decisao: Sim.** Impacta AC-023.

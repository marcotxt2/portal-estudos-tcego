---
status: auditada
---

# Feature: Pesquisas e Filtros de Questões por Matéria e Conteúdo

## Histórias de Usuário

- **US-017**: Como estudante, preciso pesquisar e filtrar as questões por "Matéria" (ex: Engenharia de Software, Banco de Dados) e "Conteúdo" (ex: Microsserviços, SQL), para focar meu estudo exatamente nos tópicos do edital em que tenho mais deficiência ou que preciso revisar.
- **US-018**: Como estudante, quero que as matérias e conteúdos das questões na base estejam alinhados com a estrutura do edital (Cargo B02 – TCE-GO), facilitando o rastreamento do progresso.

## Critérios de Aceite

- **AC-028** (Filtros na Interface):
  - **Dado** que estou na tela do dashboard diário ou na nova página separada de "Banco de Questões",
  - **Quando** abro os filtros,
  - **Então** devo ver um seletor de "Matéria" (ex: Segurança da Informação) e um seletor de múltipla escolha para "Conteúdo" dependente da matéria escolhida.

- **AC-029** (Resolução Direcionada e Sessão Avulsa):
  - **Dado** que configurei filtros específicos (ex: Matéria = "Engenharia de Software", Conteúdo = "UML" e "BPMN"),
  - **Quando** eu aplicar esses filtros,
  - **Então** o sistema deve me apresentar unicamente as questões correspondentes, seja restringindo o Bloco de Questões atual no dashboard ou iniciando uma sessão avulsa no Banco de Questões.

- **AC-030** (Classificação na Extração e Integridade - Backend):
  - **Dado** que o pipeline de ingestão processa os PDFs de questões novas,
  - **Quando** extrair o conteúdo via Gemini,
  - **Então** o sistema deve categorizar a questão e salvá-la no banco referenciando a nova tabela de domínios `contents` (que estará pré-cadastrada com os tópicos do edital), garantindo a integridade dos dados. As questões antigas sem essa classificação não serão processadas retroativamente.

- **AC-031** (Busca Textual e Combinação de Filtros):
  - **Dado** que desejo pesquisar termos específicos,
  - **Quando** eu digitar na barra de busca,
  - **Então** devo conseguir combinar essa busca de texto livre no enunciado/opções com os filtros de Matéria, Conteúdo (múltiplos) e estado (ex: "apenas as que eu errei").

- **AC-032** (Compatibilidade com Revisão Reversa):
  - **Dado** que estou no Bloco de Revisão (focado nas questões que errei com correção didática),
  - **Quando** eu aplicar filtros de Matéria e Conteúdo (ex: revisar erros apenas de "Banco de Dados"),
  - **Então** o fluxo de Revisão Reversa deve respeitar perfeitamente o filtro, apresentando teoria e resolução reversa unicamente para as questões que atendem a esses parâmetros.

## Suposições

- **ASM-016** - `status: confirmada` - A categorização das matérias e conteúdos será instruída diretamente no prompt de ingestão do Gemini para arquivos novos, baseada na lista do edital.
- **ASM-017** - `status: confirmada` - Precisaremos criar uma nova tabela `contents` no banco de dados e referenciá-la na tabela `questions`, garantindo a integridade ao invés de usar strings livres.

## Decisões Tomadas

- **Q-017** - Os valores devem ser strings livres ou tabela fixa? **Decisão: Criar uma nova tabela `contents` (Domínio/Enum) pré-cadastrada com todos os tópicos do edital e referenciá-la na tabela `questions` (garante integridade).** Impacta AC-030.
- **Q-018** - Os filtros serão usados em Sessão Avulsa ou na grade diária? **Decisão: Ambas as opções: no dashboard diário haverá um botão "Filtrar" e também uma página separada de Banco de Questões.** Impacta AC-028 e AC-029.
- **Q-019** - Deseja busca por "Texto Livre"? **Decisão: Quero os seletores e também uma barra de busca por texto livre (full-text search no enunciado/opções).** Impacta AC-031.
- **Q-020** - O filtro por "Conteúdo" precisa ser de múltipla escolha? **Decisão: Quero poder selecionar múltiplos conteúdos de uma vez (ex: revisar "UML" e "BPMN" juntos).** Impacta AC-028 e AC-031.
- **Q-021** - Em termos de usabilidade, página separada ou dashboard? **Decisão: Ambas as opções (respondido na Q-018).** Impacta AC-028.
- **Q-022** - Rodar script de enriquecimento nas questões antigas? **Decisão: Não precisa, vamos lidar apenas com os PDFs novos daqui pra frente.** Impacta AC-030.

---
status: em-implementacao
---

# Feature: Melhoria na Extração e Exibição de Conteúdo

## Histórias de Usuário
- **US-001**: Como usuário, quero que as questões contidas nos PDFs sejam extraídas corretamente mesmo que não tenham o gabarito logo em seguida, para que eu possa resolver listas de exercícios na plataforma.
- **US-002**: Como usuário, quero ver as teorias e questões extraídas do banco de dados na minha tela de sessão de estudos diária, para que eu saiba que o conteúdo foi processado e eu possa estudar.
- **US-003**: Como usuário, quero acessar cada matéria (disciplina) de forma independente, em "páginas" separadas, para que eu possa focar meus estudos em uma disciplina por vez.

## Critérios de Aceite
- **AC-001** (Extração de Questões): 
  - Dado que eu envio um PDF de questões,
  - Quando o Gemini processa o texto,
  - Então a questão deve ser salva no banco de dados. Caso o PDF contenha questões de Certo/Errado (C/E) ou Múltipla Escolha (A, B, C, D, E), o formato deve ser suportado.
  - E se o gabarito não estiver visível próximo à questão, a própria IA deve determinar a resposta correta e incluir uma marcação/aviso indicando que o gabarito foi "Gerado pela IA".
- **AC-002** (Exibição da Teoria):
  - Dado que existem teorias no banco de dados para o módulo da sessão atual,
  - Quando eu abro a aba "Teoria" na plataforma,
  - Então o texto markdown da teoria deve ser exibido corretamente na tela.
- **AC-003** (Obrigatoriedade de Fluxo End-to-End):
  - Dado que a extração insere uma teoria ou questão no banco,
  - Quando a plataforma solicita a sessão do dia (`/api/session/today`),
  - Então o backend deve retornar o conteúdo recém inserido para que a interface não fique em branco.
- **AC-004** (Navegação por Matérias):
  - Dado que o sistema possui as matérias do edital carregadas,
  - Quando eu acesso a plataforma,
  - Então deve existir uma forma de navegar/clicar individualmente em cada matéria listada (ex: "Banco de Dados", "Engenharia de Software"), abrindo um contexto apenas para ela.

## Suposições
- **ASM-001**: O modelo do banco de dados para `questions` (`correct_option VARCHAR(1) NOT NULL`) precisará ser modificado para aceitar valores maiores ou ser flexibilizado, e precisaremos adicionar um campo (ou flag no JSON) para indicar se o gabarito foi gerado por IA. Status: *confirmada*.
- **ASM-002**: As teorias não estão aparecendo na plataforma hoje porque o endpoint `/api/session/today` ou o componente `TheoryTab.jsx` possuem um filtro que não está trazendo os registros que constam no banco. Status: *confirmada*.
- **ASM-003**: As 7 matérias fornecidas serão cadastradas como "Módulos" (tabela `modules`) e a interface precisará de um Menu lateral ou Dashboard para listá-las separadamente. Status: *confirmada*.

## Decisões Tomadas
- **Q-001**: Permitir questões sem gabarito? **Decisão: Todas as questões têm gabarito no material, mas se a IA não achar logo em seguida, ela mesma deve determinar a resposta correta e informar que foi a IA que resolveu.** Impacta AC-001.
- **Q-002**: Letras não lidas pelo OCR? **Decisão: O OCR lê as letras, mas algumas questões são de Certo/Errado (C/E) e não de A a E. O prompt da IA deve ser ajustado para suportar os dois formatos.** Impacta AC-001.
- **Q-003**: Páginas separadas por matéria? **Decisão: Sim, o usuário clicará na matéria no menu e abrirá um contexto isolado com Upload, Teoria e Questões só daquela matéria.** Impacta AC-004.

## Apêndice: Matérias Listadas
As páginas deverão contemplar as 7 matérias abaixo:
1. Governança de TI e Contratações TIC
2. Engenharia de Software e Desenvolvimento
3. Segurança da Informação
4. Sistemas Operacionais, Redes e Nuvem
5. IA, Ciência de Dados e Automação
6. Banco de Dados (Relacional, NoSQL, Vetorial)
7. Língua Inglesa (Leitura Técnica)

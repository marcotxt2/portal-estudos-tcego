---
status: auditada
---

# Feature: Portal de Estudos Pessoal (TCE-GO)

## Histórias de Usuário (US)

- **US-001**: Como usuário, preciso de um sistema isolado em contêineres Docker, hospedado na minha VPS local, para garantir que o ambiente seja replicável, de fácil manutenção e desvinculado dos demais serviços.
- **US-002**: Como usuário, quero um pipeline de ingestão de dados que leia PDFs de slides de um diretório local e extraia o conteúdo (teoria e questões) através da API do Gemini, salvando-os de forma estruturada no PostgreSQL, para automatizar a criação da base de conhecimento.
- **US-003**: Como estudante, quero acessar um dashboard diário otimizado para celular (tema AMOLED), dividido em 3 blocos de tempo (Teoria: 30m, Questões: 90m, Revisão: 30m), exibindo conteúdo específico baseado no dia da semana, para garantir a disciplina de estudo nos exatos 150 minutos disponíveis diários.
- **US-004**: Como estudante, durante o bloco de questões, quero resolver questões no formato "flashcard/tinder" (uma por tela, avanço automático e cômputo silencioso do resultado), para maximizar a velocidade de resolução sem quebrar o fluxo.
- **US-005**: Como estudante, durante a revisão, quero visualizar rapidamente apenas as questões que errei, junto ao bloco teórico exato que justifica a resposta (correção reversa didática), para focar a correção e aprender com as falhas.

## Critérios de Aceite (AC)

- **AC-001** (Estrutura e Infraestrutura):
  - Dado que o projeto será inicializado,
  - Quando os contêineres subirem (`docker compose up`),
  - Então deve haver pelo menos 3 serviços em execução e comunicáveis entre si: PostgreSQL, FastAPI (backend) e Vite (frontend).
- **AC-002** (Ingestão de Dados e Retentativas):
  - Dado que há um PDF válido organizado dentro da subpasta de sua respectiva matéria em `/extractor/input_pdfs/<nome_da_materia>/`,
  - Quando o script `pdf_to_db.py` for executado,
  - Então o conteúdo deve ser enviado ao Google Gemini, processado com lógica de retentativas automáticas em caso de erro da API, e salvo estruturado nas tabelas do banco de dados, vinculando as questões ao módulo da pasta correspondente.
- **AC-003** (Grade Diária - Backend):
  - Dado que o usuário solicita o `GET /daily-session` em uma terça-feira,
  - Quando a API processar o pedido,
  - Então ela deve retornar a teoria e questões do módulo de "Governança de TI e Contratações", priorizando questoes erradas anteriormente (spaced repetition).
- **AC-004** (Dashboard e Fluxo de Questões - Frontend):
  - Dado que o usuário está na aba de Questões,
  - Quando ele clica em uma alternativa,
  - Então o frontend avança imediatamente para a próxima questão, disparando a requisição `POST /submit-answer` silenciosamente em background, sem travar a interface e sem mostrar spinners de carregamento longos.
- **AC-005** (Tema e UI):
  - Dado que a interface é renderizada no dispositivo móvel,
  - Quando o usuário navega pelo portal,
  - Então a interface deve exibir fundos em `#000000`, cards em `#121212` e textos em alto contraste (branco/cinza), seguindo o estilo True Black AMOLED sem distrações.
- **AC-006** (Zero Pontas Soltas - Estrutura de Pastas):
  - Dado que a arquitetura do projeto foi gerada,
  - Quando verificarmos os diretórios em `/extractor/input_pdfs`,
  - Então deverá haver pastas separadas destinadas para cada uma das matérias (disciplinas peso 2 do edital), que serão alimentadas com os PDFs a qualquer momento.

## Suposições (ASM)

- **ASM-001**: O modelo `gemini-1.5-flash` é suficiente para estruturar o texto, considerando que as requisições possivelmente retornarão JSON estruturado perfeitamente. Status: `confirmada` (Manteremos como base, com fallback manual ou refino de prompt se necessário).
- **ASM-002**: Como o sistema é para uso pessoal (único usuário), o sistema não necessita de login complexo, sessões ou JWT. Um `user_id` fixo no banco ou na API é suficiente. Status: `confirmada` (A estrutura unifocal atende perfeitamente ao requisito "pessoal").
- **ASM-003**: Os PDFs a serem processados contêm texto legível nativamente, permitindo a extração com `pypdf`/`pdfplumber`. Status: `confirmada` (A lógica de ingestão focará primeiramente em PDFs textuais ou com camada de texto).

## Decisoes Tomadas

- **Q-001** - Como devemos lidar com erros da API do Gemini? **Decisao: O script de extracao implementara logica de retentativas (retry) automaticas.** Impacta AC-002.
- **Q-002** - Os modulos ja virao separados em PDFs individuais ou o Gemini vai adivinhar? **Decisao: Ja virao separados em pastas exclusivas para cada materia de TI previstas no edital (Engenharia de Software, DevOps, Banco de Dados, IA, Seguranca, etc).** Impacta AC-002 e AC-006.
- **Q-003** - Podemos considerar a estrutura de pastas esqueleto gerada hoje como final? **Decisao: A estrutura base sim, mas deve-se ter as pastas filhas ja destinadas para cada materia dentro de input_pdfs, para que sejam alimentadas.** Impacta AC-006.

---

### Anexo: Disciplinas/Matérias Mapeadas (Edital TCE-GO - TI)
Para criação do esqueleto e separação de conteúdos, as seguintes matérias estão confirmadas para receberem pastas dedicadas:
1. Engenharia de Software
2. Desenvolvimento de Sistemas
3. Engenharia de Software Assistida por Inteligência Artificial
4. DevOps e Plataforma de Desenvolvimento
5. Banco de Dados
6. Inteligência Artificial e Ciência de Dados
7. Segurança da Informação
8. Sistemas Operacionais, Redes e Computação em Nuvem
9. Governança de Tecnologia da Informação
10. Legislação Aplicada à Tecnologia da Informação
11. Língua Inglesa (Leitura Técnica)
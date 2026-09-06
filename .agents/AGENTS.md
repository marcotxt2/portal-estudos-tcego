# Regras do Projeto Portal de Estudos TCE-GO (Workspace Rules)

## Estilo de Comunicação e Código
- Respostas diretas, curtas e sem rodeios.
- Nunca utilize emojis no chat, documentações, mensagens de commit ou pull requests.

## Autonomia e Implantação (Nível Máximo)
- O agente possui **autonomia total** para gerenciar o ambiente de desenvolvimento, criar repositórios, gerenciar Git, executar scripts, criar pastas e configurar o Docker localmente.
- O agente deve tomar a iniciativa de realizar as configurações de infraestrutura permitidas pelo terminal (ex: comandos `docker-compose`, `git`, `gh`) de forma proativa.
- Alterações no ambiente de produção (VPS) devem priorizar automação via CI/CD (GitHub Actions). Caso o usuário exija e forneça chaves/SSH, o agente tem permissão para realizar o deploy com autonomia.

## Otimização de Tokens
- **Respostas Concisas**: Respostas diretas e curtas. Evitar explicações linha a linha do código, a menos que explicitamente solicitado.
- **Leitura Focada**: Utilizar limites de linha (`StartLine` e `EndLine`) ao ler arquivos longos.
- **Diffs Focados**: Manter alterações pequenas e focadas exclusivamente na tarefa solicitada.

## Fluxo de Trabalho (Projeto Pessoal)
- Como este é um projeto pessoal de usuário único, o agente tem autonomia para commitar e realizar pushes diretos na branch `master`/`main` sempre que uma feature (ou etapa do esqueleto) for finalizada, desde que alinhado com o usuário.

## Escopo End-to-End nas Especificações (Zero Pontas Soltas)
- Ao projetar, arquitetar ou especificar uma nova demanda, o agente deve **obrigatoriamente** mapear e incluir o fluxo de entrada (input/criação) desse dado.
- **Regra de Ouro**: "Se um dado sai, ele precisa entrar." Nunca deixe pontas soltas limitando o escopo apenas à visualização; inclua todo o ciclo desde a extração pelo Gemini até o armazenamento no banco.

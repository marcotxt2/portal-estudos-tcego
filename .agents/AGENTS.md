# Regras do Projeto TurnoLivre (Workspace Rules)

## Sincronização de Skills e Presets do Jira
- Sempre que uma nova skill for criada, adicionada ou modificada dentro do diretório `.agents/skills/`, o agente deve obrigatoriamente executar a skill `/preset-updater` (ou atualizar diretamente o ticket de PRESET no Jira via MCP no chamado **TUR-78**) para manter o catálogo do Jira sempre sincronizado com os arquivos e descrições reais das skills disponíveis.

## Estilo de Comunicação e Código
- Respostas diretas, curtas e sem rodeios.
- Nunca utilize emojis no chat, documentações, mensagens de commit, pull requests ou tickets/comentários do Jira.

## Implantação e Produção
- ESTRITAMENTE PROIBIDO executar qualquer comando, script, SQL, reinicialização de container, reset de banco de dados ou alteração direta via SSH no ambiente de produção (VPS).
- Qualquer alteração de código, banco ou configuração deve ser realizada obrigatoriamente no ambiente local, testada, commitada e implantada exclusivamente via pipeline automatizado (Git / GitHub Actions / CI-CD).
- O agente NUNCA deve tocar na VPS de produção por conta própria. Toda e qualquer ação de infraestrutura ou banco na VPS deve ser executada exclusivamente pelo USUÁRIO no seu próprio terminal.

## Otimização de Tokens
- **Respostas Concisas**: Respostas diretas e curtas. Evitar explicações linha a linha do código, a menos que explicitamente solicitado.
- **Leitura Focada**: Utilizar limites de linha (`StartLine` e `EndLine`) ao ler arquivos e não ler arquivos irrelevantes sem necessidade.
- **Diffs Focados**: Manter alterações pequenas e focadas exclusivamente na tarefa solicitada via `replace_file_content`.
- **Execução Restrita de Comandos**: Não executar comandos de terminal automaticamente se produzirem saídas extensas ou verbosas (ex: testes completos). Restringir a testes individuais ou saídas sumarizadas.

## Fluxo de Code Review e Pull Requests
- ESTRITAMENTE PROIBIDO criar Pull Requests automaticamente no GitHub (ex: usar `gh pr create` ou a skill `submit-pr`) por conta própria ao finalizar tarefas.
- A criação de Pull Requests e a submissão final do código remoto só devem ser realizadas **exclusivamente** quando o USUÁRIO solicitar e autorizar expressamente no chat.

## Escopo End-to-End nas Especificações (Zero Pontas Soltas)
- Ao projetar, arquitetar ou especificar um ticket/feature que consome ou exibe novos dados, o agente deve **obrigatoriamente** mapear e incluir na especificação o fluxo de entrada (input/criação) desse dado.
- **Regra de Ouro**: "Se um dado sai, ele precisa entrar." Nunca deixe pontas soltas limitando o escopo apenas à visualização; inclua as telas de formulário, migrações de banco e fluxos de captura relevantes.

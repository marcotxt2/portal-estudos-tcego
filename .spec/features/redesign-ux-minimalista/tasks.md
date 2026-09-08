# Tasks: redesign-ux-minimalista

---

#### [concluida] T-024 - Testes TDD: ThemeContext e Header (Tema e Relogio)
- Refs: AC-009, AC-012, AC-017
- Arquivos: frontend/test/ThemeContext.test.jsx, frontend/test/Header.test.jsx
- Esforco: medio
- Implementar testes automatizados cobrindo o contexto de tema, integracao do toggle no Header e a persistencia do relogio usando localStorage com o mock do Date e setInterval.

---

#### [concluida] T-025 - Testes TDD: UploadTab (Dropzone, Fila, Polling e Erros)
- Refs: AC-010, AC-013, AC-014, AC-015
- Arquivos: frontend/test/UploadTab.test.jsx
- Esforco: alto
- Implementar testes para a dropzone, multiplos arquivos (mockando FileList e FormData), mockando as chamadas a api.js para testar as etapas da barra de progresso (pending, processing, completed) e o mapeamento de mensagens de erro especificas.

---

#### [concluida] T-026 - Testes TDD: App.jsx (Sidebar reativa)
- Refs: AC-011
- Arquivos: frontend/test/App.test.jsx
- Esforco: baixo
- Testar a integracao de onUploadComplete entre UploadTab e App.jsx para confirmar recarregamento silencioso (sem reload) das disciplinas.

---

#### [concluida] T-027 - Testes TDD: Backend (Validacao de isolamento de upload)
- Refs: AC-016
- Arquivos: backend/tests/test_upload_batch.py
- Esforco: baixo
- Escrever teste no pytest validando o isolamento das tarefas (enviando varios requests POST para /modules/upload/ garantindo tasks separadas).

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { test, expect } from 'vitest';

// @spec:AC-005
test('Tema e UI deve conter True Black e cores específicas no Tailwind config', () => {
  const tailwindConfigPath = path.resolve(__dirname, '../tailwind.config.js');
  const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
  
  // Atualizado para AC-009: usa variaveis em vez de hardcoded colors
  expect(configContent).toContain("var(--color-bg)");
  expect(configContent).toContain("var(--color-surface)");
});

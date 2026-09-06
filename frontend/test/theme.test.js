import fs from 'fs';
import path from 'path';
import { test, expect } from 'vitest';

// @spec:AC-005
test('Tema e UI deve conter True Black e cores específicas no Tailwind config', () => {
  const tailwindConfigPath = path.resolve(__dirname, '../tailwind.config.js');
  const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
  
  // Verifica se o background (000000) e card (121212) foram configurados conforme AC-005
  expect(configContent).toContain("#000000");
  expect(configContent).toContain("#121212");
});

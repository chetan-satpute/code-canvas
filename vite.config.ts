import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import codeHighlight from './vite/codeHighlight.ts';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), codeHighlight()],
});

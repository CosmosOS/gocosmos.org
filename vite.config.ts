import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build into html/ — docker-compose mounts ./html as the Apache docroot.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'html',
  },
});

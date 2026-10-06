import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ideamosestudio.github.io',
  base: '/redmix',
  output: 'static',
  vite: {
    build: {
      target: 'es2022',
    },
  },
});

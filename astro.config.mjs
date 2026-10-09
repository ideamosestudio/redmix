import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ideamosestudio.github.io',
  base: '/redmix',
  output: 'static',
  trailingSlash: 'always',
  security: {
    csp: {
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }] },
      directives: ["default-src 'self'", "img-src 'self' data:", "media-src 'self'", "font-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self' mailto:"],
    },
  },
  vite: {
    build: {
      target: 'es2022',
    },
  },
});

import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://redmix.com.ar',
  base: '/',
  output: 'static',
  trailingSlash: 'always',
  security: {
    csp: {
      styleDirective: { resources: ["'self'", { resource: "'unsafe-inline'", kind: "attribute" }] },
      directives: ["default-src 'self'", "img-src 'self' data:", "media-src 'self'", "font-src 'self'", "connect-src 'self' https://mail.redmix.com.ar", "object-src 'none'", "base-uri 'self'", "form-action 'self' https://mail.redmix.com.ar"],
    },
  },
  vite: {
    build: {
      target: 'es2022',
    },
  },
});

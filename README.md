# REDMIX

Sitio estático de Astro para REDMIX Hormigonera. Node 24 LTS y npm 9.6.5 o superior.

## Desarrollo

- npm ci
- npm run dev
- npm run build
- npm run check
- npm run preview
- npm run check:security

## Estructura

- src/pages: home, empresa, contacto y tres servicios.
- src/components/HomeHero.astro: portada fotográfica responsive activa.
- src/layouts/BaseLayout.astro: metadatos, entidad de negocio y política CSP.
- src/reveal.js: animaciones nativas con IntersectionObserver, sin cálculos continuos de scroll.
- src/styles: estilos por componente; polish.css conserva los ajustes visuales aprobados.
- public/llms.txt y public/sitemap.xml: información pública y rutas canónicas. Actualizar junto con contenido y datos de contacto.
- scripts/check-site.mjs: integridad del HTML construido, enlaces internos, metadatos y recursos.

## Publicación y seguridad

GitHub Pages sirve https://redmix.com.ar/ desde la raíz. Después de publicar, GitHub Actions actualiza el repositorio registrado en Git Version Control de cPanel y copia el artefacto a public_html. Consultar docs/deployment.md. El workflow usa npm ci, auditoría y validación antes de publicar. Dependabot revisa dependencias y acciones semanalmente. No se almacenan secretos ni adjuntos de revisión en Git.

El formulario envía consultas a info@redmix.com.ar mediante el endpoint PHP https://mail.redmix.com.ar/api/contact.php alojado en cPanel. Incluye validación del servidor, origen permitido, campo trampa y límites por IP y globales. No hay contraseñas de correo en el frontend ni en Git; el hosting usa su transporte local de correo. Los contadores anónimos se conservan fuera de public_html. CSP permite conexiones únicamente al sitio y al endpoint de correo; los estilos de atributos se permiten para las animaciones. GitHub Pages no permite configurar cabeceras HTTP personalizadas ni políticas de caché: CSP se publica como meta. robots.txt y sitemap.xml se sirven desde la raíz del dominio propio.

llms.txt es un recurso informativo complementario; no garantiza indexación ni menciones por asistentes. La fuente principal sigue siendo el HTML renderizado, la información visible y los datos estructurados coincidentes.

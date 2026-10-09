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
- src/components/HomeHero.astro y src/home-video.js: portada activa. El video espera la carga inicial y se pausa fuera de pantalla, con movimiento reducido o ahorro de datos.
- src/layouts/BaseLayout.astro: metadatos, entidad de negocio y política CSP.
- src/styles: estilos por componente; polish.css conserva los ajustes visuales aprobados.
- public/llms.txt y public/sitemap.xml: información pública y rutas canónicas. Actualizar junto con contenido y datos de contacto.
- scripts/check-site.mjs: integridad del HTML construido, enlaces internos, metadatos y recursos.

## Publicación y seguridad

GitHub Pages sirve /redmix/. El workflow usa npm ci, auditoría y validación antes de publicar. Dependabot revisa dependencias y acciones semanalmente. No se almacenan secretos ni adjuntos de revisión en Git.

El formulario abre el cliente de correo con un mensaje preparado: no existe backend de envío ni almacenamiento de consultas. CSP limita scripts y recursos al propio origen; los estilos de atributos se permiten para las animaciones. GitHub Pages no permite configurar cabeceras HTTP personalizadas ni políticas de caché: CSP se publica como meta. robots.txt de este proyecto vive bajo /redmix/ y no reemplaza el robots.txt de la raíz del dominio compartido.

llms.txt es un recurso informativo complementario; no garantiza indexación ni menciones por asistentes. La fuente principal sigue siendo el HTML renderizado, la información visible y los datos estructurados coincidentes.

# REDMIX — Barlow Semi Condensed y espaciado preciso

## Alcance

Implementación validada localmente y autorizada para publicación por el usuario. Barlow Semi Condensed 600/700 se carga desde `@fontsource/barlow-semi-condensed` (subset Latin, que incluye los caracteres españoles). Esperano, Roboto y Montserrat se conservan. No se modificaron contenidos, destinos de contacto, fotografías, grillas editoriales ajenas a servicios ni JavaScript de producción.

Criterio de entrega indicado por el usuario: cerrar los cambios con commit, push a main, despliegue exitoso en GitHub Pages y comprobación de la URL pública con cache-buster del commit, salvo indicación posterior en contrario. No abrir automáticamente el sitio en el panel derecho.

## Archivos y reglas reemplazadas

- `package.json`, `package-lock.json`: solo se agregó `@fontsource/barlow-semi-condensed` 5.3.0; no se actualizaron otras dependencias.
- `src/layouts/BaseLayout.astro`: imports Latin 600 y 700.
- `src/styles/foundations.css`: tokens `--font-card` y `--font-action`; navegación de 13 px; gutter interpolado y sección de 96 px hasta 1199; sección de 72 px hasta 359. El breakpoint de 1023 sigue controlando header/hero, sin mover sus otras reglas.
- `src/styles/sections.css`: `.service-card h3` pasa de Montserrat / `min-height:3.6em` a Barlow 700 / `2.16em` desde 1200, y sin altura mínima debajo. Se reemplazaron escalas por 30/28/26/24 px; tracking −.015em. Las reglas horizontales de servicios pasan a 1199 sin trasladar reglas de otras grillas. Se quitaron paddings repetidos y overrides de botones; se agregó únicamente padding de 20 px hasta 359.
- `src/styles/buttons.css`: Barlow 600, 14/1.3, tracking .04em; se eliminó el override mobile de tracking. Padding y mínimos estándar/compacto permanecen 16×24 / 56 y 12×20 / 48. `.text-link` adopta la tipografía de acción, conservando su geometría de enlace.
- `src/styles/navigation.css`: Barlow 600 en navegación/CTA; 13 px desktop, 17 px menú, 14 px submenú y presupuesto mobile. Las numeraciones conservan Montserrat y su posición. Gap desktop sin cambios. Presupuesto desktop 12×16 / 48; mobile 16×24 / 56, alineado a izquierda.
- `src/styles/contact.css`: excepción mínima indispensable: el selector de enlaces del footer excluye `.technical-cta`, para no sobrescribir el interlineado 1.3 con 1.6. No se cambió su padding.
- `src/components/ServiceCard.astro`: `sizes` de las mismas imágenes actualizado a 767/1199 para acompañar la composición y evitar resolución insuficiente cerca de 767 px. No cambió el tratamiento visual.
- `scripts/typography-qa.mjs`: mediciones específicas y capturas de servicios, header y menú en doce anchos; comprueba los glifos de Barlow realmente usados por Chromium.
- `scripts/design-qa.mjs`, `scripts/verify-design.mjs`: matriz configurable y regresiones tipográficas de las seis páginas.

## Resultados computados por breakpoint

Todos los valores están en px salvo interlineado y disposición. Cada fila pasó las comprobaciones de tipografía, padding, ritmo, centrado de botones, carga real de fuente y overflow. Las seis páginas se capturaron y comprobaron en cada ancho.

| Ancho | Título / interlineado | Padding tarjeta | Disposición | Gutter | Sección estándar |
| --- | --- | --- | --- | --- | --- |
| 320 | 24 / 1.12 | 20 | vertical | 20 | 72 |
| 360 | 26 / 1.12 | 24 | vertical | 24 | 80 |
| 390 | 26 / 1.12 | 24 | vertical | 24 | 80 |
| 430 | 26 / 1.12 | 24 | vertical | 24 | 80 |
| 767 | 26 / 1.12 | 24 | vertical | 24 | 80 |
| 768 | 28 / 1.10 | 24 | horizontal 1:1.15 | 32 | 96 |
| 1023 | 28 / 1.10 | 24 | horizontal 1:1.15 | 55.6098 | 96 |
| 1024 | 28 / 1.10 | 24 | horizontal 1:1.15 | 55.7024 | 96 |
| 1199 | 28 / 1.10 | 24 | horizontal 1:1.15 | 71.9074 | 96 |
| 1200 | 30 / 1.08 | 24 | tres columnas | 72 | 112 |
| 1440 | 30 / 1.08 | 24 | tres columnas | 86.4 | 112 |
| 1920 | 30 / 1.08 | 24 | tres columnas | 104 | 112 |

### Ritmo y alineación

- Padding inferior de metadatos: 16. Metadatos → título: 24. Caja de título → párrafo: 16. Gap entre botones: 12. Verificados en las tres tarjetas a todos los anchos.
- Párrafo → acciones: 24 en tablet/mobile. En desktop se conserva `margin-top:auto`: la descripción más corta cede espacio flexible para alinear los botones al pie. A 1200/1440 la primera tarjeta tiene 50.39 px efectivos y las otras 24; no se introdujo una altura artificial de párrafo. Es la consecuencia de combinar el margen base de 24 con la alineación inferior solicitada.
- El título más largo ocupa dos líneas a 1200/1440 y una a 1920. No hay recorte ni saltos manuales. Las tres descripciones y zonas de acciones quedan alineadas en desktop.
- El bloque conjunto texto/flecha de los botones está centrado horizontal y verticalmente (tolerancia de subpíxel 0.12 px). No se cambian las animaciones.
- Los saltos 767→768 en composición y 1199→1200 en número de columnas son los solicitados. El gutter 1023→1024 varía solo 0.0926 px.
- Hero, footer y CTA rojo mobile conservan sus excepciones de composición. El CTA rojo mobile sigue con padding vertical de 80 px, también a 320, en lugar de heredar los 72 de una sección estándar.

## Pruebas

- Build Astro: correcto, seis rutas.
- `git diff --check`: correcto; advertencias LF/CRLF no representan errores de whitespace.
- 72 vistas: Home, Quiénes somos, Contacto y tres servicios × doce anchos. Sin overflow horizontal de documento/componentes, imágenes fallidas o errores de consola; WebGL disponible.
- Doce casos tipográficos: fuentes 600/700 cargadas y glifos reales Barlow, Esperano en H1, Roboto en descripciones, Montserrat en metadatos; títulos, proporciones de columnas, mínimos, padding, tracking, interlineado y centrado de CTA verificados.
- 40 aserciones de interacción: menú/foco/Escape, dropdown, hover y active sin saltos, FAQ, validación nativa del formulario, reduced-motion y reanudación de Three.js. No se enviaron formularios ni mensajes reales.
- Capturas y JSON: `C:/Users/avant/.codex/visualizations/2026/10/07/01a11772-c235-7273-a0cc-b0c2e6d27a98/barlow/` (`pages/`, `interactions/`, `typography.json`).

Para reproducir: build y preview en 4322; Chrome headless con CDP en 9224; definir `QA_BASE`, `QA_CDP_PORT`, `QA_OUT` y `QA_WIDTHS=320,360,390,430,767,768,1023,1024,1199,1200,1440,1920`. Ejecutar secuencialmente `typography-qa.mjs`, `design-qa.mjs`, `verify-design.mjs` e `interaction-qa.mjs` (cada uno con su directorio de artefactos apropiado).

## Límites y advertencias

Pruebas en Chromium emulado sobre Windows; no son pruebas físicas de Safari/iOS. El formulario conserva el envío mediante aplicación de correo (`mailto`), sin backend nuevo.

`npm audit` informó tres paquetes con alertas preexistentes: Astro (critical), sharp (high) y esbuild (low). Barlow no figura entre ellos y el lockfile confirma que no se actualizaron esas dependencias. La propuesta automática implica una actualización mayor de Astro; no se aplicó `audit fix --force` fuera del alcance de esta intervención. La evaluación y remediación de esas alertas queda pendiente como tarea separada.

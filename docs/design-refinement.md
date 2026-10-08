# REDMIX — refinamiento local

## Estado y alcance

Intervención sobre el proyecto Astro existente. Se conservaron páginas, imágenes, tipografías, destinos de contacto y símbolo Three.js. El usuario autorizó commit, push a main y publicación tras la verificación local.

## Archivos

- `src/styles.css`: punto de entrada de estilos, sin capas de overrides.
- `src/styles/foundations.css`: fuentes, escala de espaciado, tamaños por rol, gutters y breakpoints.
- `src/styles/buttons.css`: primary, secondary, outline/light, text link, estados de foco y movimiento.
- `src/styles/navigation.css`: header, dropdown, menú mobile y WhatsApp flotante.
- `src/styles/hero.css`: portada y heroes internos, composición responsive y gráficos del símbolo.
- `src/styles/sections.css`: grillas editoriales, servicios, productos, experiencia y FAQ.
- `src/styles/contact.css`: Contacto, formulario, CTA rojo y footer.
- `src/styles/motion.css`: fallback de vidrio y reduced-motion.
- `src/components/FinalCTA.astro`: separación de fondo full-width y contenedor interior.
- `src/components/Navbar.astro`: estado accesible del dropdown.
- `src/components/ServiceCard.astro`: acción secundaria diferenciada del presupuesto.
- `src/components/WhatsAppCTA.astro`: flecha animable, sin alterar el destino.
- `src/layouts/BaseLayout.astro`: pesos de fuente utilizados y favicon explícito.
- `src/pages/quienes-somos.astro`: contador correcto también sin JavaScript.
- `src/site.js`: revelados, menú/teclado, FAQ, contador y prevención de superposición del WhatsApp.
- `src/main.js`: encuadre responsive del símbolo, pausa fuera de pantalla/pestaña y reacción a reduced-motion.
- `scripts/design-qa.mjs`, `scripts/interaction-qa.mjs`, `scripts/verify-design.mjs`: pruebas reproducibles.

## Cascada y sistema

El CSS de autor pasó de 916 reglas / 2768 declaraciones / 102022 bytes a 440 reglas / 1445 declaraciones / aproximadamente 51 KB. Las 18 declaraciones `!important` se redujeron a 5, exclusivamente en la protección global de reduced-motion. Las coincidencias restantes de selector base separan únicamente el identificador gráfico `--section-mark` de sus propiedades de composición; no contienen declaraciones enfrentadas.

Cada componente reúne su base y sus variantes de 1023/767 px. Foundations define la excepción hasta 359 px. No hay una nueva capa de correcciones al final del CSS. Se sustituyeron 140 declaraciones de espaciado por referencias a la escala de tokens.

Gutters: `clamp(24px,6vw,104px)` en desktop; 32 px en tablet; 24 px en mobile; 20 px hasta 359 px. Grilla editorial conceptual de 12 columnas y gap de 24 px. Las etiquetas técnicas usan 11–12 px; cuerpo 16 px; leads 18–20 px; botones 14 px. Esperano mantiene su papel monumental con escalas por rol y sin `nowrap` ni recortes sobre titulares.

## Cuatro correcciones prioritarias

| Componente | Resultado computado |
| --- | --- |
| Formulario | 20 px internos a 320; 24 px a 360/390/430; 40–48 px en tablet/desktop. Una sola regla `.contact-form`, gobernada por `--form-padding`. |
| Contacto | `main` sin padding superior. El hero aplica la única compensación. Primer contenido a 120 px en mobile, con header de 72 px. |
| CTA de menú mobile | Padding efectivo `16px 24px`, altura mínima 56 px. El selector de enlaces comunes excluye `.nav-budget`. Texto alineado con las entradas principales, numeración en columna propia. |
| CTA rojo | Fondo a ancho completo y `.final-cta__inner` con gutter compartido: 86.4 px a 1440. Padding vertical mobile de 80 px, gap de 40 px, formulario sin margen heredado. |

## Composición y mobile

- Home: título solicitado intacto. En mobile, texto, símbolo y CTA están en flujo, sin offsets que los hagan competir; también se probó una altura de 600 px.
- Introducción y empresa: columnas editoriales con encabezado y texto próximos; imagen lateral sin estirar artificialmente el espacio entre ambos.
- Servicios: tres columnas en desktop amplio, tarjetas horizontales en tablet y una columna en mobile. Imágenes 4:3; padding mobile 24 px, gap 16 px. No se oculta el presupuesto mobile.
- Productos: disposición 3+2 que ocupa todo el ancho; una columna en mobile. H30 PROYECTABLE tiene espacio y contraste propios.
- Experiencia: titular, párrafo y contador coordinados; sin duplicar el número como decoración. El HTML muestra +20 aun sin JS.
- Heroes internos: separación suficiente para los acentos de Esperano, breadcrumbs que pueden envolver, imágenes sin mínimos de altura excesivos.
- Contacto: alineación única de etiquetas y datos, separación de 8 px entre emails/teléfonos, campos de 16 px y altura mínima de 48 px.
- Footer: grupos de 32 px en mobile, datos legibles y copyright separado sin sumar dos márgenes grandes.
- Se eliminó `body { min-width:320px }`, que producía 15 px de overflow en un viewport de 320 px con scrollbar clásica.

## Interacción, vidrio y performance

- Primary: capa roja de 400 ms, barrido único de 550 ms, esquinas 7→13 px, flecha +5 px. Tracking estable y dimensiones sin cambios.
- Secondary: vidrio oscuro de 10 px, borde progresivo y acento rojo; flecha +4 px. Active `scale(.985)`, foco visible.
- Header: blur 16 px / saturación 120%, transición 350 ms y estado scrolled más opaco, sin cambiar de altura.
- Dropdown: blur 16 px, transición 220 ms. Entrada por mouse o teclado; Escape restaura el foco.
- Etiquetas de imagen: vidrio localizado de 8 px. Formulario rojo: panel de 12 px con fallback sólido.
- Motion: hero secuenciado, reveals de 20 px / 650 ms, productos de 18 px / 600 ms / stagger 80 ms. Divisores como pseudo-elementos estáticos, animados mediante scaleX sin insertar cajas por JS.
- FAQ: apertura/cierre de 250 ms y animación cancelable; no cambia padding en hover o apertura.
- WhatsApp: safe-area, foco accesible y ocultación temporal cuando se superpone con controles de contacto en mobile.
- Se eliminaron animaciones GSAP de imágenes que competían con su hover CSS, listeners por tarjeta y el contador con intervalos repetidos.
- Three.js conserva su geometría y animación. La cámara ajusta el encuadre al símbolo expandido. Un solo RAF se pausa cuando el símbolo está fuera de vista, la pestaña está oculta o el usuario pide reduced-motion. DPR mobile limitado a 1.5.
- Sin dependencias nuevas. La reducción de CSS y de trabajo continuo se verificó estructuralmente; no se presenta como una medición Lighthouse ni una garantía de FPS en teléfonos físicos.

## Verificación

Resultado final: build Astro correcto (6 rutas), `git diff --check` y comprobaciones de sintaxis correctos; 48/48 combinaciones página/ancho y 40 aserciones de interacción aprobadas. Cero errores de consola, imágenes faltantes u overflow en la matriz final. Las advertencias de Git sobre normalización LF/CRLF no son errores de whitespace.

Se tomaron 48 capturas antes y 48 después: Home, Quiénes somos, Contacto y las tres landings, en 320, 360, 390, 430, 768, 1024, 1440 y 1920 px. Se examinaron estilos computados, overflow de documento/componentes, carga de imágenes, disponibilidad de WebGL y errores de consola. La revisión visual incluye láminas de portadas, páginas completas desktop, formulario con foco, menú y comparación de Contacto en la misma resolución.

Pruebas de interacción: menú a cinco anchos mobile/tablet, foco y Escape, dropdown desktop, hover/active de ambos tipos de botón, FAQ, validación nativa del formulario, protección del WhatsApp, reduced-motion estático y reanudación del símbolo. También se revisó contenido sin JS.

El formulario mantiene su comportamiento actual: prepara un `mailto:info@redmix.com.ar`; no es un envío directo a un servidor. No se enviaron consultas reales. Se conservaron ambos correos, ambos teléfonos y el WhatsApp comercial en todas las páginas.

### Reproducir

1. `npm run build`
2. `npm run preview -- --host 127.0.0.1 --port 4322`
3. Iniciar Chrome headless con CDP en un perfil exclusivo de QA.
4. Definir `QA_CDP_PORT`, `QA_BASE=http://127.0.0.1:4322/redmix/` y `QA_OUT` (directorio de artefactos fuera del repo).
5. Ejecutar secuencialmente `node scripts/design-qa.mjs`, `node scripts/verify-design.mjs` y `node scripts/interaction-qa.mjs`.
6. `git diff --check`, `node --check src/site.js`, `node --check src/main.js`.

Artefactos locales de esta revisión: `C:/Users/avant/.codex/visualizations/2026/10/07/01a11772-c235-7273-a0cc-b0c2e6d27a98/`, subdirectorios `before`, `final` e `interactions`.

## Consistencia editorial y límites de verificación

Se corrigió el título de `src/pages/servicios/bombeo-hormigon.astro` a «POR METRO CÚBICO», en concordancia con la descripción, el FAQ, los datos estructurados y el mensaje de WhatsApp, que indican volumen / m³.

Las pruebas responsive son emulaciones Chromium en Windows; no sustituyen pruebas físicas en Safari/iOS. La publicación está autorizada; su resultado debe comprobarse en GitHub Actions y en la URL pública del commit.

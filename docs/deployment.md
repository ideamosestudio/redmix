# Producción y respaldo

Sitio principal: https://redmix.com.ar/ servido por GitHub Pages. Astro compila para la raíz del dominio.

Cada push a main valida y publica Pages. Después el job backup-cpanel descarga exactamente el mismo artefacto y lo sincroniza por SSH (puerto 9022) en /home3/redmixcom/public_html. El secreto CPANEL_SSH_KEY queda cifrado en GitHub; la clave del host está fijada en scripts/deploy/known_hosts. Los PR no despliegan ni acceden al secreto.

La versión anterior del directorio se guarda en /home3/redmixcom/redmix-backups/previous-site.tar.gz, fuera de la web. Se conserva una versión anterior y la copia actual; esto no reemplaza el backup general del hosting. Se preservan .htaccess, .user.ini, php.ini, .well-known y cgi-bin. Un fallo del respaldo no revierte Pages: revisar el job y reejecutarlo. No editar la web a mano en cPanel: se sobrescribe en la siguiente publicación. deployment.json identifica el commit de ambas copias.

El DNS web debe apuntar a Pages. mail.redmix.com.ar y el MX deben permanecer en el hosting (167.250.5.104), al igual que cpanel, webmail y servicios de correo. Conservar entrega local en cPanel.

Git Version Control de cPanel: REDMIX - GitHub, en /home3/redmixcom/repositories/redmix, rama main y remoto HTTPS público. El job de respaldo actualiza este clon por fast-forward al commit publicado. No hay .cpanel.yml: el sitio Astro se compila en GitHub Actions y se copia el resultado; el código fuente no se expone en public_html.

## Formulario y correo

El endpoint server/contact.php se instala en public_html/api/contact.php y se accede mediante HTTPS en mail.redmix.com.ar, que continúa apuntando al hosting. El flujo de respaldo preserva /api/ y actualiza el procesador por separado. El transporte local entrega a info@redmix.com.ar; no requiere credenciales en el repositorio. La carpeta privada /home3/redmixcom/redmix-form-state (modo 700) contiene una clave aleatoria (modo 600) y contadores de solicitudes con IP anonimizada, con vencimiento de una hora. Límites: cinco consultas por IP y cien globales por hora.

SPF y DKIM se administran desde Email Deliverability de cPanel. DMARC comienza en p=none con reportes a info@redmix.com.ar; revisar emisores legítimos antes de endurecer la política. La web usa GitHub Pages y el correo entrega localmente en cPanel. No agregar las IP de Pages al SPF.

El 15/10/2026 el respaldo por GitHub Actions todavía presentaba timeout en SSH 9022 desde los runners; SSH local y sincronización manual funcionan. No considerar el respaldo automático operativo hasta un job exitoso con deployment.json coincidente.

# Producción y respaldo

Sitio principal: https://redmix.com.ar/ servido por GitHub Pages. Astro compila para la raíz del dominio.

Cada push a main valida y publica Pages. Después el job backup-cpanel descarga exactamente el mismo artefacto y lo sincroniza por SSH (puerto 9022) en /home3/redmixcom/public_html. El secreto CPANEL_SSH_KEY queda cifrado en GitHub; la clave del host está fijada en scripts/deploy/known_hosts. Los PR no despliegan ni acceden al secreto.

La versión anterior del directorio se guarda en /home3/redmixcom/redmix-backups/previous-site.tar.gz, fuera de la web. Se conserva una versión anterior y la copia actual; esto no reemplaza el backup general del hosting. Se preservan .htaccess, .user.ini, php.ini, .well-known y cgi-bin. Un fallo del respaldo no revierte Pages: revisar el job y reejecutarlo. No editar la web a mano en cPanel: se sobrescribe en la siguiente publicación. deployment.json identifica el commit de ambas copias.

El DNS web debe apuntar a Pages. mail.redmix.com.ar y el MX deben permanecer en el hosting (167.250.5.104), al igual que cpanel, webmail y servicios de correo. Conservar entrega local en cPanel.

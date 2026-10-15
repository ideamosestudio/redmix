<?php
declare(strict_types=1);

// Installed only on cPanel; never copied into the GitHub Pages artifact.
ini_set('display_errors', '0');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Vary: Origin');

function respond(int $code, bool $ok, string $message): never {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message], JSON_UNESCAPED_UNICODE);
    exit;
}

set_exception_handler(function (Throwable $error): void {
    error_log('REDMIX contact: ' . get_class($error));
    respond(503, false, 'El envío no está disponible. Contactanos por WhatsApp o intentá más tarde.');
});

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (!in_array($origin, ['https://redmix.com.ar', 'https://www.redmix.com.ar'], true)) {
    respond(403, false, 'Origen no permitido.');
}
header('Access-Control-Allow-Origin: ' . $origin);
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Max-Age: 600');
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST, OPTIONS');
    respond(405, false, 'Método no permitido.');
}
if (strtolower(trim(explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0])) !== 'application/json') {
    respond(415, false, 'Formato no permitido.');
}
$raw = file_get_contents('php://input', false, null, 0, 8193);
if ($raw === false || strlen($raw) > 8192) respond(413, false, 'La consulta es demasiado larga.');
$data = json_decode($raw, true);
if (!is_array($data)) respond(400, false, 'Consulta inválida.');
foreach (['name', 'phone', 'message', 'website', 'page'] as $field) {
    if (isset($data[$field]) && !is_string($data[$field])) respond(400, false, 'Consulta inválida.');
}
if (!empty($data['website'])) respond(422, false, 'No pudimos validar la consulta.');
$started = $data['started'] ?? null;
if (!is_numeric($started) || (microtime(true) * 1000 - (float) $started) < 1500) {
    respond(422, false, 'Esperá unos segundos y volvé a enviar la consulta.');
}
$name = trim($data['name'] ?? '');
$phone = trim($data['phone'] ?? '');
$message = trim($data['message'] ?? '');
$page = trim($data['page'] ?? '/');
if (!preg_match('//u', $name . $phone . $message . $page)
    || $name === '' || strlen($name) > 400 || preg_match('/[\r\n\x00]/', $name)
    || !preg_match('/^[0-9+().\s-]{6,40}$/D', $phone)
    || strlen($message) < 5 || strlen($message) > 8000 || str_contains($message, "\0")
    || strlen($page) > 250 || !preg_match('~^/[a-zA-Z0-9/_-]*$~D', $page)) {
    respond(422, false, 'Revisá tu nombre, teléfono y mensaje antes de enviar.');
}

// Store only hashed IP counters outside the public document root.
$stateDir = '/home3/redmixcom/redmix-form-state';
if (!is_dir($stateDir) || !is_writable($stateDir)) throw new RuntimeException('State unavailable');
$key = file_get_contents($stateDir . '/key');
if (!$key) throw new RuntimeException('Key unavailable');
$lock = fopen($stateDir . '/rate.json', 'c+');
if (!$lock || !flock($lock, LOCK_EX)) throw new RuntimeException('Lock unavailable');
$now = time();
$state = json_decode(stream_get_contents($lock), true) ?: [];
foreach ($state as $id => $entry) {
    if (($entry['expires'] ?? 0) <= $now) unset($state[$id]);
}
$id = hash_hmac('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown', $key);
$entry = $state[$id] ?? ['count' => 0, 'expires' => $now + 3600];
$global = $state['global'] ?? ['count' => 0, 'expires' => $now + 3600];
if ($entry['count'] >= 5 || $global['count'] >= 100) {
    flock($lock, LOCK_UN); fclose($lock);
    header('Retry-After: 3600');
    respond(429, false, 'Alcanzaste el límite de consultas. Contactanos por WhatsApp o intentá más tarde.');
}
$entry['count']++; $global['count']++;
$state[$id] = $entry; $state['global'] = $global;
rewind($lock); ftruncate($lock, 0); fwrite($lock, json_encode($state)); fflush($lock);
flock($lock, LOCK_UN); fclose($lock);

$body = "Nueva consulta desde el sitio REDMIX\n\nNombre: $name\nTeléfono: $phone\nPágina: https://redmix.com.ar$page\n\nMensaje:\n$message\n";
$headers = [
    'From' => 'REDMIX Web <info@redmix.com.ar>',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
];
$sent = mail('info@redmix.com.ar', 'Consulta desde el sitio REDMIX', $body, $headers, '-finfo@redmix.com.ar');
if (!$sent) throw new RuntimeException('Mail unavailable');
respond(200, true, 'Consulta enviada.');

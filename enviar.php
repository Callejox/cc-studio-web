<?php
/* ============================================================
   CC STUDIO — enviar.php
   Procesa el formulario de contacto y envía un email con mail().
   Requiere un servidor con PHP y mail() configurado (hosting).
   ============================================================ */

// Solo aceptar POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

$destino = 'hola@ccstudioweb.es';

// Recoger y limpiar campos
$nombre        = trim($_POST['nombre']   ?? '');
$negocio       = trim($_POST['negocio']  ?? '');
$contacto      = trim($_POST['contacto'] ?? '');
$necesito      = trim($_POST['necesito'] ?? '');
$mensaje       = trim($_POST['mensaje']  ?? '');
$consentimiento = $_POST['consentimiento'] ?? '';

// Validación mínima
if ($nombre === '' || $contacto === '' || $necesito === '') {
    http_response_code(400);
    echo 'Faltan campos obligatorios. Vuelve atrás y complétalos.';
    exit;
}

// El consentimiento RGPD es obligatorio
if ($consentimiento !== '1') {
    http_response_code(400);
    echo 'Debes aceptar la Política de Privacidad para enviar el formulario.';
    exit;
}

// Honeypot anti-spam: si el campo oculto viene relleno, es un bot.
// Fingimos éxito para no darle pistas, pero no enviamos nada.
if (trim($_POST['apellidos2'] ?? '') !== '') {
    header('Location: gracias.html');
    exit;
}

// Evitar inyección de cabeceras
function limpiar_cabecera($v) {
    return str_replace(["\r", "\n", "%0a", "%0d"], '', $v);
}
$nombre_h = limpiar_cabecera($nombre);

// Construir el email
$asunto = 'Nuevo presupuesto CC Studio — ' . $nombre_h;

$cuerpo  = "Nueva solicitud desde la web de CC Studio\n";
$cuerpo .= "----------------------------------------\n\n";
$cuerpo .= "Nombre:    $nombre\n";
$cuerpo .= "Negocio:   $negocio\n";
$cuerpo .= "Contacto:  $contacto\n";
$cuerpo .= "Necesita:  $necesito\n\n";
$cuerpo .= "Mensaje:\n$mensaje\n\n";
$cuerpo .= "----------------------------------------\n";
$cuerpo .= "Consentimiento Política de Privacidad: ACEPTADO\n";
$cuerpo .= "Fecha y hora: " . date('d/m/Y H:i:s') . "\n";
$cuerpo .= "IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'desconocida') . "\n";

$cabeceras  = "From: CC Studio Web <hola@ccstudioweb.es>\r\n";
$cabeceras .= "Reply-To: " . limpiar_cabecera($contacto) . "\r\n";
$cabeceras .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Enviar
if (mail($destino, $asunto, $cuerpo, $cabeceras)) {
    header('Location: gracias.html');
    exit;
} else {
    http_response_code(500);
    echo 'No se pudo enviar el mensaje. Escríbenos por WhatsApp: +34 634 98 19 27';
    exit;
}

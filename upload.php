<?php
header('Content-Type: application/json');

$uploadDir = 'uploads/';

// Create directory if it doesn't exist
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_FILES['file']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['file'];
        
        // Clean filename and make it unique
        $fileName = preg_replace('/[^a-zA-Z0-9.\-_]/', '_', basename($file['name']));
        $uniqueName = time() . '_' . $fileName;
        $destination = $uploadDir . $uniqueName;

        if (move_uploaded_file($file['tmp_name'], $destination)) {
            echo json_encode(['status' => 'ok', 'url' => $destination]);
        } else {
            http_response_code(500);
            echo json_encode(['status' => 'error', 'message' => 'Error al mover el archivo subido al servidor.']);
        }
    } else {
        http_response_code(400);
        $errorMsg = isset($_FILES['file']) ? 'Error en la subida (código: ' . $_FILES['file']['error'] . ')' : 'No se recibió ningún archivo o hubo un error.';
        echo json_encode(['status' => 'error', 'message' => $errorMsg]);
    }
} else {
    http_response_code(405);
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido. Use POST.']);
}

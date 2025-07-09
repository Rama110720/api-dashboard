<?php
// Set header untuk JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Fungsi untuk mengirim response JSON
function sendResponse($data, $status_code = 200) {
    http_response_code($status_code);
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit();
}

// Fungsi untuk log request (opsional)
function logRequest() {
    $log_data = [
        'timestamp' => date('Y-m-d H:i:s'),
        'method' => $_SERVER['REQUEST_METHOD'],
        'ip' => $_SERVER['REMOTE_ADDR'] ?? 'unknown',
        'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
        'endpoint' => $_SERVER['REQUEST_URI'] ?? 'unknown'
    ];
    
    // Simpan ke file log (pastikan folder logs ada dan writable)
    file_put_contents('logs/api.log', json_encode($log_data) . "\n", FILE_APPEND | LOCK_EX);
}

try {
    // Log request (opsional)
    // logRequest();
    
    // Hanya terima method GET
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        sendResponse([
            'status' => 'error',
            'message' => 'Method not allowed. Only GET requests are supported.',
            'allowed_methods' => ['GET']
        ], 405);
    }
    
    // Ambil parameter dari URL (jika ada)
    $name = $_GET['name'] ?? 'Dunia';
    $lang = $_GET['lang'] ?? 'id';
    
    // Daftar pesan dalam berbagai bahasa
    $messages = [
        'id' => 'Halo',
        'en' => 'Hello',
        'es' => 'Hola',
        'fr' => 'Bonjour',
        'de' => 'Hallo',
        'ja' => 'こんにちは',
        'zh' => '你好',
        'ar' => 'مرحبا'
    ];
    
    // Pilih pesan berdasarkan bahasa
    $greeting = $messages[$lang] ?? $messages['id'];
    
    // Buat response
    $response = [
        'status' => 'success',
        'message' => $greeting . ' ' . $name . '!',
        'data' => [
            'greeting' => $greeting,
            'name' => $name,
            'language' => $lang,
            'full_message' => $greeting . ' ' . $name . '!'
        ],
        'meta' => [
            'version' => '1.0.0',
            'timestamp' => date('c'), // ISO 8601 format
            'response_time' => microtime(true) - $_SERVER['REQUEST_TIME_FLOAT'],
            'server_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get()
        ]
    ];
    
    sendResponse($response);
    
} catch (Exception $e) {
    // Handle error
    sendResponse([
        'status' => 'error',
        'message' => 'Internal server error occurred',
        'error_code' => 'INTERNAL_ERROR',
        'timestamp' => date('c')
    ], 500);
}
?>
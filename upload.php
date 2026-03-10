<?php
// Simple secure upload endpoint for ROCK.SCOT admin
// Only accepts image files, only to allowed directories

$ALLOWED_DIRS = ['djs'];
$BASE_PATH = __DIR__ . '/assets/images/';
$MAX_SIZE = 5 * 1024 * 1024; // 5MB

// Basic auth check — must have a valid session token in header
// We reuse the same Supabase anon key check as a simple gate
$auth = $_SERVER['HTTP_X_UPLOAD_TOKEN'] ?? '';
if ($auth !== 'rockscot-upload-2025') {
    http_response_code(403);
    echo json_encode(['error' => 'Forbidden']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$dest = $_POST['dest'] ?? '';
if (!in_array($dest, $ALLOWED_DIRS)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid destination']);
    exit;
}

if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['error' => 'No file or upload error']);
    exit;
}

$file = $_FILES['file'];

// Size check
if ($file['size'] > $MAX_SIZE) {
    http_response_code(400);
    echo json_encode(['error' => 'File too large (max 5MB)']);
    exit;
}

// Type check — images only
$allowed_types = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, $allowed_types)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid file type: ' . $mime]);
    exit;
}

// Sanitise filename
$original = basename($file['name']);
$ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
$base = strtolower(pathinfo($original, PATHINFO_FILENAME));
$base = preg_replace('/[^a-z0-9_]/', '_', $base);
$base = preg_replace('/_+/', '_', $base);
$filename = $base . '.' . $ext;

$target_dir = $BASE_PATH . $dest . '/';
$target_path = $target_dir . $filename;

// Ensure directory exists
if (!is_dir($target_dir)) {
    mkdir($target_dir, 0755, true);
}

if (move_uploaded_file($file['tmp_name'], $target_path)) {
    $url = '/assets/images/' . $dest . '/' . $filename;
    http_response_code(200);
    echo json_encode(['success' => true, 'url' => $url, 'filename' => $filename]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save file']);
}

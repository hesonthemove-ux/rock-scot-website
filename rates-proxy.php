<?php
header('Content-Type: application/json');
header('Cache-Control: no-store, no-cache, must-revalidate');
header('Pragma: no-cache');

$url = 'https://pwzeapvopeeoahpyicdm.supabase.co/rest/v1/site_settings?select=key,value';
$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emVhcHZvcGVlb2FocHlpY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjg3NDEsImV4cCI6MjA4Njc0NDc0MX0.rc8IqfQF537UA5iWarxDia174HyCZ_xc2VPWOWdGxYk';

$opts = ['http' => [
    'header'  => "apikey: $apiKey\r\nAuthorization: Bearer $apiKey\r\n",
    'method'  => 'GET',
    'timeout' => 5
]];

$raw = @file_get_contents($url, false, stream_context_create($opts));

if ($raw === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Supabase unreachable']);
    exit;
}

// Parse and re-encode as clean compact JSON
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(500);
    echo json_encode(['error' => 'Bad response from Supabase']);
    exit;
}

echo json_encode($data);

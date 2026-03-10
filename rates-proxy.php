<?php
header('Content-Type: application/json');
header('Cache-Control: max-age=60'); // Cache 60 seconds

$url = 'https://pwzeapvopeeoahpyicdm.supabase.co/rest/v1/site_settings?select=key,value';
$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emVhcHZvcGVlb2FocHlpY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjg3NDEsImV4cCI6MjA4Njc0NDc0MX0.rc8IqfQF537UA5iWarxDia174HyCZ_xc2VPWOWdGxYk';

$options = [
    'http' => [
        'header'  => "apikey: " . $apiKey . "\r\nAuthorization: Bearer " . $apiKey . "\r\n",
        'method'  => 'GET',
        'timeout' => 5
    ]
];

$response = @file_get_contents($url, false, stream_context_create($options));

if ($response === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to fetch from Supabase']);
} else {
    echo $response;
}

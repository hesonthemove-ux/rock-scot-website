<?php
header('Content-Type: application/json');
$url = 'https://pwzeapvopeeoahpyicdm.supabase.co/rest/v1/presenters?select=*&order=name.asc';
$apiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3emVhcHZvcGVlb2FocHlpY2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNjg3NDEsImV4cCI6MjA4Njc0NDc0MX0.rc8IqfQF537UA5iWarxDia174HyCZ_xc2VPWOWdGxYk';
$opts = ["http" => ["header" => "apikey: $apiKey\r\nAuthorization: Bearer $apiKey\r\n"]];
echo file_get_contents($url, false, stream_context_create($opts));

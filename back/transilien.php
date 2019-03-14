<?php

include('credentials.inc.php');
global $username;
global $password;
global $credential;

if (!isset($_GET['credential'])) {
	http_response_code(401);
	echo '401 unauthorized';
	return;
}

if ($_GET['credential'] != $credential) {
	http_response_code(403);
	echo '403 Not allowed';
	return;
}

if (!isset($_GET['from']) || !isset($_GET['to'])) {
	http_response_code(400);
	echo '400 Bad request';
	return;
}

header('Content-Type: application/xml');
header('Access-Control-Allow-Origin: *');

$from_station = $_GET['from'];
$to_station = $_GET['to'];

$remote_url = "https://api.transilien.com/gare/$from_station/depart/$to_station";

// Create a stream
$opts = array(
  'http'=>array(
    'method'=>"GET",
    'header' => "Authorization: Basic " . base64_encode("$username:$password")                 
  )
);

$context = stream_context_create($opts);

// Open the file using the HTTP headers set above
$file = file_get_contents($remote_url, false, $context);

if(is_array($http_response_header)) {
	$parts=explode(' ',$http_response_header[0]);
	if(count($parts)>1) { //HTTP/1.0 <code> <text>
		http_response_code(intval($parts[1])); //Get code
	}
}

echo $file;

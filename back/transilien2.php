<?php

include('credentials.inc.php');
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

if (!isset($_GET['from']) || !isset($_GET['fromname']) || !isset($_GET['to'])) {
	http_response_code(400);
	echo '400 Bad request';
	return;
}


header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$from_station = $_GET['from'];
$from_station_name = $_GET['fromname'];
$to_station = $_GET['to'];

$postbody = "{\"departure\":\"{$from_station_name}\",\"uicDeparture\":\"{$from_station}\",\"uicArrival\":\"{$to_station}\",\"pmr\":false}";
$headerReferer = "Referer: https://www.transilien.com/fr/horaires/prochains-departs/?departure={$from_station_name}&uicDeparture={$from_station}&uicArrival={$to_station}&pmr=false";

// Generated by curl-to-PHP: http://incarnate.github.io/curl-to-php/
$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, 'https://www.transilien.com/api/nextDeparture/search');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postbody);
curl_setopt($ch, CURLOPT_ENCODING, 'gzip, deflate');

$headers = array();
$headers[] = 'Connection: keep-alive';
$headers[] = 'Pragma: no-cache';
$headers[] = 'Cache-Control: no-cache';
$headers[] = 'Accept: application/json, text/plain, */*';
$headers[] = 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36';
$headers[] = 'Content-Type: application/json;charset=UTF-8';
$headers[] = 'Origin: https://www.transilien.com';
$headers[] = 'Sec-Fetch-Site: same-origin';
$headers[] = 'Sec-Fetch-Mode: cors';
$headers[] = 'Sec-Fetch-Dest: empty';
$headers[] = $headerReferer;
$headers[] = 'Accept-Language: fr';
// $headers[] = 'Cookie: TRIPRD1TRIABIP11=triabip11tri; TRIPRD1WAS=triabip11esi; TRI_city=LIL_PRD1; has_js=1; _ga=GA1.2.394215572.1599122941; _gid=GA1.2.215561751.1599122941; _JSESSIONID=4FBF56D6F32B4DD2A481148268CB6E51; _gat_UA-19711994-9=1; TRIPRD1CMSD8=triyzep61tricms; OptanonConsent=isIABGlobal=false&datestamp=Thu+Sep+03+2020+11%3A20%3A36+GMT%2B0200+(%E4%B8%AD%E6%AC%A7%E5%A4%8F%E4%BB%A4%E6%97%B6%E9%97%B4)&version=5.10.0&landingPath=NotLandingPage&groups=1%3A1%2C2%3A1%2C3%3A0&hosts=&consentId=32b6cabf-c7ac-4369-a677-5d07bc01913d&interactionCount=0&AwaitingReconsent=false';
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$result = curl_exec($ch);
if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
}
curl_close($ch);

echo $result;

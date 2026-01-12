<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

// Configurare Bază de Date
$host = 'db';           
$db   = 'catalog_studenti';
$user = 'user_catalog'; // Userul definit în docker-compose
$pass = 'parola_secreta'; // Parola definită în docker-compose
$charset = 'utf8mb4';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
    echo json_encode(['error' => 'Conexiune eșuată: ' . $e->getMessage()]);
    exit;
}

// 1. GET: Returnează lista de studenți
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $stmt = $pdo->query("SELECT * FROM studenti ORDER BY id DESC");
    $studenti = $stmt->fetchAll();
    echo json_encode($studenti);
}

// 2. POST: Adaugă un student nou
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Primim datele JSON trimise din JS
    $input = json_decode(file_get_contents('php://input'), true);

    if (isset($input['nume'], $input['an'], $input['media'])) {
        $sql = "INSERT INTO studenti (nume, an, media) VALUES (?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        
        try {
            $stmt->execute([$input['nume'], $input['an'], $input['media']]);
            echo json_encode(['status' => 'success', 'message' => 'Student adăugat!']);
        } catch (Exception $e) {
            echo json_encode(['status' => 'error', 'message' => 'Eroare la inserare']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Date incomplete']);
    }
}
?>
<?php

$configs = [
    'MAMP (8889)' => ['127.0.0.1', 'root', 'root', 'VNYL', 8889, null],
    'Standard (3306) - root/root' => ['127.0.0.1', 'root', 'root', 'VNYL', 3306, null],
    'Standard (3306) - root/empty' => ['127.0.0.1', 'root', '', 'VNYL', 3306, null],
    'Custom (9090)' => ['127.0.0.1', 'root', 'root', 'VNYL', 9090, null],
    'MAMP Socket' => ['localhost', 'root', 'root', 'VNYL', null, '/Applications/MAMP/tmp/mysql/mysql.sock'],
];

foreach ($configs as $name => $creds) {
    echo "Checking $name...\n";
    try {
        $dsn = "mysql:dbname={$creds[3]}";
        if ($creds[4]) $dsn .= ";host={$creds[0]};port={$creds[4]}";
        if ($creds[5]) $dsn .= ";unix_socket={$creds[5]}";

        $pdo = new PDO($dsn, $creds[1], $creds[2]);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

        $stmt = $pdo->query("SELECT count(*) FROM tracks");
        $count = $stmt->fetchColumn();
        echo "  [SUCCESS] Connected! Tracks count: $count\n\n";
    } catch (Exception $e) {
        echo "  [FAILED] " . $e->getMessage() . "\n\n";
    }
}

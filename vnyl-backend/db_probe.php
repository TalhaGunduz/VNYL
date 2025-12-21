<?php
$configs = [
    'TCP 8889 (localhost)' => ['localhost', 'root', 'root', 8889],
    'TCP 8889 (127.0.0.1)' => ['127.0.0.1', 'root', 'root', 8889],
    'TCP 3306 (localhost) - root/root' => ['localhost', 'root', 'root', 3306],
    'TCP 3306 (localhost) - root/empty' => ['localhost', 'root', '', 3306],
];

foreach ($configs as $name => $c) {
    echo "Probing $name...\n";
    try {
        $dsn = "mysql:host={$c[0]};port={$c[3]};dbname=VNYL";
        $pdo = new PDO($dsn, $c[1], $c[2]);
        $count = $pdo->query("SELECT count(*) FROM tracks")->fetchColumn();
        echo "  [SUCCESS] Found $count tracks!\n";
    } catch (Exception $e) {
        echo "  [FAILED] " . $e->getMessage() . "\n";
    }
    echo "\n";
}

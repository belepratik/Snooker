<?php
// Adminer - Database management web interface
// Version: 4.8.1
// Access at: http://localhost:8080

// Configuration
function adminer_object() {
    // http://www.adminer.org/en/plugins/
    $plugins = array();
    
    // Autoincrement plugin
    $plugins[] = new AdminerPlugin\AutoIncrement();
    
    return new Adminer($plugins);
}

// Disallow login
class AdminerPlugin\Login {
    public function login($login, $password) {
        return true;
    }
}

// Download Adminer if not present
$adminer_url = 'https://www.adminer.org/latest.php';
$adminer_file = __DIR__ . '/adminer-latest.php';

if (!file_exists($adminer_file)) {
    echo "Downloading Adminer...";
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false
        ]
    ]);
    
    $content = @file_get_contents($adminer_url, false, $context);
    if ($content === false) {
        die("Failed to download Adminer. Please ensure internet connectivity.");
    }
    
    file_put_contents($adminer_file, $content);
    echo "Adminer downloaded successfully!<br>";
}

// Include the downloaded Adminer
require_once $adminer_file;
?>

<?php
$folder = "images/";

if (!is_dir($folder)) {
    echo "Folder does not exist.<br>";
} else {
    echo "Folder exists.<br>";
    if (is_writable($folder)) {
        echo "Folder is writable!";
    } else {
        echo "Folder is NOT writable!";
    }
}
?>
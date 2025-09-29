<?php
// first define the folder in which the save folder is expected to be found
$saveroot = "data/";

// get the name of the directory we're in
// this should be the root of the experiment directory
// the subdirectory under $saveroot where the data is saved should get the same name
// $base = basename(getcwd());

// save dir is where data files are saved
$savedir = $saveroot;
// $savedir = $saveroot."/".$base;

// check for and create directories if needed
// if saveroot does not exist something is wrong, exit with an error message
if (!file_exists($saveroot)){
	error_log("No directory ".$saveroot.", cannot save. Experiment name: ".$base);
	exit(1); // the program will exit and the rest is not run
}

// if no save directory exist this is the first result file
if (!file_exists($savedir)){
	mkdir($savedir);
	chmod($savedir, 0770); // change modes to that the experiment owner can access and remove it
}

// receive the post
$data = json_decode(file_get_contents('php://input'), true);

// create a file name with timestamp and an additional unique string,
// so that an attacker cannot overwrite data
$filename = $savedir."/UTC".date('Ymd-H.i.s')."_IID".uniqid()."_EID".$data['projname'].$data['fileid'].".csv";
// write the file and log if there was an error
if (!file_put_contents($filename, $data['filedata'])){
	error_log("Attempt to write file ".$filename." failed!");
} else {
	chmod($filename, 0660); // change modes so that the experiment owner can download the file
}
?>

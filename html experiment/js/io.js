/* generic helper functions to read information from cmd and load/save data */

/* debug messages */
// var debug = {true | false} must be set in main script for this to function
function debugLog(msg){ if(debug) {console.log(msg);}}

/* for saving 
   (according to jsPsych tutorial) */
function saveData(id, data){
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "write_data.php"); // 'write_data.php' is the path to the php file described above.
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.send(JSON.stringify({fileid: id, filedata: data}));
} 
/* wrapper for saveData */
function saveDataWrap(){
	saveData(subjectId, jsPsych.data.get().csv()); 
	
}
/* get variables from command line
   used to select which face-condition mapping to use */
function getQueryVariable(variable)
{
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if(pair[0] == variable){return pair[1];}
    }
    return(-1); // default if no parameter given
}

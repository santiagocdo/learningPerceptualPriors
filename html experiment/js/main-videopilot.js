// Chasing perception and paranoia
// By Krisztina Jedlovszky 10/25 based on code by Dawei Bai

// pilot 3: Using pre-made videos and having the option to run a 2AFC task

var skip_welcome 		= false;
var skip_instructions 	= false;
var debug_mode			= false;
var two_afc             = true;

const ProjName	 = "ChasingPerceptionAndParanoia"
const expVersion = two_afc ? "Pilot3_2afc" : "Pilot3_detection";
const lengthExp  = 19
// const trial_length = 1000 
const trial_length = 5 * 1000
const 
	fixation_duration = 800,
	start_listening_for_keypress = 500 // time to wait before listening for keypresses

//////////// Preload videos ////////////
var test_videos = [];

// Chase videos (label = 1)
for (var i = 1; i <= 10; i++) {
    test_videos.push({
        stimulus: `images/chase/trial_${i}.mp4`,
        chasingIsPresent: 1
    });
}

// No-chase videos (label = 0)
for (var i = 1; i <= 10; i++) {
    test_videos.push({
        stimulus: `images/no chase/trial_${i}.mp4`,
        chasingIsPresent: 0
    });
}

// shuffle the order
test_videos = jsPsych.randomization.shuffle(test_videos);

// preload the videos
const preloadedVideos = [];
test_videos.forEach(v => {
  let video = document.createElement('video');
  video.src = v.stimulus;
  video.preload = 'auto';
  preloadedVideos.push(video);
});

//////////// trial structure ////////////
var N_practice_trial = 2;
var N_miniblocks = 4;
var trials_per_miniblock = 2;

// Volatile miniblocks: strongly biased
var chaserMiniBlock_80chasing = [1, 1]; // both chasing
var chaserMiniBlock_20chasing = [0, 0]; // both non-chasing

// Stable miniblocks: balanced
var chaserMiniBlock_50chasing = [1, 0]; // one of each

// Practice trials
var practice_chasing_first = Math.random() > 0.5;
var chasingTrialsShuffled = practice_chasing_first ? [1, 0] : [0, 1];
var volatilityTracker = ["practice", "practice"];
var miniBlockTracker = ["practice", "practice"];

// Main block structure
var blockTypes = ["stable", "stable", "volatile", "volatile"];
blockTypes = jsPsych.randomization.shuffle(blockTypes); // randomize order

blockTypes.forEach((blockType, i) => {
  if (blockType === "stable") {
    // 50/50 chasing
    chasingTrialsShuffled = chasingTrialsShuffled.concat(jsPsych.randomization.shuffle(chaserMiniBlock_50chasing));
    volatilityTracker.push("0", "0");
    miniBlockTracker.push("miniBlockStable", "miniBlockStable");
  } else {
    // volatile miniblocks alternate dominance
    if (i % 2 === 0) {
      chasingTrialsShuffled = chasingTrialsShuffled.concat(chaserMiniBlock_80chasing);
      miniBlockTracker.push("miniBlockChasingIsDominant_Yes", "miniBlockChasingIsDominant_Yes");
    } else {
      chasingTrialsShuffled = chasingTrialsShuffled.concat(chaserMiniBlock_20chasing);
      miniBlockTracker.push("miniBlockChasingIsDominant_Not", "miniBlockChasingIsDominant_Not");
    }
    volatilityTracker.push("1", "1");
  }
});
console.log("Chasing trials:", chasingTrialsShuffled);
console.log("Volatility tracker:", volatilityTracker);
console.log("MiniBlock tracker:", miniBlockTracker);


// get prolific ID
function getURLParameter(sParam) {
	var sPageURL = window.location.search.substring(1);
	var sURLVariables = sPageURL.split('&');
	for (var i = 0; i < sURLVariables.length; i++) {
		var sParameterName = sURLVariables[i].split('=');
		if (sParameterName[0] == sParam) {
			return sParameterName[1];
		}
	}
	console.log("The input was not found")
	return 'no_query'
};
var prolific_PID = getURLParameter('PROLIFIC_PID');

// Save data to server and to local computer as CSV (optional for debugging)
function saveData(id, data) {
    var xhr = new XMLHttpRequest();
	xhr.open("POST", "write_data.php"); 
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.send(JSON.stringify({fileid: id, filedata: data, projname: expVersion}));

    if (debug_mode) {   // local download
    // Convert data to CSV string
    const csvStr = "data:text/csv;charset=utf-8," + encodeURIComponent(data);
    
    // Create temporary download link
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", csvStr);
    dlAnchor.setAttribute("download", `sub-${id}_data.csv`);
    
    // Trigger download
    dlAnchor.click();
    }
}

// Wrapper function to get jsPsych data and save
function saveDataWrap() {
    const allData = jsPsych.data.get();
    const filtered = allData.filterCustom(trial => {
    return trial.test_part !== 'fixation';
  });
    const csvData = filtered.csv();
    //const csvData = jsPsych.data.get().csv();
    saveData(subjectId, csvData);
}
var subjectId = jsPsych.randomization.randomID(8);
	jsPsych.data.addProperties({subject: subjectId, prolificID: prolific_PID, proj_name: ProjName, exp_version: expVersion});
	
// utility functions
var trialHasFinished = 0

var trialCounter = 1
var begin_trial_time
var switchColor = 0
function makeVideoTrial(videoStimulus) {
  return {
    type: 'html-button-response', // or plain 'html' plugin if you want
    stimulus: `
      <video id="trialVideo" width="960" height="720" autoplay preload="auto">
        <source src="${videoStimulus.stimulus}" type="video/mp4">
      </video>
    `,
    choices: [], // disable default jsPsych keyboard handling
    on_load: function () {
      const video = document.getElementById('trialVideo');
      document.body.style.cursor = 'none';
      const trialStartTime = performance.now();

      const keyListener = two_afc 
        ? function(e) { // 2afc
            if (e.code === 'KeyJ' || e.code === 'KeyF') {
                const rt = performance.now() - trialStartTime;
                video.pause();
                jsPsych.finishTrial({
                    rt: rt,
                    trialNumber: trialCounter,
                    reportChasing: e.code === 'KeyJ' ? 1 : 0,
                    chasingIsPresent: videoStimulus.chasingIsPresent,
                    isVolatile: volatilityTracker[trialCounter],
                    miniBlock: miniBlockTracker[trialCounter],
                    video_name: videoStimulus.stimulus.split('/').pop(),
                    key_pressed: e.code
                });
                document.removeEventListener('keydown', keyListener);
                video.remove();
            }
        }
        : function(e) { // detection task
            if (e.code === 'Space') {
                const rt = performance.now() - trialStartTime;
                video.pause();
                jsPsych.finishTrial({
                    rt: rt,
                    trialNumber: trialCounter,
                    reportChasing: 1,
                    chasingIsPresent: videoStimulus.chasingIsPresent,
                    isVolatile: volatilityTracker[trialCounter],
                    miniBlock: miniBlockTracker[trialCounter],
                    video_name: videoStimulus.stimulus.split('/').pop()
                });
                document.removeEventListener('keydown', keyListener);
                video.remove();
            }
        };

      document.addEventListener('keydown', keyListener);

      video.addEventListener('ended', () => {
        jsPsych.finishTrial({
          rt: "NA",
          trialNumber: trialCounter,
          reportChasing: 0,
          chasingIsPresent: videoStimulus.chasingIsPresent,
          isVolatile: volatilityTracker[trialCounter],
          miniBlock: miniBlockTracker[trialCounter],
          video_name: videoStimulus.stimulus.split('/').pop()
        });
        document.removeEventListener('keydown', keyListener);
        video.remove();
      });
    },
    on_finish: function (data) {
      trialCounter++;
      document.body.style.cursor = 'auto';
    }
  };
}

// fixation cross
var fixation_cross = {
	type: 'html-keyboard-response',
	data: {test_part: 'fixation'},
	stimulus: '<div style="font-size: 40px; color: black;">+</div>',
	choices: jsPsych.NO_KEYS,	
	trial_duration: fixation_duration,
	post_trial_gap: 100,
	on_load: function() {
		document.body.style.cursor = 'none';
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
	}			
}	
				
// Instructions & stuff
var browser_check = {
    data: {
	test_part: 'browser-check'
    },
    type: 'html-button-response',
    button_html: '<button class="jspsych-btn" style="width: 300px;">%choice%</button><br><br><br>',
    stimulus: '<p><strong>It seems you are using Firefox or Internet Explorer - this experiment will not work properly.</strong></p><p>Please try another browser (chrome/Edge/safari are all known to work well).</p>',
    choices: ['<strong>Exit<br>experiment</strong>'],
    post_trial_gap: 100,
    on_finish: function (data){
	if (data.button_pressed == 0) {
		jsPsych.endExperiment('Experiment aborted. You may copy and paste the link into another browser:<br>' + window.location.href);
	}
    },
};

var prolificID = {
	type: "survey-text",
	data: {test_part: 'ProlificID'},
    questions: [
        {prompt: "What is your Prolific ID?", rows: 1, columns: 40, required: true}, 
    ],
	Required : true,
};

var consentform = {
	type: "html-button-response",
	data: {test_part: 'consent'},
	stimulus: 
	"<h5>USE ARROW KEYS OR MOUSE TO SCROLL DOWN.<br>In order to run this study, we need to include the standard consent form below.</h5><h1>Consent for Participation in a Research Study</h1><div style='width: 100%; text-align: center'><div style='display: inline-block; margin: 0 auto; padding: 10px 200px 10px 200px; text-align: left'><h5>DESCRIPTION OF THE STUDY</h5><p>The purpose of the study is to understand visual perception.</p>"+
	"<h5>RESEARCH STUDY SUMMARY, RISKS, AND BENEFITS</h5><p>Thank you for volunteering to participate in this research study. The purpose of this study is to better understand how we see and how we think. Study activities will include examining simple displays and then responding by answering questions, pressing some keys, or using a computer mouse. Because these are activities that many people already experience hundreds or thousands of times every day, there are no risks involved in this study. The study may have no benefits to you, but it may help the scientific community come to better understand how the human mind works. Taking part in this study is your choice. You can choose to take part, or you can choose not to take part in this study. You can also change your mind at any time, with no penalty.</p><h5>DURATION</h5><p>If you agree to take part, the study will last approximately <strong> "+lengthExp+" minutes</strong>.</p>"+
	"<h5>COSTS AND COMPENSATION</h5><p>There are no costs associated with participation in this study. You will receive compensation for participating, as is indicated on Prolific.</p><h5>CONFIDENTIALITY</h5><p>No personally identifying information will be collected, so your participation will be anonymous. The survey is anonymous. We will not know your name. We will not be able to connect any identifying information to your survey answers. Your data will be pooled with those from other participants, and may be included in scientific publications and uploaded to public data repositories.</p>"+
	"<h5>LEARNING MORE</h5><p>If you have questions about this study, you may contact your experimenters at dawei.bai@yale.edu. If you have questions about your rights as a research participant, or you have complaints about this research, you can contact the Yale Institutional Review Boards at 203-785-4688 or hrpp@yale.edu.</p><h5>INFORMED CONSENT</h5><p>Your participation indicates that you have read and understood this consent form and the information presented and that you agree to be in this study.</p>"+
	"<p>If you agree with this consent form, press the button \'I agree\'.</p></div></div>",
	choices: ['I agree'],	
	post_trial_gap: 100
};

var instructions_0 = {
    data: {test_part: 'instructions'},
    type: "instructions",
	button_delay: [4000],
	pages: [
		"<div style = 'width : 1000px; text-align: left'>"+
		'<h1>Let&#39;s get ready...</h1>&nbsp;'+
		'<br>When the experiment begins, you will sometimes need to answer quickly by pressing buttons with your mouse or pressing keys on your keyboard.<br>'+
		'<br>Things you need to do to make sure everything works fine:<ul> '+
		'<li>Make sure you can comfortably watch the screen and use the keyboard.</li>' +
		'<li>Close any performance demanding program, so your computer works fast enough.</li>' +
		'<li>Close any chat programs or phone, so as not to be interrupted.</li> '+
		'<li><strong>Please do not switch to other programs, as this will freeze the experiment.</strong></li> '+
		'<li><strong>Be prepared to remain attentive and alert for the duration of the experiment, which will only last ' + lengthExp +' minutes</strong>:'+
		'<br>your data will only be useful to us if you stay focused throughout the entire study.</li></ul>'+
		"<p>In the next few pages we'll explain the instructions for this study. Please read each page carefully and hit the 'Next' button when you're ready to move on. (Note that the button will be initially grayed out, to give you time to read the text, but it will automatically be activated after a short while.)</p>"+
		'<p>In the next screen, you will automatically go into full screen mode. <strong>Please do not exit full screen mode during the experiment, '+
		'which will disrupt the data collection.</strong> Do not worry, you will exit full screen mode at the end of the experiment.</p><br>&nbsp;</div>'],
	show_clickable_nav: true,

};


var instructions_1 = {
    data: {test_part: 'instructions'},	
	type: "instructions",
	button_delay: [5000],
	pages: [
		"<div style = 'width : 1000px'> <h1>Instructions (1/5)</h1>" +
		"<p>In this experiment, you will be repeatedly shown animations of moving circles, like in the illustration below:</p>"+
		"<img src= 'images/instr.png' style='width:455px; vertical-align: middle'>"+
		"</div>"],
    show_clickable_nav: true,
	on_load: function() { // go full screen
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
	},
};

var instructions_2 = {
    data: {test_part: 'instructions'},	
	type: "instructions",
	button_delay: [5000],
	pages: [
		"<div style = 'width : 1000px'> <h1>Instructions (2/5)</h1>" +
		"<p>In each animation, one of the circles will be green, while the other circles will all be black. Most of the black circles will be moving randomly, but there may also exist one black circle that is <strong>chasing</strong> the green circle -- constantly moving through the display as if trying to catch or intercept it. Your job for each display will just be to decide <strong>whether there is a black circle chasing the green circle</strong>.</p>"+ 
		"<p>Critically, each animation will have many different black circles, but will last only a few seconds. As a result, you won't have time to carefully analyze each individual black circle (e.g. to follow it for a while in order to check if it is chasing the green circle). Instead, you'll have to base your answer on a more intuitive impression of whether there seem to be a 'chaser'.</p>"+
		"<p>Click on the video below, to see an example of what such a display might look like. In this demonstration video, there is a 'chaser' that we have marked in red to make it obvious. (In the actual experiment, though, the chaser will not be marked in red: it will look just like the other black circles.)</p>"+

		"<video controls width='455' height='455' style='border: 2px solid '><source src='images/instr_1chaser.mp4' type='video/mp4'></video>"+
		"</div>"],
    show_clickable_nav: true,
	on_load: function() { // go full screen
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
	},
};


var instructions_3 = {
    data: {test_part: 'instructions'},	
	type: "instructions",
	button_delay: [5000],
	pages: [
		"<div style = 'width : 1000px'> <h1>Instructions (3/5)</h1>" +
		"<p>And here is another demonstration video. In this video, <strong>no</strong> other circles are chasing the green circle. Click on the video below to view it.</p>"+ 
		"<video controls width='455' height='455' style='border: 2px solid '><source src='images/instr_0chaser.mp4' type='video/mp4'></video>"+

		"</div>"],
    show_clickable_nav: true,
	on_load: function() { // go full screen
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
	},
};

var instructions_4 = {
    data: {test_part: 'instructions'},	
	type: "instructions",
	button_delay: [5000],
	pages: two_afc 
        ? [
            "<div style='width:1000px'> <h1>Instructions (4/5)</h1>" +
            "<p>In the actual experiment, you will see videos just like the demonstrations that you just saw. During each video, <strong>your task will be to press the 'J' key if you see a circle chasing the green circle, and the 'F' key if no circle is chasing it.</strong></p>" +
            "<p>You can now try this for two practice displays. In these practice displays, we marked the 'chaser' in red to make it easier.</p>" +
            "</div>"
          ]
        : [
            "<div style = 'width : 1000px'> <h1>Instructions (4/5)</h1>" +
		    "<p>In the actual experiment, you will see videos just like the demonstrations that you just saw. During each video, <strong>your task will be to press the 'space' bar on your keyboard as soon as you see a circle chasing the green circle. If you do not see any circle chasing the green circle, then please do not press the 'space' bar</strong>.</p>"+ 
		    "<p>You can now try this for two practice displays. In these practice displays, we marked the 'chaser' in red to make it easier.</p>"+ 
		    "</div>"
          ],
    show_clickable_nav: true,
	on_load: function() { // go full screen
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
	},
};


var instructions_afterpractice = {
    data: {test_part: 'instructions'},	
    type: "instructions",
	button_delay: [2000],
	// type: "html-keyboard-response",
	pages: two_afc 
        ? [
            "<div style = 'width : 1000px'> <h1>Instructions (5/5)</h1>" +
            "<p>Well done! The real experiment will start in the next screen.</p>"+
            "<p>Remember, <strong>press the 'J' key as soon as</strong> you see a 'chaser'; and press the 'F' key as soon as possible if you do not see any chaser.</p>"+
            "<p>Sometimes, you may find it to be relatively easy to tell whether there is a 'chaser', since you'll immediately have a strong impression. But other times, the task may seem harder, and you may be much less certain about whether there is a chaser in the display.  That is okay! The experiment was designed to be difficult, and in those cases you should always keep trying your best.</p>"+
            "<p>The rest of the experiment is only about " + (lengthExp-4)+ " minutes long. So please remain as focused as possible until it is complete. Your performance is only useful to us if you try as hard as you can, and remain as focused as possible.</p>"+
            "<p>When you are ready, you can begin the experiment by clicking on 'Next' below.</p>"+
            "</div>"
          ]
        : [
            "<div style = 'width : 1000px'> <h1>Instructions (5/5)</h1>" +
            "<p>Well done! The real experiment will start in the next screen.</p>"+
            "<p>Remember, <strong>press the 'space' bar as soon as</strong> you see a 'chaser'; and do not press the 'space' bar if you do not see any chaser.</p>"+
            "<p>Sometimes, you may find it to be relatively easy to tell whether there is a 'chaser', since you'll immediately have a strong impression. But other times, the task may seem harder, and you may be much less certain about whether there is a chaser in the display.  That is okay! The experiment was designed to be difficult, and in those cases you should always keep trying your best.</p>"+
            "<p>The rest of the experiment is only about " + (lengthExp-4)+ " minutes long. So please remain as focused as possible until it is complete. Your performance is only useful to us if you try as hard as you can, and remain as focused as possible.</p>"+
            "<p>When you are ready, you can begin the experiment by clicking on 'Next' below.</p>"+
            "</div>"
          ],
    
	show_clickable_nav: true,
};

var debrief_difficulty_middle = {
	type: 'html-slider-response',
	data: {test_part: 'difficulty_halfway'},
    stimulus: '<div style = "width: 1000px"><p>On a scale of 1 to 100, how difficult was it to tell whether there was a chaser in the previous part of the experiment?</p>'+
	"<p>Note that you will receive compensation regardless of your reply; so please reply honestly -- this is the only way your data will be of use to us.</p>"+
	"<p>Use the slider bar below to indicate the difficulty.</p></div>",
    require_movement: true,
    labels: ['1 - Extremely easy', '50', '100 - Extremely difficult'],
	post_trial_gap: 100
};

var debrief_difficulty_end = {
	type: 'html-slider-response',
	data: {test_part: 'difficulty_end'},
    stimulus: '<div style = "width: 1000px"><p>On a scale of 1 to 100, how difficult was it to tell whether there was a chaser in the second part of the experiment (the part after we asked you this same question earlier)?</p>'+
	"<p>Note that you will receive compensation regardless of your reply; so please reply honestly -- this is the only way your data will be of use to us.</p>"+
	"<p>Use the slider bar below to indicate the difficulty.</p></div>",
    require_movement: true,
    labels: ['1 - Extremely easy', '50', '100 - Extremely difficult'],
	post_trial_gap: 100
};

var instructions_halfway = {
    data: {test_part: 'instructions'},	
	type: "instructions",
	button_delay: [5000],
    pages: two_afc 
    ? [
		"<div style = 'width : 1000px'> <h1>Instructions</h1>" +
		"<p>Good job!</p>"+ 
		"<p>In the next part of the experiment, you will be asked to do the exactly same task -- press the 'J' key as soon as</strong> you see a 'chaser'; and press the 'F' key if you do not see any chaser.</p>"+
		"<p>The only difference is that the circle that is potentially being chased is <strong>blue</strong> (while in the previous part is was green).</p>"+ 
		"<p>If you are ready to begin the next part of the experiment, click on 'Next>' .</p>"+ 
		"</div>"
        ]
    : [
		"<div style = 'width : 1000px'> <h1>Instructions</h1>" +
		"<p>Good job!</p>"+ 
		"<p>In the next part of the experiment, you will be asked to do the exactly same task -- press the 'space' bar as soon as</strong> you see a 'chaser'; and do not press the 'space' bar if you do not see any chaser.</p>"+
		"<p>The only difference is that the circle that is potentially being chased is <strong>blue</strong> (while in the previous part is was green).</p>"+ 
		"<p>If you are ready to begin the next part of the experiment, click on 'Next>' .</p>"+ 
		"</div>"
        ],
    show_clickable_nav: true,
	on_load: function() { // go full screen
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
		switchColor = 1; // change color of the circle to blue
	},
};

var notice_difference = {
	type: "survey-text",
	data: {test_part: 'noticeDifference'},
    questions: [
        {prompt: "<div style = 'width : 1000px'> <p>Well done!</p>"+
		"<p>Did you notice any difference between the first and second parts of the experiment (apart from the difference in color of one of the circles)? Reply with 1-2 sentences below.</p></div>", rows: 3, columns: 40, required: true}, 
    ],
};

var notice_volatility = {
	data: {test_part: 'noticeVolatility'},
	type: "html-button-response",
	stimulus: "<p>Actually, the two parts of the experiment differed from each other in the following way:</p>"+
	"<p>1. <strong>A '<u>simple</u>' part</strong>. In this part of the experiment, the likelihood of  a chaser being present was very <strong>simple and straightforward: 50/50</strong>. <br>That is, there seemed to always be a 50% chance that a chaser was present in each display.</p>"+
	"<p>2. <strong>A '<u>complex</u>' part</strong>. In this other part of the experiment, the likelihood of there being a chaser was <strong>more complex and unstable</strong>: <br>during some periods (e.g., a few minutes), you may be have been much more likely to see displays with chasing present than displays with chasing absent; <br><strong>whereas in other periods, this pattern may seem to have flipped!</strong> -- you were more likely to see displays with chasing absent than displays with chasing present.</p>"+
	"<p><strong><i>Did you notice this difference between the two parts of the experiment? If so, can you remember which was the simple part, and which was the complex part?</strong></i></p>"+
	"<p>Again, it is OK to not know/remember the answer -- you will still receive compensation. So please answer honestly.</p>"
	,
	choices: [
				"I did not notice any difference/I do not remember/I do not understand what you mean",
				"The first part was the <u>simple</u> part, and the second part was the <u>complex</u> part",
				"The first part was the <u>complex</u> part, and the second part was the <u>simple</u> part"
			],	
};



var gender = {
	data: {test_part: 'demographic-gender'},
	type: "html-button-response",
	stimulus: "What is your gender?", 
	choices: [
				"male",
				"female",
				"non-binary",
				"prefer not to say"
			],	
};

var age = {
	type: "survey-text",
	data: {test_part: 'demographic-age'},
    questions: [
        {prompt: "How old are you? Please type the number in the space below.", rows: 1, columns: 5, required: true}, 
    ],
};

var yearsOfEducation = {
	type: "survey-text",
	data: {test_part: 'demographic-education'},
    questions: [
        {prompt: "How many years of formal education have you had after high school? Please type the number in the space below.", rows: 1, columns: 5, required: true}, 
    ],
};

var videoGames = {
	type: "html-button-response",
	data: {test_part: 'demographic-videogames'},
	stimulus: "How often do you play video games?", 
	choices: ["Never", "Once", "Several times", "Fairly often", "Very often"],	
};



var is_firefox = typeof InstallTrigger !== 'undefined';
var isIE = /*@cc_on!@*/false || !!document.documentMode;

/////// TIMELINE ////////
var timeline = []


if (!skip_welcome){
	if ((is_firefox || isIE)){
		timeline.push(browser_check);
	}		
	timeline.push(consentform); 				// consent form
	timeline.push(instructions_0);				// instructions
}
if (!skip_instructions){
	timeline.push(instructions_1);				// instructions		
	timeline.push(instructions_2);				// instructions		
	timeline.push(instructions_3);				// instructions		
	timeline.push(instructions_4);				// instructions		
	
	var practiceVideos = test_videos.slice(0, 2);

    practiceVideos.forEach(videoStim => {
        timeline.push(fixation_cross, makeVideoTrial(videoStim));
    });

	timeline.push(instructions_afterpractice);	// instructions	
}

test_videos.forEach(videoStim => {
    timeline.push(fixation_cross, makeVideoTrial(videoStim));
});

timeline.push(debrief_difficulty_middle);						
timeline.push(instructions_halfway);						

test_videos.forEach(videoStim => {
    timeline.push(fixation_cross, makeVideoTrial(videoStim));
});

timeline.push(debrief_difficulty_end);				

timeline.push(notice_difference);						
timeline.push(notice_volatility);						

timeline.push(smoothDisplay);									

timeline = timeline.concat(timeline_survey)

timeline.push(focusQuestion);									
timeline.push(question1);									
timeline.push(question2);									
timeline.push(question3);		


/* save some final subject-level data */
timeline.push({
    type: 'call-function',
    func: function() {},
    on_finish: function(data){
        data.test_part = 'summary';
        data.user_agent = navigator.userAgent;
        data.trial_part = 'interaction_data';
		data.interaction_data = jsPsych.data.getInteractionData().json(); // long string, so save only once
		data.browser = navigator.sayswho= (function(){   // detect browser
            var ua= navigator.userAgent, tem,
            M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
            if(/trident/i.test(M[1])){
                tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
                return 'IE '+(tem[1] || '');
            }
            if(M[1]=== 'Chrome'){
                tem= ua.match(/\b(OPR|Edge?)\/(\d+)/);
                if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera').replace('Edg ', 'Edge ');            
            }
            M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
            if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
            return M.join(' ');
        })();
    }
});

timeline.push({												// end recording data 
	type: 'call-function',
	func: saveDataWrap,
});

timeline.push(debrief_block);									


jsPsych.init({      
	timeline: timeline,        
});
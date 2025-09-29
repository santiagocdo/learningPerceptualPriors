// debriefing questions and attention questions
// new 14/8/2024: changed two variable names: smoothDisplay and focusQuestion

// debriefing 
var purposeQuestion = {
	type: "survey-text",
	data: {test_part: 'purpose'},
    questions: [
        {prompt: 		"<p>Well done! We just have a few more questions: </p>"+
		"<p>What do you think was the purpose of this experiment? Reply with 1-2 sentences.</p>", rows: 3, columns: 40, required: true}, 
    ],
};

var strategyQuestion = {
	type: "survey-text",
	data: {test_part: 'strategy'},
    questions: [
        {prompt: 	"<p>Did you find yourself using any strategies? Respond in one sentence.</p>", rows: 3, columns: 40, required: true}, 
    ],
};

var clarityquestion = {
    type: "html-button-response",
    data: {test_part: 'clarity'},
	stimulus: 
		"<p>Were the instructions clear?</p>",
	choices: ['Yes', 'No', 'Not clear in the beginning, but became clear after a while'],	
	post_trial_gap: 100
};



// Attention questions
var smoothDisplay = {
    type: "html-button-response",
    data: {test_part: 'smoothness'},
	stimulus: 
		"<p>Were the videos displayed smoothly?</p>",
	choices: ['Yes', 'No', 'Yes overall, but they stutter occasionally'],	
	post_trial_gap: 100,
		on_load: function() {
			document.body.style.cursor = 'auto'		
		}
};

var focusQuestion = {
	type: 'html-slider-response',
	data: {test_part: 'concentration'},
    stimulus: '<p>On a scale of 1 to 100, how much were you able to stay focused through the experiment (indicate with the slider bar below)?</p>' +
	'<p>You will receive compensation regardless of your answer, so please answer honestly.</p>',
    require_movement: true,
    labels: ['1 - Not focused at all', '50', '100 - Fully focused throughout'],
	post_trial_gap: 100
};


var question1 = {
	type: "html-button-response",
	data: {test_part: 'attention', correct_response: "2", NAttention: 1},
	stimulus: 
		"<p>How many legs do elephants have?</p>",
	choices: ['One', 'Nine', 'Four'],	
	on_finish: function(data){
		if(data.button_pressed == data.correct_response){
			data.correct = '1';
		} else {
			data.correct = '0';
		}
	},
	post_trial_gap: 100
};

var question2 = {
	type: "html-button-response",
	data: {test_part: 'attention', correct_response: "0", NAttention: 2},
	stimulus: 
	"<p>Which continent is Canada located in?</p>",
	choices: ['North America', 'Asia', 'Europe'],	
	on_finish: function(data){
		if(data.button_pressed == data.correct_response){
			data.correct = '1';
		} else {
			data.correct = '0';
		}
	},
	post_trial_gap: 100
};

var question3 = {
	type: "html-button-response",
	data: {test_part: 'attention', correct_response: "1", NAttention: 3},
	stimulus: 
		"<p>My uncle is</p>",
	choices: ['my son', 'the brother of my father/mother', 'my grandmother'],	
	on_finish: function(data){
		if(data.button_pressed == data.correct_response){
			data.correct = '1';
		} else {
			data.correct = '0';
		}
		
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) { /* Safari */
			document.webkitExitFullscreen();
		} else if (document.msExitFullscreen) { /* IE11 */
			document.msExitFullscreen();
		}

	},
	post_trial_gap: 100
};



var debrief_block = {
	type: "html-keyboard-response",
	stimulus: function() {
		return "<p>Great job! You're done! Thank you for your participation.</p>"+
		"<p>You should have exited full screen mode. If not, press F11 or Fn + F11 (or Command + Control + F for Mac).</p>"+
		"<p>Please click <strong> <a href = 'https://app.prolific.com/submissions/complete?cc=C6DO97SV'>here</a></strong> to be redirected to Prolific.</p>" +
		"<p>If the link doesn't work, please copy paste the code 'C6DO97SV' on Prolific or go to the address: https://app.prolific.com/submissions/complete?cc=C6DO97SV.</p>"
	},
	choices: jsPsych.NO_KEYS,
	on_load: function() {
		// var elem = document.documentElement;

		// if (document.exitFullscreen) {
		// 	document.exitFullscreen();
		// } else if (document.webkitExitFullscreen) { /* Safari */
		// 	document.webkitExitFullscreen();
		// } else if (document.msExitFullscreen) { /* IE11 */
		// 	document.msExitFullscreen();
		// }
	}
};





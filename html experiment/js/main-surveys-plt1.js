// Perceiving divine presence
// Surveys
// By Dawei Bai 7/2025	

// spiritual events + R-GPTS


const response_after_delay = 2000 // options clickable after XX milliseconds


var spiritual_events_options = ["Never", "Once", "Several times", "Fairly often", "Very often"]

var spiritual_events_items= [
	"Have you ever heard God or a spirit speak to you in a voice you felt you heard outside your head?",
	"Have you heard God or a spirit speak to you in a voice that you felt you experienced inside your head?",
	"Have you felt that God or a spirit placed thoughts inside your head?",
	"Have you ever had a vision, that is, seen something not quite in your mind, that you felt was given to you by God or a spirit?",
	"Have you ever felt that God or a spirit placed an image inside your head?",
	"Have you ever felt that God or a spirit touch you, maybe on the shoulder or the hand, in a way you felt on your body?",
	"Have you ever felt that you smelled God or a spirit? That is, have you ever smelled something that is not of this material world?",
	"Have you ever felt that you tasted God or a spirit?",
	"Have you ever had a dream you felt was sent by God or a spirit?",
	"Have you ever felt God or a spirit near-tangibly present, as if standing there by your side?",
	"Have you ever felt a demonic presence as if it was there in the room with you?",
	"Have you ever experienced a supernatural presence that was not God, a spirit, or a demon?",
	"Have you ever had an experience of uncontrollable shaking or trembling during prayer, or been slain in the spirit?",
	"Have you ever had a feeling of overwhelming emotion during prayer?",
	"Have you ever had a sense of intense power shoot through you during prayer?",
	"Have you ever had an out-of-body experience, in which you were separated from your body and you could see your body from the outside?",
	"Have you ever felt that a supernatural force, like the Holy Spirit or a demon, took control of your body, so that you were not making the choice of whether to move but still you moved?",
	"Have you ever had the experience of being awake but unable to move?",
	"Have you ever experienced the presence of God through pain (such as headaches, bodily aches and pains, stomachaches)?",
	"Have you ever experienced the presence of God through illness (including as warning or punishment)?",
	"Have you ever experienced the presence of God in a miraculous healing (that you saw in person, not on television)?",
	"Have you ever experienced the presence of God through your own miraculous healing?"
]

var RGPTS_generic_prompt = "<p>The statement below refers to thoughts and feelings you may have had about others over the last month.</p> <p>Think about the last month and indicate the extent of these feelings from 0 (Not at all) to 4 (Totally).</p>"
var RGPTS_options = ["0 - Not at all", "1", "2", "3", "4 - Totally"]

var RGPTS_items = [
	"I spent time thinking about friends gossiping about me.",
	"I often heard people referring to me.",
	"I have been upset by friends and colleagues judging me critically.",
	"People definitely laughed at me behind my back.",
	"I have been thinking a lot about people avoiding me.",
	"People have been dropping hints for me.",
	"I believed that certain people were not what they seemed.",
	"People talking about me behind my back upset me.",
	"Certain individuals have had it in for me.",
	"People wanted me to feel threatened, so they stared at me.",
	"I was certain people did things in order to annoy me.",
	"I was convinced there was a conspiracy against me.",
	"I was sure someone wanted to hurt me.",
	"I couldn't stop thinking about people wanting to confuse me.",
	"I was distressed by being persecuted.",
	"It was difficult to stop thinking about people wanting to make me feel bad.",
	"People have been hostile towards me on purpose.",
	"I was angry that someone wanted to hurt me."
]

var survey_intro = {
    data: {test_part: 'survey-intro'},
    type: "instructions",
	button_delay: [5000],
	pages: [
		"<div style = 'width : 1000px;'>" +
		"<p>Good job!</p>"+
		"<p>You are about to begin the last part of the experiment. This part will only take about 6 minutes.</p>"+
		"<p>You will now be asked a series of questions about certain personal experiences you may or may not have had in your life. For each question, you will be given some options to choose from. Please just select the option that best applies to you. (There are no right or wrong answers here, and different people can have very different responses - which is completely fine.)</p>"+
		"<p>Your responses will remain completely anonymous, so please reply honestly - this is the only way your participation will be useful to our scientific research.</p>"+
		"<p>If you are ready, you may begin by pressing the 'Next' button below.</p>"+
		"</div>"],
	show_clickable_nav: true,
};

var survey_intro_middle = {
    data: {test_part: 'survey-intro'},
    type: "instructions",
	button_delay: [5000],
	pages: [
		"<div style = 'width : 1000px;'>" +
		"<p>The next questions are about certain religious or spiritual experiences you may or may not have had in your life. For each question, you will be given some options to choose from. Please just select the option that best applies to you. (Again, there are no right or wrong answers here, and different people can have very different responses - which is completely fine.)</p>"+
		"<p>If you are ready, you may begin by pressing the 'Next' button below.</p>"+
		"</div>"],
	show_clickable_nav: true,
};

// religiosity
var religiosity_general = {
    data: {test_part: 'religiosity_general'},
	type: "html-button-response",
	margin_vertical: 0,
	button_delay: [response_after_delay],
	stimulus: "<p>I consider myself a religious or spiritual person.</p>", 
	choices: ["Strongly disagree", "Disagree", "Neither agree nor disagree", "Agree", "Strongly agree"],	
	post_trial_gap: 100,
};

var religiosity_lens = {
    data: {test_part: 'religiosity_lens'},
	type: "html-button-response",
	margin_vertical: 0,
	button_delay: [response_after_delay],
	stimulus: "<p>How often do you look at life from a religious or spiritual perspective?</p>", 
	choices: ["Never", "Sometimes", "Most of the time"],	
	post_trial_gap: 100,
};

var religiosity_practice = {
    data: {test_part: 'religiosity_practice'},
	type: "html-button-response",
	margin_vertical: 0,
	button_delay: [response_after_delay],
	stimulus: "<p>Do you engage in practices such as meditation or prayer?</p>", 
	choices: ["No","Yes; at least once every year", "Yes; at least once every month", "Yes; at least once every week", "Yes; at least once every day"],	
	post_trial_gap: 100,
};


/////// TIMELINE ////////
var timeline_survey = []


timeline_survey.push(survey_intro)

for (var i = 0; i < RGPTS_items.length; i++) { 
	var RGPTS = {
		type: "survey-likert",
		button_delay: [response_after_delay],
		data: {test_part: 'RGPTS'},
		questions: [
			{
				prompt: RGPTS_generic_prompt+"<i>"+RGPTS_items[i]+"</i>",
				name: "RGPTS_" + i,
				labels: RGPTS_options,
				required: true,
			}
		],
		post_trial_gap: 100
	};
	// var RGPTS = {
	// 	type: "html-button-response",
	// 	button_delay: [response_after_delay],
	// 	data: {test_part: 'RGPTS'},
	// 	stimulus: 
	// 	RGPTS_generic_prompt+RGPTS_items[i],
	// 	choices: RGPTS_options,	
	// 	post_trial_gap: 100
	// };
	timeline_survey.push(RGPTS)
}

timeline_survey.push(survey_intro_middle)

for (var i = 0; i < spiritual_events_items.length; i++) { 
	var spiritual_events = {
		type: "html-button-response",
		button_delay: [response_after_delay],
		data: {test_part: 'spiritual-events'},
		stimulus: 
			spiritual_events_items[i],
		choices: spiritual_events_options,	
		post_trial_gap: 100
	};
	timeline_survey.push(spiritual_events)
}

timeline_survey.push(religiosity_general)
timeline_survey.push(religiosity_lens)
timeline_survey.push(religiosity_practice)


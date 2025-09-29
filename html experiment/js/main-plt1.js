// Chasing perception and paranoia
// By Dawei Bai 7/2025	

// TODO for next version:
// 1. the first volatile miniblock is always chaserMiniBlock_80chasing
// 2. chaserMiniBlock_80chasing is actually 20% chasing. Vice versa for chaserMiniBlock_20chasing

var skip_welcome 		= false;
var skip_instructions 	= false;
var debug_mode			= false;

var N_test_Trial	 	 = 96

const ProjName	 = "ChasingPerceptionAndParanoia"
const expVersion = "Pilot1"
const lengthExp  = 20
// const trial_length = 1000 
const trial_length = 5 * 1000 

const canvasToScreenRatio = 0.90

// size up the frame
var window_innerwidth 	= screen.width
var window_innerheight 	= screen.height

if (window_innerheight < window_innerwidth) {
	canvas_height 		= window_innerheight * canvasToScreenRatio
	canvas_width  		= canvas_height
	canvas_size_coef 	= canvas_height/600 // canvas_size_coef is how much the canvas needs to size up or down compared to a 600x600 canvas
} else {
	canvas_width 		= window_innerwidth * canvasToScreenRatio
	canvas_height  		= canvas_width
	canvas_size_coef 	= canvas_width/600
}

var upperborder 
var lowerborder 
var leftborder  
var rightborder 

// resize canvas
function resize() {
	window_innerwidth 	= screen.width
	window_innerheight 	= screen.height

	if (window_innerheight < window_innerwidth) { 
		canvas.height 	= window_innerheight * canvasToScreenRatio
		canvas.width 	= canvas.height;
		canvas_height = canvas.height;
		canvas_width  = canvas.width;
		canvas_size_coef 	= canvas_height/600;
	} else {
		canvas.width 	= window_innerwidth * canvasToScreenRatio
		canvas.height 	= canvas.width;
		canvas_height = canvas.height;
		canvas_width  = canvas.width;
		canvas_size_coef 	= canvas_height/600;
	}
	canvas.style.left 	= (window_innerwidth/2 - canvas_width/2 ) + "px"
	canvas.style.top 	= (window_innerheight/2 - canvas_height/2 ) + "px"

	upperborder = window_innerheight/2 - canvas_height
	lowerborder = window_innerheight/2 + canvas_height
	leftborder  = window_innerwidth/2 - canvas_width/2
	rightborder = window_innerwidth/2 + canvas_width/2
}

// parameters
const fps = 60
const msPerFrame = 1000 / fps

const 

	N_dots_total = 19, //N of dots other than the sheep
	
	Distractor_speed_upper_limit_x 		= canvas_size_coef * 3.5 * 0.6,
	Distractor_speed_lower_limit		= canvas_size_coef * 1.8 * 0.6,
	Distractor_speed_change_likelihood 	= 0.15,
	Distractor_speed_change_limit		= 0.5, 
	Distractor_start_distance_from_center = canvas_width * 0.2, 
	Distractor_color 					= "black",
	Distractor_angle_change_max			= Math.PI/2,
	Distractor_linewidth 				= 3,
	
	Chaser_start_distance_from_center 	= canvas_width * 0.3, 
	
	Chaser_radius 					= canvas_size_coef * 12,
	Chaser_motion_noise_level 		= canvas_size_coef * 0.1,
	Chaser_initial_speed 			= canvas_size_coef * 2,
	Chaser_final_speed 				= Chaser_initial_speed * 1.667,
	
	Chaser_destination_update_lower = 200,
	Chaser_destination_update_upper = 800,
	

	Target_radius 		= Chaser_radius,
	Target_linewidth 	= 5,
	Target_destination_update_lower = 100,
	Target_destination_update_upper = 400,

	target_init_posX = canvas_width/2 + Target_radius,
	target_init_posY = canvas_height/2 + Target_radius,

	start_detecting_catching = 800, 
	safety_margin = 10, // to avoid getting stuck at the edges

	fixation_duration = 800,
	start_listening_for_keypress = 500 // time to wait before listening for keypresses

var wolf_AngleToTarget 			=	0
var Chaser_speed 				= Chaser_initial_speed
var chaser_to_target_v_ratio_upper = 2
var chaser_to_target_v_ratio_lower = 1.2
var Target_speed_limit 			= Chaser_speed * chaser_to_target_v_ratio_upper
var Target_speed_lower_limit 	= Chaser_speed * chaser_to_target_v_ratio_lower
var speed_increase_window 		= 10*1000


let t_stopper, t1, t0
var stopID

//////////// trial structure ////////////
var N_miniblocks		 = 8

var chaserMiniBlock_80chasing = [0, 0, 0, 0, 0, 1]
var chaserMiniBlock_20chasing = [1, 1, 1, 1, 1, 0]
var chaserMiniBlock_50chasing = [1, 1, 1, 0, 0, 0]

var chasingTrialsShuffled = []
var volatileEnvironmentFirst = Math.random()>0.5

var practice_chasing_first = Math.random()>0.5

if (practice_chasing_first)  {
	chasingTrialsShuffled = [1,0]
} else {
	chasingTrialsShuffled = [0,1]
}

if (volatileEnvironmentFirst) {
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	
	for (i = 0; i < N_miniblocks; i++) { 
		chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_50chasing, 1));
	}
} else {
	for (i = 0; i < N_miniblocks; i++) { 
		chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_50chasing, 1));
	}
	
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_80chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
	chasingTrialsShuffled =  chasingTrialsShuffled.concat(jsPsych.randomization.repeat(chaserMiniBlock_20chasing, 1));
}

var chasingSubtlety = "30"

var N_practice_trial = 2

/////////////////////////

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


function saveData(id, data){									// record data 
	var xhr = new XMLHttpRequest();
		xhr.open("POST", "write_data.php"); 
		xhr.setRequestHeader("Content-Type", "application/json");
		xhr.send(JSON.stringify({fileid: id, filedata: data, projname: expVersion}));
}

function saveDataWrap(){
	saveData(subjectId, jsPsych.data.get().csv());
}

var subjectId = jsPsych.randomization.randomID(8);
	jsPsych.data.addProperties({subject: subjectId, prolificID: prolific_PID, proj_name: ProjName, exp_version: expVersion});
	
// utility functions
function drawTarget(c, drawX, drawY) {
	c.lineWidth = Target_linewidth

	if (switchColor == 0) {
		c.strokeStyle = "green"
	} else {
		c.strokeStyle = "blue"
	}

	c.beginPath();
	c.ellipse(drawX, drawY, Target_radius, Target_radius, 0, 0, 2 * Math.PI);
	// c.fill();
	c.stroke();
	c.closePath();
}

function drawChaser(c, drawX, drawY, color) {
	// c.strokeStyle = color
	c.beginPath();
	c.lineWidth = Distractor_linewidth
	// c.lineWidth = Target_linewidth
	if (debug_mode) {
		c.strokeStyle = "red"
	} else if (trialCounter < (N_practice_trial+1)) {
		c.strokeStyle = "red"
	} else {
		c.strokeStyle = color
	}

	c.ellipse(drawX, drawY, Chaser_radius, Chaser_radius, 0, 0, 2 * Math.PI);
	// c.fill();
	c.stroke();
	c.closePath();
}

function drawDistractor(c, drawX, drawY) {
	c.beginPath();
	c.lineWidth = Distractor_linewidth
	c.strokeStyle = Distractor_color
	c.ellipse(drawX, drawY, Chaser_radius, Chaser_radius, 0, 0, 2 * Math.PI);
	// c.fill();
	c.stroke();
	c.closePath();
}
var trialHasFinished = 0

// end trial if space pressed
function endTrial(e) {  
	if  (e.keyCode == '32') { //if press 'space'
		// save data
		t1 = performance.now()
		reactionTime = t1 - begin_trial_time
		// console.log("begin trial time ",begin_trial_time)
		console.log("reaction time: " + reactionTime, trialCounter)
		jsPsych.data.write({rt: reactionTime, trial: trialCounter, reportChasing: 1, chasingIsPresent: chasingTrialsShuffled[trialCounter -1]})    
		// console.log(chasingTrialsShuffled[trialCounter -1])
		document.removeEventListener('keydown', endTrial)

		cancelAnimationFrame(stopID)        
		isListening = 0

		trialHasFinished = 1
		jsPsych.finishTrial()
	} 
}

function squareIt(number) {
	return number * number;
 }

function angleToArc(angle) {
	return (angle/180) * Math.PI;
}

function randomFromRange(lowerLim, UpperLim) {
	return Math.random() * (UpperLim-lowerLim) + lowerLim ;
}

function getDistance(x1, y1, x2, y2) {
	return Math.sqrt(squareIt(x1-x2) + squareIt(y1 - y2));
}

var trialCounter = 0

var target_destination_posX = target_init_posX - Target_radius
var target_destination_posY = target_init_posY - Target_radius

var begin_trial_time
var switchColor = 0

display = function() {    
	t0 = performance.now()
	N_chasers = chasingTrialsShuffled[trialCounter]

	N_distractors = N_dots_total - N_chasers
	
	var canvas  = document.getElementById('canvas');
	var c 		= canvas.getContext('2d');

	resize()

	// for recording sheep locations
	var sheep_location_x = []
	var sheep_location_y = []


	var isListening = 0

	var target_current_posX = target_destination_posX
	var target_current_posY = target_destination_posY

	var sheep_initial_posX = target_current_posX
	var sheep_initial_posY = target_current_posY

	var target_v = randomFromRange(Target_speed_lower_limit, Target_speed_limit)
	var target_v_angle = Math.random() * Math.PI *2

	var target_vX = target_v * Math.cos(target_v_angle) 
	var target_vY = target_v * Math.sin(target_v_angle)

	var target_v_angle_change
	var target_v_change 

	// var target_angle_to_destination
	var target_nextChangeTime = randomFromRange(Target_destination_update_lower, Target_destination_update_upper)

	var chaser_destination_x = target_current_posX
	var chaser_destination_y = target_current_posY

	var chasingAngleOffsetMax = chasingSubtlety * Math.PI/180

	var	chaser_x = []
	var	chaser_y = []
	var Chaser_nextChangeTime = []
	var chaserToTargetAngle = []
	var chasingAngleOffset = [] 
	var chaser_vx = []
	var chaser_vy = []
	var Chaser_speed = []
	var chaserLocationStartTime = [] 

	var	chaser_x_temp 
	var	chaser_y_temp 	
	var Chaser_nextChangeTime_temp
	var chaserToTargetAngle_temp
	var chasingAngleOffset_temp
	var chaser_vx_temp
	var chaser_vy_temp

	var general_chaser_speed = Chaser_initial_speed

	var chaser_initial_posX = NaN
	var chaser_initial_posY = NaN

	for (let chaser_id = 0; chaser_id< N_chasers; chaser_id ++) {
		chaserLocationStartTime.push(performance.now())

		chaser_x_temp = randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
		chaser_y_temp = randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
		
		while (getDistance(chaser_x_temp, chaser_y_temp, target_init_posX, target_init_posY)< Chaser_start_distance_from_center)  {
			chaser_x_temp =  randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
			chaser_y_temp =  randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
		}
		
		Chaser_nextChangeTime_temp = 0
		// Chaser_nextChangeTime_temp = randomFromRange(Chaser_destination_update_lower, Chaser_destination_update_upper)

		chaser_x.push(chaser_x_temp)
		chaser_y.push(chaser_y_temp)

		chaser_initial_posX = chaser_x_temp
		chaser_initial_posY = chaser_y_temp

		Chaser_nextChangeTime.push(Chaser_nextChangeTime_temp)

		chaserToTargetAngle_temp = Math.atan((chaser_destination_y - chaser_y)/(chaser_destination_x - chaser_x))
		chasingAngleOffset_temp =randomFromRange(-chasingAngleOffsetMax, + chasingAngleOffsetMax)

		chaserToTargetAngle_temp+= chasingAngleOffset_temp

		Chaser_speed[chaser_id] = Chaser_initial_speed

		if ((chaser_destination_x - chaser_x_temp) <0) {
			chaser_vx_temp = -Chaser_initial_speed * Math.cos(chaserToTargetAngle_temp)
			chaser_vy_temp = -Chaser_initial_speed * Math.sin(chaserToTargetAngle_temp)
	
		} else {
			chaser_vx_temp = Chaser_initial_speed * Math.cos(chaserToTargetAngle_temp)
			chaser_vy_temp = Chaser_initial_speed * Math.sin(chaserToTargetAngle_temp)
		}

		chaser_vx.push(chaser_vx_temp)
		chaser_vy.push(chaser_vy_temp)

	}


	// console.log(target_current_posX/canvas_size_coef, target_current_posY/canvas_size_coef, chaser_x/canvas_size_coef, chaser_y/canvas_size_coef)

	// (actual) chaser stuff
	// var	chaser_x =  randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
	// var	chaser_y =  randomFromRange(Target_radius+safety_margin, canvas_width-Target_radius -safety_margin)
	
	var timeNow
	var targetLocationStartTime = performance.now()


	begin_trial_time = performance.now()
	var chaserColor = Distractor_color
	
	// draw target
	function targetMove() {
		Target_speed_limit = general_chaser_speed * chaser_to_target_v_ratio_upper
		Target_speed_lower_limit = general_chaser_speed * chaser_to_target_v_ratio_lower

		timeNow = performance.now()
		targetLocationStartTime = performance.now()

		trialAdvanceTimeCounter = performance.now()
		// add event listener for pressing spacebar
		if (timeNow - t0 >= start_listening_for_keypress) {
			if (isListening == 0) {
				document.addEventListener('keydown', endTrial);
				isListening = 1
				trialHasFinished = 0
			}		
		}  
		if ((timeNow - t0> trial_length) && (trialHasFinished == 0)) {
			cancelAnimationFrame(stopID)        
			jsPsych.data.write({rt: "NA", trial: trialCounter, reportChasing: 0, chasingIsPresent: chasingTrialsShuffled[trialCounter -1]})    
			// console.log(chasingTrialsShuffled[trialCounter -1])
			document.removeEventListener('keydown', endTrial)
			jsPsych.finishTrial()
			trialHasFinished = 1
			// console.log(chaser_x, chaser_y)
		}

		if (targetLocationStartTime > target_nextChangeTime) {
			target_v_angle_change = (Math.random()-0.5) * (Math.PI/2)

			if (target_v_angle_change< 0) {
				target_v_angle_change += Math.PI*2
			} else if (target_v_angle_change > Math.PI*2) {
				target_v_angle_change -= Math.PI *2
			}

			target_v_angle += target_v_angle_change

			// absolute speed change
			target_v_change = (Math.random()*0.1 - 0.05) * Target_speed_limit
			target_v += target_v_change

			if (target_v > Target_speed_limit) { 
				target_v = Target_speed_limit
			} else if (target_v < Target_speed_lower_limit) {
				target_v = Target_speed_lower_limit
			}

			target_vX = target_v * Math.cos(target_v_angle)
			target_vY = target_v * Math.sin(target_v_angle)

			targetLocationStartTime = performance.now()
			target_nextChangeTime = targetLocationStartTime + randomFromRange(Target_destination_update_lower, Target_destination_update_upper)
		}

		if ((target_current_posX+ Target_radius)>= canvas_width) {
			target_vX = -Math.abs(target_vX)
			if (target_v_angle <Math.PI)  {
				target_v_angle = Math.PI - target_v_angle
			} else {
				target_v_angle = Math.PI * 2 - (target_v_angle -  Math.PI)
			}
		}
		if ((target_current_posX- Target_radius)<= 0) {
			target_vX = Math.abs(target_vX)
			if (target_v_angle <Math.PI)  {
				target_v_angle = Math.PI - target_v_angle
			} else {
				target_v_angle = Math.PI * 2 - (target_v_angle -  Math.PI)
			}
		}
		if ((target_current_posY+ Target_radius)>= canvas_height) {
			target_vY = -Math.abs(target_vY)
			target_v_angle = Math.PI*2 - target_v_angle
			target_v_angle = Math.PI - target_v_angle
		}
		if ((target_current_posY- Target_radius)<= 0) {
			target_vY = Math.abs(target_vY)
			target_v_angle = Math.PI*2 - target_v_angle
			target_v_angle = Math.PI - target_v_angle
		}

		// target_vX += (Math.random()-0.5) * Chaser_motion_noise_level
		// target_vY += (Math.random()-0.5) * Chaser_motion_noise_level 
		target_current_posX += target_vX
		target_current_posY += target_vY

		sheep_location_x.push(Math.round(target_current_posX))
		sheep_location_y.push(target_current_posY)

		drawTarget(c, target_current_posX, target_current_posY)

		// randomly get chaser's offset angle
			
		// ############# chaser #############
		// update speed in the first 10 seconds
		general_chaser_speed = ((timeNow- t0)/speed_increase_window) * (Chaser_final_speed - Chaser_initial_speed) + Chaser_initial_speed
		for (let chaser_id = 0; chaser_id< N_chasers; chaser_id ++) {
			chasingAngleOffset[chaser_id] =randomFromRange(-chasingAngleOffsetMax, + chasingAngleOffsetMax)

			// if ((timeNow - t0) < speed_increase_window) {
				Chaser_speed[chaser_id] = ((timeNow- t0)/speed_increase_window) * (Chaser_final_speed - Chaser_initial_speed) + Chaser_initial_speed
			// }
			// move chaser
			if (timeNow - chaserLocationStartTime[chaser_id] >= Chaser_nextChangeTime[chaser_id]) {
				chaser_destination_x = target_current_posX
				chaser_destination_y = target_current_posY
				chaserToTargetAngle[chaser_id] = Math.atan((chaser_destination_y - chaser_y[chaser_id])/(chaser_destination_x - chaser_x[chaser_id]))

				if ((chaser_destination_x - chaser_x[chaser_id]) <0) {
					chaser_vx[chaser_id] = -Chaser_speed[chaser_id] * Math.cos(chaserToTargetAngle[chaser_id] + chasingAngleOffset[chaser_id])
					chaser_vy[chaser_id] = -Chaser_speed[chaser_id] * Math.sin(chaserToTargetAngle[chaser_id] + chasingAngleOffset[chaser_id])
				} else {
					chaser_vx[chaser_id] = Chaser_speed[chaser_id] * Math.cos(chaserToTargetAngle[chaser_id] + chasingAngleOffset[chaser_id])
					chaser_vy[chaser_id] = Chaser_speed[chaser_id] * Math.sin(chaserToTargetAngle[chaser_id] + chasingAngleOffset[chaser_id])
				}
				chaserLocationStartTime[chaser_id] = performance.now()
				Chaser_nextChangeTime[chaser_id] = randomFromRange(Chaser_destination_update_lower, Chaser_destination_update_upper)
			}

			chaser_vx[chaser_id] += (Math.random()-0.5) * Chaser_motion_noise_level
			chaser_vy[chaser_id] += (Math.random()-0.5) * Chaser_motion_noise_level

			chaser_x[chaser_id] += chaser_vx[chaser_id]
			chaser_y[chaser_id] += chaser_vy[chaser_id]

			// bounce back if reach edges
			if (chaser_x[chaser_id] <= Chaser_radius) {
				chaser_vx[chaser_id] = Math.abs(chaser_vx[chaser_id])
			}  
			
			if (chaser_x[chaser_id] >= canvas_width-Chaser_radius) {
				chaser_vx[chaser_id] = - Math.abs(chaser_vx[chaser_id])
			}
			
			if (chaser_y[chaser_id] <= Chaser_radius) {
				chaser_vy[chaser_id] = Math.abs(chaser_vy[chaser_id])
			} 
			if (chaser_y[chaser_id] >= canvas_height-Chaser_radius) {
				chaser_vy[chaser_id] = - Math.abs(chaser_vy[chaser_id])
			}

			drawChaser(c, chaser_x[chaser_id], chaser_y[chaser_id], chaserColor)
		}
	}
			
	// Big bad wolves 
	function Distractor(x,y) {
		this.x = x
		this.y = y

		this.locationStartTime = performance.now()

		this.vAngle =  randomFromRange(0, Math.PI*2)

		this.vX = general_chaser_speed * Math.cos(this.vAngle)
		this.vY = general_chaser_speed * Math.sin(this.vAngle)
	
		this.new_wolf_vx = this.vX
		this.new_wolf_vy = this.vY
		
		this.changeSpeedNow
		this.distanceToTarget

		this.d_vAngle
		
		this.update = function() {
			this.changeSpeedNow = Math.random() < Distractor_speed_change_likelihood
			
			if (this.changeSpeedNow) {
				this.d_vAngle = randomFromRange(-Distractor_angle_change_max, Distractor_angle_change_max)
				this.vAngle += this.d_vAngle
			}

			this.vX = general_chaser_speed * Math.cos(this.vAngle)
			this.vY = general_chaser_speed * Math.sin(this.vAngle)

			this.timeNow = performance.now()

			// bounce back if reach edges
			if (this.x <= Chaser_radius) {
				this.vAngle = Math.PI - this.vAngle
				this.vX = Math.abs(this.vX)
				this.new_wolf_vx = Math.abs(this.new_wolf_vx)
			}  
			
			if (this.x >= canvas_width-Chaser_radius) {
				this.vAngle = Math.PI - this.vAngle
				this.vX = - Math.abs(this.vX)
				this.new_wolf_vx = - Math.abs(this.new_wolf_vx)
			}
			
			if (this.y <= Chaser_radius) {
				this.vAngle = Math.PI*2 - this.vAngle
				this.vY = Math.abs(this.vY)
				this.new_wolf_vy = Math.abs(this.new_wolf_vy)				
			} 
			if (this.y >= canvas_height-Chaser_radius) {
				this.vAngle = Math.PI*2 - this.vAngle
				this.vY = - Math.abs(this.vY)
				this.new_wolf_vy = - Math.abs(this.new_wolf_vy)
			}

			// move it!
			this.x = this.x + this.vX
			this.y = this.y + this.vY

			// compute distance between self and wolf 
			this.distanceToTarget = getDistance(this.x, this.y, target_current_posX, target_current_posY)

			drawDistractor(c, this.x, this.y)
		}
	}

	let distractorArray = []

	var distractor_starting_x
	var distractor_starting_y

	var distractor_starting_x_set = []
	var distractor_starting_y_set = []
	// generate distractor locations. Make them more or less evenly distributed across the canvas
	var bin_Nrow = Math.floor(Math.sqrt(N_distractors))+1
	var bin_width = canvas_width/bin_Nrow

	var row
	var col
	for (let i = 0; i < N_distractors; i++) {
		row = Math.floor(i/bin_Nrow)

		col = i % bin_Nrow
		distractor_starting_x = randomFromRange(Target_radius+safety_margin, bin_width-Target_radius -safety_margin) + bin_width*col
		distractor_starting_y = randomFromRange(Target_radius+safety_margin, bin_width-Target_radius -safety_margin) + bin_width*row*1.25
		
		if (distractor_starting_y > canvas_height - Target_radius - safety_margin) {
			distractor_starting_y = canvas_height - Target_radius - safety_margin 
		}
		
		distractorArray.push(new Distractor(distractor_starting_x,  distractor_starting_y));

		distractor_starting_x_set.push(Math.round(distractor_starting_x/canvas_size_coef))
		distractor_starting_y_set.push(Math.round(distractor_starting_y/canvas_size_coef))
	}
	jsPsych.data.write({sheepInitialX: sheep_initial_posX/canvas_size_coef, 
						sheepInitialY: sheep_initial_posY/canvas_size_coef, 
						chaserInitialX: chaser_initial_posX/canvas_size_coef, 
						chaserInitialY: chaser_initial_posY/canvas_size_coef,
						distractorSetStartingX: distractor_starting_x_set, 
						distractorSetStartingY: distractor_starting_y_set})   

	var timeThen = performance.now(),
		timeNow
	// Animation Loop
	function animate() {
		// c.clearRect(0, 0, canvas_width, canvas_height)
			
		// targetMove(target_destination_posX, target_destination_posY)

		stopID = window.requestAnimationFrame(animate);
		
		// excute once every 17 ms (~60 frames per second)
		timeNow = performance.now()

		timePassed = timeNow - timeThen

		if (timePassed > msPerFrame) {
			c.clearRect(0, 0, canvas_width, canvas_height)
			
			timeThen = timeNow - (timePassed % msPerFrame);
			targetMove(target_destination_posX, target_destination_posY)

			for (let i = 0; i < distractorArray.length; i++) {
				distractorArray[i].update();
			}
		}

		// for (let i = 0; i < distractorArray.length; i++) {
		// 	distractorArray[i].update();
		// }
	}
	animate();		

	trialCounter = trialCounter + 1
}

var test_trial = {       
	type:       'html-keyboard-response',     
	data: {test_part: 'test'},
	stimulus: 	 '<canvas id="canvas"></canvas>',
	choices: jsPsych.NO_KEYS,
	on_load: function() {
		var elem = document.documentElement;
		if (elem.requestFullscreen) {
		  elem.requestFullscreen();
		} else if (elem.webkitRequestFullscreen) { /* Safari */
		  elem.webkitRequestFullscreen();
		} else if (elem.msRequestFullscreen) { /* IE11 */
		  elem.msRequestFullscreen();
		}
		// reset controleld shape to initial position
		target_destination_posX = target_init_posX - Target_radius
		target_destination_posY = target_init_posY - Target_radius

		// hide cursor
		document.body.style.cursor = 'none';
		display(0)
	},
	on_finish: function() {
		// save data
		// console.log(trialCounter)
		// jsPsych.data.write({rt: "miss", trial: trialCounter})    
		// document.removeEventListener('keydown', endTrial)
		// cancelAnimationFrame(stopID)     
		// show cursor again
		document.body.style.cursor = 'auto';
	},
	// trial_duration : trial_length,
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
	pages: [
		"<div style = 'width : 1000px'> <h1>Instructions (4/5)</h1>" +
		"<p>In the actual experiment, you will see videos just like the demonstrations that you just saw. During each video, <strong>your task will be to press the 'space' bar on your keyboard as soon as you see a circle chasing the green circle. If you do not see any circle chasing the green circle, then please do not press the 'space' bar</strong>.</p>"+ 
		"<p>You can now try this for two practice displays. In these practice displays, we marked the 'chaser' in red to make it easier.</p>"+ 
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


var instructions_afterpractice = {
    data: {test_part: 'instructions'},	
    type: "instructions",
	button_delay: [2000],
	// type: "html-keyboard-response",
	pages: [
	// stimulus: 
		"<div style = 'width : 1000px'> <h1>Instructions (5/5)</h1>" +
		"<p>Well done! The real experiment will start in the next screen.</p>"+
		"<p>Remember, <strong>press the 'space' bar as soon as</strong> you see a 'chaser'; and do not press the 'space' bar if you do not see any chaser.</p>"+
		"<p>Sometimes, you may find it to be relatively easy to tell whether there is a 'chaser', since you'll immediately have a strong impression. But other times, the task may seem harder, and you may be much less certain about whether there is a chaser in the display.  That is okay! The experiment was designed to be difficult, and in those cases you should always keep trying your best.</p>"+
		"<p>The rest of the experiment is only about " + (lengthExp-4)+ " minutes long. So please remain as focused as possible until it is complete. Your performance is only useful to us if you try as hard as you can, and remain as focused as possible.</p>"+
		"<p>When you are ready, you can begin the experiment by clicking on 'Next' below.</p>"+
		"</div>"],
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
	pages: [
		"<div style = 'width : 1000px'> <h1>Instructions</h1>" +
		"<p>Good job!</p>"+ 
		"<p>In the next part of the experiment, you will be asked to do the exactly same task -- press the 'space' bar as soon as</strong> you see a 'chaser'; and do not press the 'space' bar if you do not see any chaser.</p>"+
		"<p>The only difference is that the circle that is potentially being chased is <strong>blue</strong> (while in the previous part is was green).</p>"+ 
		"<p>If you are ready to begin the next part of the experiment, click on 'Next>' .</p>"+ 
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
	
	for (i = 0; i < N_practice_trial; i++){
		timeline.push(fixation_cross, test_trial)
	}

	timeline.push(instructions_afterpractice);	// instructions	
}

for (i = 0; i < N_test_Trial/2; i++){
	timeline.push(fixation_cross, test_trial)
}

timeline.push(debrief_difficulty_middle);						
timeline.push(instructions_halfway);						

for (i = 0; i < N_test_Trial/2; i++){
	timeline.push(fixation_cross, test_trial)
}

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


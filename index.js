'use strict'

// Constants
var CURRENT_BASE_IP = '192.168.1.21';
var CONTROL_UP_SPEED = 2000;
var MULTICAST_INTERFACE = '239.255.42.99';
var MOCAP_PORT = 1511;
var WEB_PORT = 3000;
var SAFETY_TIMEOUT = 5 // time in seconds

// Globals
// var microS = require('microseconds');

//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// DRONE //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var flock = require('./models/flock.js');

flock.init([4], CURRENT_BASE_IP);

//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// MOCAP //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var mocap = require('./models/mocap.js');
mocap.start(MOCAP_PORT, MULTICAST_INTERFACE);


//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// TARGET //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var target = require('./models/target.js');


//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// TARGET //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var control = require('./models/control.js');

//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// VIEWS //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var views = require('./models/views.js');
views.app.listen(WEB_PORT);

// Changes drone state
views.app.io.route('Update_DroneState', function(req) {
	flock.Action([req.data.id], req.data.state);
})

// Changes where the drone goes
views.app.io.route('Update_DroneControl', function(req) {
	for(var i = 0; i < flock.lst.length; i ++) {
		flock.lst[i].go.control = req.data;
	}
})

// Changes aspects of the 
views.app.io.route('Set_DroneControl', function(req) {
	console.log(control.Algoritm[control.Algoritm_Active]);
	control.Algoritm[control.Algoritm_Active].Param[req.data.target].val = req.data.value;
})

//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// LOOPS //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

// SendCommand kan een nieuw commando geven op basis van verschillende modellen. Het verbeteren van deze modellen zal mogelijk een belangrijk onderdeel zijn van het succes van de show.
// INPUT: X,Y,Z,R + vX, vY, vZ, vR Drone
// OUTPUT: X, Y, Z, R Drone
var SendCommand = function() {

	for(var i = flock.lst.length; i--;) {

		var current_Drone  = flock.lst[i];

		// Target contains the target in X,Y,Z,R the drone needs to have
		var current_Target = target.Get(current_Drone.id);
		// console.log(current_Target);
		// Current mocap contains the current velocity and location of the drone
		var current_Mocap  = mocap.GetLastPointById(current_Drone.id)[0]; 

		// Save the target of the drone
		current_Drone.go.autopilot = control.Calc(
			current_Drone,
			current_Target,
			current_Mocap
		);

		// Send go command
		current_Drone.Go();
	}
};

// Doel: Veiligheid gehele systeem checken
// Per seconde: 1 ~ 10
// Safety check doet verschillende checks (zoals genoemd in safety measures) indien de situatie als onveilig wordt aangekaart kan besloten worden alle drones te laten laden.
// INPUT: TUTI
// OUTPUT: Veiligheid situatie
var SafetyCheck = function() {

	// Connection lost make drone stop
	SafetyCheck_CheckConnection();

}

var SafetyCheck_CheckConnection = function() {

	// For how long does the system have to wait for safety to kick in
	var SafetyTime = 500;
    for(var i = mocap.lst.length; i--; ) {
		
    	var lastMeasured = mocap.lst[i].GetLastPoint_NotEstimated();
		var last = mocap.lst[i].GetLastPoint();
		if((last.t - lastMeasured.t) > SAFETY_TIMEOUT) flock.Action(mocap.lst[i].id, 'safeOff');

    	// We might turn safety off somehow
    	else {}
    }
}

// UpdateDisplay
// Doel: Stuurt de huidige stand van zaken naar alle clients die aan het luisteren zijn.
// Per seconde: 10 ~ 20
// Door update display blijft iemand die naar de monitor kijkt op de hoogte van wat er gebeurt in de computer. 
var UpdateDisplay = function() {
	// console.log(flock.lst);
	// console.log(mocap.lst);
	views.UpdateDisplay({
		lstFlock: flock.lst,
		lstMocap: mocap.lst,
		control: control
	});
}


// DoFunction handles two important parts of functions. The first
// is how many times a second a function has to run. 
//
// TODO: The second more important fact is that it checks if it has done
// it before it starts the next.
var DoFunction = function(timesPerSecond, functionToDo) {
	setInterval(functionToDo, Math.round(1000 / timesPerSecond));
}

DoFunction(20, SendCommand);
DoFunction( 1, SafetyCheck);
DoFunction(10, UpdateDisplay);

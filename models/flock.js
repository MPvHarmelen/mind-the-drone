  //////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// DRONE //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
var ardrone = require('ar-drone');


// Max vertical speed in MM/s
var CONTROL_Z_SPEED = 2000;
var CONTROL_MAX_HEIGHT = 5000;
var CONTROL_MIN_HEIGHT = 50;


var Drone = function(_id, base_ip) {
  this.id = _id;
  this.state = {
    inAir: 0,
    camera: 0,
    emergency: 0,
    control: 1,
    autopilot: 0,
    safe: 1
  };

  // console.log('Creating drone: ' + (_id === 999 ? '192.168.1.1' : (base_ip + _id)))

  // The location object holds the information received from the camera's for each drone
  //  - T0 is the last point
  //  - T1 is the point before that one
  //  - TX contains a array with all points
  this.location = { 
    t0: { x: 0, y: 0, z: 0, r: 0 },
    t1: { x: 0, y: 0, z: 0, r: 0 },
    tX: []
  };

  // The navdata 
  this.navdata = {
    t0: { timestamp: new Date().getTime() },
    t1: { timestamp: new Date().getTime() },
    tX: []
  };

  // The calculated 
  this.go = {
    control: { vx: 0, vy: 0, vz: 0, vYaw: 0 },
    autopilot: { vx: 0, vy: 0, vz: 0, vYaw: 0 },
  }

  this.client = ardrone.createClient({
    ip: (_id === 999 ? '192.168.1.1' : (base_ip + _id)),
    frameRate: 1
    //port: 5555
  });

  this.client.config('control:flying_mode', 0); // Default to NOT autopilot mode
  //this.client.config('pic:ultrasound_freq', 7 + (stageListDrones.indexOf(drone._id) % 2))
  this.client.config('general:navdata_demo', 'TRUE');
  this.client.config('general:navdata_options', 65536 + 8388608 + 67108864); 

  this.client.config('control:control_vz_max', CONTROL_Z_SPEED);

  //drone.this.client.config('control:altitude_min',   50)
  //drone.this.client.config('control:altitude_max', 3000)

  // 1024 -> Altitude
  // 65536 -> Detect
  // 8388608 -> Wind speed
  // 67108864 -> WiFi

  this.client.config('video:codec_fps', 1);
  this.client.config('control:altitude_max','3000'); // 3 meter
  this.client.config('control:altitude_min','50'); // 5 cm
  // this.client.config('detect:detect_type', 12);  // detect roundell

  this.client.animateLeds('red', 1,1);

  /* Signal landed and flying events.
  this.client.on('landing', function () { });
  this.client.on('landed', function () { });
  this.client.on('takeoff', function() { });
  this.client.on('hovering', function() { });
  this.client.on('flying', function() { });*/
  
  // Save every navdata
  var navdata = this.navdata;
  this.client.on('navdata', function(data) {
    navdata.t1 = navdata.t0;
    navdata.t0 = data;
    navdata.t0.timestamp = new Date().getTime();
  });
}

Drone.prototype.TakeOff = function() {

  // Get drone state
  var state = this.state;

  // Check if drone is on ground
  if(state.inAir === 0) {
    state.inAir = -1;
    this.client.ftrim();
    this.client.takeoff(function() {
      state.inAir = 1;
    })
  }
}

Drone.prototype.Land = function() {

  // Get drone state
  var state = this.state;

  // Check if drone is not already in air
  if(state.inAir !== 0) {
    state.inAir = -1;
    this.client.land(function() {
      state.inAir = 0;
    })
  }  
}

Drone.prototype.Control = function() {
  this.state.autopilot = 0;
  this.state.control = 1;
  this.state.safe = 1;
}

Drone.prototype.Autopilot = function() {
  this.state.autopilot = 1;
  this.state.control = 0;
  this.state.safe = 1;
}

Drone.prototype.IsSafe     = function() { this.state.safe = 1; }
Drone.prototype.NotSafe    = function() { this.state.safe = 0; }
Drone.prototype.ToggleSafe = function() { this.state.safe = (this.state.safe ? 0 : 1); }

Drone.prototype.Go = function() {

  var go = { vx: 0, vy: 0, vz: 0, vYaw: 0 };

  // If drone is in air
  if(this.state.inAir !== 0 || true) {

    if (false) {}

    // If drone is in manual mode always listen
    else if (this.state.control === 1) go = this.go.control;

    // If drone is in safety mode don't move
    else if (this.state.safe === 0) go = { vx: 0, vy: 0, vz: 0, vYaw: 0 };

    // If drone is in autopilot mode
    else if (this.state.autopilot) go = this.go.autopilot;

    // Drone isn't in any mode so don't move
    else go = { vx: 0, vy: 0, vz: 0, vYaw: 0 };

    if(go.vz >= 0)       this.client.up(Math.abs(go.vz)); 
    else if(go.vz < 0)   this.client.down(Math.abs(go.vz));
    
    if(go.vy <= 0)       this.client.right(Math.abs(go.vy)); 
    else if(go.vy > 0)   this.client.left(Math.abs(go.vy));
    
    if(go.vx <= 0)       this.client.back(Math.abs(go.vx)); 
    else if(go.vx > 0)   this.client.front(Math.abs(go.vx));

    if(go.vYaw >= 0)     this.client.clockwise(Math.abs(go.vYaw));  
    else if(go.vYaw < 0) this.client.counterClockwise(Math.abs(go.vYaw));

    var totalMovement = 
      Math.abs(go.vx) + 
      Math.abs(go.vy) + 
      Math.abs(go.vz) + 
      Math.abs(go.vYaw);

    // console.log(go)
    
    if(totalMovement === 0) this.client.stop();  
    //else console.log('MOVING!');
  }
}

module.exports = {
  lst: [],

  init: function(idArray, base_ip) {
    for(var i = 0; i < idArray.length; i++)
      this.lst.push(new Drone(idArray[i], base_ip));
  },

  Get: function(id) {
    for(var i = 0; i < this.lst.length; i++) {
      if(this.lst[i].id == id) return this.lst[i];
    }
  },

  Action: function(id, action) {

    var actionDrone = this.Get(id);
    if(undefined === actionDrone) return;
    else if(undefined === action) return;

    else if(action === 'safeOn')    actionDrone.IsSafe()
    else if(action === 'safeOff')   actionDrone.NotSafe()
    else if(action === 'safeToggle')actionDrone.ToggleSafe()

    else if(action === 'takeoff')      actionDrone.TakeOff()
    else if(action === 'land')         actionDrone.Land()
    else if(action === 'autopilot')    actionDrone.Autopilot()
    else if(action === 'control')      actionDrone.Control()

    console.log('Drone ' + actionDrone.id + ' (looking for ' + id + ') will perform ' + action + '!');

  },
};

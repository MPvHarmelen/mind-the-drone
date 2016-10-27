'use strict';

// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    // if the other array is a falsy value, return
    if (!array)
        return false;

    // compare lengths - can save a lot of time
    if (this.length != array.length)
        return false;

    for (var i = 0, l=this.length; i < l; i++) {
        // Check if we have nested arrays
        if (this[i] instanceof Array && array[i] instanceof Array) {
            // recurse into the nested arrays
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}



//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// MOCAP //////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////
var colors = require('colors');
var dgram = require('dgram');
// var qtmrt = require('qualisys-rt');
// var microS = require('microseconds');
var optirx = require('optirx');

var TYPE = 'udp4';
var TRANSLATE_AXES = {
    x: 'y',
    y: 'z',
    z: 'x'
}

// var API = qtmrt.Api;
// var api = new API({ debug: true });
var api = dgram.createSocket(TYPE);



var lst = [];

var Drone = function(optitrack_id, name){
  this.name = name;
  this.id = name[name.length - 1]; // Number in Woodland_Drone_0
  this.optitrack_id = optitrack_id;
  this.points = [];  
}

Drone.prototype.AddPoint = function(lstRigidBodies, time) {
  var rigidBody;
  for (i=0; i < lstRigidBodies.length; i++) {
    if (lstRigidBodies[i].id == this.optitrack_id)
      rigidBody = lstRigidBodies[i];
  }

  var newPoint = new Point(time); 
  newPoint.est = ! rigidBody.tracking_valid;

  // Object location needs estimation
  if (newPoint.est) {

    // Lastpoint
    var lastPoint = this.GetLastPoint(20);
    if (!lastPoint) {
        console.log('Took last');
        lastPoint = this.GetLastPoint();
    }
    newPoint.v = lastPoint.v;
    newPoint.p = {
      x : lastPoint.p.x + Math.abs(newPoint.t - lastPoint.t)*lastPoint.v.x, 
      y : lastPoint.p.y + Math.abs(newPoint.t - lastPoint.t)*lastPoint.v.y,
      z : lastPoint.p.z + Math.abs(newPoint.t - lastPoint.t)*lastPoint.v.z,
      // AI-team added yaw speed into consideration
      yaw:lastPoint.p.yaw,
    }

    // Object location is known
  } else {
      var lastPoint = this.GetLastPoint_NotEstimated();
      // var rotationMatrix = rigidBody.rotation;
      // var r11 = rotationMatrix[0];
      // var r13 = rotationMatrix[2];
      // var r12 = rotationMatrix[1];
      // var yaw = (r12 > 0 ? 1 : r12 < 0 ? -1 : 0) * Math.acos( r11 / Math.cos( Math.asin(r13) ) );
      var yaw = rigidBody.orientation[1] // y orientation is yaw

      // position is given in meters, but saved in mm
      newPoint.p = {
        yaw: yaw
      };
      newPoint.p[TRANSLATE_AXES['x']] = rigidBody.position[0] * 1000;
      newPoint.p[TRANSLATE_AXES['y']] = rigidBody.position[1] * 1000;
      newPoint.p[TRANSLATE_AXES['z']] = rigidBody.position[2] * 1000;
      newPoint.v = { 
        x : (newPoint.p.x - lastPoint.p.x)/(newPoint.t-lastPoint.t), 
        y : (newPoint.p.y - lastPoint.p.y)/(newPoint.t-lastPoint.t), 
        z : (newPoint.p.z - lastPoint.p.z)/(newPoint.t-lastPoint.t)
      }; 
  }
  this.points.push(newPoint);
}

Drone.prototype.GetLastPoint_NotEstimated = function() {

  var pointsLength = this.points.length;
  if(pointsLength > 0) {
    for(var i = pointsLength; i--; ) {
      if(this.points[i].est === false) return this.points[i]
    }
  }
  return new Point();
}

// Drone.prototype.GetLastPoint = function(count) {

//   var pointsArray = [];
//   var pointsLength = this.points.length;

//   if(pointsLength > 0) {

//     // Add points
//     for(var i = pointsLength; i--) {
//       pointsArray.push(this.point[i]);
//       if(pointsArray.length == count) return pointsArray;
//     }
//   }
//   return pointsArray;
// };

Drone.prototype.GetLastPoint = function(count) {
  count = typeof count !== 'undefined' ? count : 1;
  var pointsLength = this.points.length;
  if(pointsLength > 0) return this.points[pointsLength - count];
  return new Point();
}

var Point  = function(time){ 
  this.p = { x : 0, y : 0, z : 0, yaw: 0 }; 
  this.v = { vx : 0, vy : 0, vz : 0, vYaw: 0 }; 
  this.t = (time || 0); 
  this.est = false; 
}

var CreateDroneList = function (data){
  // TODO > create list from formatted data
  var rigidBodies = data.rigid_bodies;

  // Get names from named sets
  var sets = data.sets
  // if (!Array.isArray(rigidBodies)){rigidBodies = [rigidBodies]};
  rigidBodies.forEach(function(rigidBody, index){ 
    var name;
    // Get drone name
    for (var key in sets) {
        if (sets[key].equals(rigidBody.markers)) {
            name = key;
            break;
        }
    }
    var newDrone = new Drone(rigidBody.id, name);

    // newDrone.rgbColor = rigidBody.rgbColor;
    // newDrone._6dIndex = rigidBody.id;
    lst.push(newDrone); 
  }); 
  // console.log(lst)
}

var on_message = function(raw_data, remote) {
  // DEPRICATED // TODO: Better to look at frame rate instead of us.now(), this has 10% error
  var data = optirx.unpack(raw_data);
  var time = data.latency;
  // BIG TODO
  var lstRigidBodies = data.rigid_bodies;

  // Foreach drone calculate/estimate location and speed
  for(var i = 0; i < lst.length; i++) lst[i].AddPoint(lstRigidBodies, time)
};

api.on('message', function listener(raw_data, remote) {
  var data = optirx.unpack(raw_data);

  // Create drone list from data
  CreateDroneList(data);

  api.removeListener('message', listener);
  api.on('message', on_message);
});
api.on('error', function() { console.log('Connection error!'.red) }); //api.disconnect();
api.on('end', function(data) { console.log('No more data!'.red); }); //api.disconnect();
api.on('event', function(event) { console.log(event.name.yellow); });
api.on('disconnect', function(event) { process.exit(); });



var ApiStart = function(port, ip) {
    api.on('listening', function () {
        var address = api.address();
        console.log('UDP Client listening on ' + address.address + ":" + address.port);
        api.setBroadcast(true)
        api.setMulticastTTL(128);
        api.addMembership(ip);
    });

    api.bind(port);
}

  // try {
    // api.connect(port || "22223", ip || "localhost")
      // .then(function() { return api.qtmVersion(); })
      // .then(function(version) { return api.byteOrder(); })
      // .then(function(byteOrder) { return api.getState(); })
      // .then(function() { return api.discover(); })
      // .then(function() { return api.getParameters('All'); })

      // Create dronelist // Is being done on first message event
      // .then(CreateDroneList)

      // Get all RIGID Bodies
      // .then(function() { return api.streamFrames({ frequency: 1/2, components: ['6D'] }); })

      // .catch(function(e) {
      //   console.log('QTS Internal error');
      //   console.log(e);
      // })
    // ;
  // } catch(e) {
  //   console.log('QTS Connection error')
  //   console.log(e)
  // }

module.exports = {
  lst: lst,
  start: ApiStart,

  GetLastPointById: function(id) {

    for(var i = lst.length; i--; ) if(lst[i].id == id) {
      return [lst[i].GetLastPoint()];
    }
    return [new Point()];
  },

  GetLastPointsById: function(id, count) {
    // TODO Implement multiple points
  }
}

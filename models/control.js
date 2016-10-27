var AccelarationToPower = function(reqA){
 var c = [0, (0.5), 0];
 return c[0] + c[1] * reqA; // + c[2] * Math.pow(reqA,2);
}


var VelocityToPower = function(reqV){
 var c = [0, (1/50), 0];
 return c[0] + c[1] * reqV; // + c[2] * reqV^2;
}

var GetControlVelocity = function(reqV, currentV, factor){
    return reqV - currentV * Math.pow(10, factor);
    // return reqV;
}

var GetRequiredVelocity = function(distance, threshhold, max_speed) {
    if (threshhold <= 0)
        threshhold = 1;
    if (Math.abs(distance) > threshhold)
        return Math.abs(distance) / distance * max_speed;
    else
        return max_speed * Math.abs(distance) * distance / Math.pow(threshhold, 2);
}

var fs = require('fs');
var fd = fs.openSync('log.log', 'w');
var Algorithm_Squared = function(params, drone, target, mocap){
    var axes = ["x", "y", "z"];
    var result = {vYaw: mocap.p.yaw};
    fs.write(fd, 'x' + mocap.v['x'] + '\n');
    fs.write(fd, 'y' + mocap.v['y'] + '\n');
    fs.write(fd, 'z' + mocap.v['z'] + '\n');
    for (var i = 0; i < axes.length; i++) {
        var axis = axes[i];
        distance = target[axis] - mocap.p[axis];
        var reqV = GetRequiredVelocity(distance, params.threshhold.val * 100, params.max_speed.val / 10);
        result["v" + axis] = GetControlVelocity(reqV, mocap.v[axis], params.speed_factor.val / 10);
    };
    // console.log(mocap.p);
    // console.log(result);
    return result;
}

var Algoritm_Empty = function(param, drone, target, mocap) {

}

var Algoritm_Basic = function(param, drone, target, mocap) {

 var droneTarget = target;
 var droneCurrent = mocap;

 var deltaP = {
     x : (droneTarget.x - droneCurrent.p.x) / (1000/10), // (1000/10) is hz to ms
     y : (droneTarget.y - droneCurrent.p.y) / (1000/10),
     z : (droneTarget.z - droneCurrent.p.z) / (1000/10),
     yaw : (droneTarget.yaw - droneCurrent.p.yaw) / (1000/10)
 }

 var deltaV = {
     x : (deltaP.x - droneCurrent.v.x) / (1000/10), // (1000/10) is hz to ms
     y : (deltaP.y - droneCurrent.v.y) / (1000/10),
     z : 0,
     yaw : 0
 }

 var detlaA = {};

 var c1 = param.c1.val / 1000; // deltaX
 var c2 = param.c2.val / 1000; // deltaY

 return {
     vx : c1 * deltaP.x + c2 * deltaV.x,
     vy : c1 * deltaP.y + c2 * deltaV.y,
     vz : 1/50 * deltaP.z,
     vYaw : -50 * deltaP.yaw
 }
}

// var ObjectToArray = function(objectKey) {
//   var objectArray = [];
//   console.log(this[objectKey])
//   Object.keys(this[objectKey]).forEach(function(key) {
//       var object = this[objectKey][key];
//       object.key = key;
//       objectArray.push(object);
//   })
//   return objectArray;
// }

module.exports = {

    // Active algoritm
    Algoritm_Active: "squared",

    // Array of possible algoritms
    // The use of each of these algoritms can be controlled on the "/control" page
    // There it will also be possible to set values of params if defined
    Algoritm: {
        empty: {
            Calc: Algoritm_Empty,
            Param: {}
        },
        basic: {
            Calc: Algoritm_Basic,
            Param: {
                c1: { lbl: 'C1 Afstand', min: -100, max: 100, val: 0},
                c2: { lbl: 'C2 Snelheid', min: -1000, max: 1000, val: 0}
           }
        },
        squared: {
            Calc: Algorithm_Squared,
            Param: {
                threshhold: { lbl: 'Threshold distance', min: 0, max: 50, val: 10},
                speed_factor: { lbl: 'Speed factor (power of 10)', min: -50, max: 30, val: -33},
                max_speed: { lbl: 'Max speed', min: 0, max: 10, val: 6}
            }
        }
    },

    // The real calculation
    Calc: function(drone, target, mocap) {
        // Get algoritm
        var alg = this.Algoritm[this.Algoritm_Active];

        var stop = { vx: 0, vy: 0, vz: 0, vYaw: 0 };
        var calc;
        // Perform algoritm
        if(alg) calc = alg.Calc(alg.Param, drone, target, mocap);
        // If the algoritm doesn't return anything still make sure something is sent to drone
        return calc || stop;
    }
}

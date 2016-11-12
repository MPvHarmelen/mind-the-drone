//////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// VIEWS /////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////

var express = require('express.io');
var path = require('path');
var app = express().http().io()
var _   = require('underscore');

var target = require('./target.js');

var grade = 0; 

// view engine setup
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Overview (+ global for data)
var sent_last;
app.get('/', function(req, res) {
  res.render('overview', sent_last);
})

var GetTargetPositionDif = function(p, target){ 
  var difX = Math.abs(Math.pow(p.x,2) - Math.pow(target.x,2));
  var difY = Math.pow(Math.pow(p.y,2) - Math.pow(target.y,2));
  var difZ = Math.pow(Math.pow(p.z,2) - Math.pow(target.z,2));
  return Math.pow(difX + difY + difZ, 0.5); 
}

var UpdateDisplay = function(newData) {

  var control = {
    Algoritm_All: [],
    Param: [],
  };
  var drones = {
    lstDrone: []
  };

  Object.keys(newData.control.Algoritm).forEach(function(alg) {
    control.Algoritm_All.push({ key: alg, active: (alg == newData.control.Algoritm_Active) })
  })
  var activeAlgoritm = newData.control.Algoritm[newData.control.Algoritm_Active];
  Object.keys(activeAlgoritm.Param).forEach(function(paramKey) {
    var param = activeAlgoritm.Param[paramKey];
    param.key = paramKey;
    control.Param.push(param)
  })

  newData.lstFlock.forEach(function(drone) {

    var info = {
      id: drone.id,

      show: [
        { name: 'ip', icon: 'server', title: 'IP', value: drone.client._options.ip },
        { name: 'power', icon: 'bolt', title: 'Battery', value:
            drone.navdata.t0.demo ? drone.navdata.t0.demo.batteryPercentage : '- %'
        },
        { name: 'EEG', icon: 'car', title: 'Speed (x, y, z, yaw)',
          value: [
            Math.round(drone.go.autopilot.vx * 100) / 100,
            Math.round(drone.go.autopilot.vy * 100) / 100,
            Math.round(drone.go.autopilot.vz * 100) / 100,
            Math.round(drone.go.autopilot.vYaw * 100) / 100,
          ]
        },
        { name: 'manual', icon: 'gamepad', title: 'Speed (x, y, z, yaw)',
          value: [
            Math.round(drone.go.control.vx * 100) / 100,
            Math.round(drone.go.control.vy * 100) / 100,
            Math.round(drone.go.control.vz * 100) / 100,
            Math.round(drone.go.control.vYaw * 100) / 100,
          ]
        },
        { name: 'connect', icon: 'refresh', title: 'Last connected',
          value: Math.min(new Date().getTime() - drone.navdata.t0.timestamp, 9999) + ' ms' },
      ],

      state_0: [
        { name: 'autopilot', icon: 'car', title: 'Auto pilot',
          value: 1 === drone.state.autopilot ? 'success' : 'danger'
        },
        { name: 'takeoff', icon: 'level-up', title: 'Drone fly',
          value: 1 === drone.state.inAir ? 'success' : 'danger'
        },
        { name: 'safeToggle', icon: 'shield', title: 'Drone in a safe state',
          value: 1 === drone.state.safe ? 'success' : 'danger'
        }
      ],
      state_1: [
        { name: 'control', icon: 'gamepad', title: 'Manual control',
          value: 1 === drone.state.control ? 'success' : 'danger'
        },
        { name: 'land', icon: 'level-down', title: 'Drone land',
          value: 1 !== drone.state.inAir ? 'success' : 'danger'
        },
        { name: 'stopped', icon: 'stop', title: 'Drone is stopped by safety',
          value: 1 === drone.state.stopped ? 'success' : 'danger'
        },
      ],
    }
    drones.lstDrone.push(info)
  })

  sent_last = {
    lstDrone: drones.lstDrone,
    drones: drones,
    control: control,
  };
  app.io.broadcast('Update_Display', sent_last);
}


module.exports = {
  app: app,
  UpdateDisplay: UpdateDisplay
}

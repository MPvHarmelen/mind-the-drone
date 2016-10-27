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

// Send client html
var sent_last;

// Send client html
// var control_id;
// app.get('/control/:id', function(req, res) {
//   control_id = req.params.id;  
//   res.render('control', control_last);
// })

app.get('/overview', function(req, res) {
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
        { name: 'power', icon: 'bolt', title: 'Battery', value: '- %' },
        { name: 'target', icon: 'bullseye', title: 'On target', value: '- mm' },
        { name: 'wind', icon: 'flag', title: 'Wind', value: '- m/s' },
        { name: 'seen', icon: 'eye', title: 'Last seen', value: '- ms' },
        { name: 'xyzDrone', icon: 'codepen', title: 'X,Y,Z', value: [' - ', ' - ' , ' - '] },
        { name: 'xyzTo', icon: 'bullseye', title: 'X,Y,Z', value: [' - ', ' - ' , ' - '] },
        { name: 'xyzTarget', icon: 'car', title: 'X,Y,Z Speed', value: [
            Math.round(drone.go.autopilot.vx * 100) / 100,
            Math.round(drone.go.autopilot.vy * 100) / 100,
            Math.round(drone.go.autopilot.vz * 100) / 100,
            Math.round(drone.go.autopilot.vYaw * 100) / 100,
          ]
        },
        { name: 'xyzControl', icon: 'gamepad', title: 'X,Y,Z Speed', value: [
            Math.round(drone.go.control.vx * 100) / 100,
            Math.round(drone.go.control.vy * 100) / 100,
            Math.round(drone.go.control.vz * 100) / 100,
            Math.round(drone.go.control.vYaw * 100) / 100,
          ]
        },
        { name: 'connect', icon: 'refresh', title: 'Last connect', value: Math.min(new Date().getTime() - drone.navdata.t0.timestamp, 9999) + ' ms' },
        { name: 'grade', icon : 'bullseye', title: 'Grade', value: '- mm ms'}
      ],

      state_0: [
        { name: 'autopilot', icon: 'car', title: 'Auto pilot', value: '' },
        { name: 'takeoff', icon: 'level-up', title: 'Drone fly', value: '' },
        { name: 'safeToggle', icon: 'shield', title: 'Drone in a safe state', value: '' }
      ],
      state_1: [
        { name: 'control', icon: 'gamepad', title: 'Manual control', value: '' },
        { name: 'land', icon: 'level-down', title: 'Drone land', value: '' },
        { name: 'stopped', icon: 'stop', title: 'Drone is stopped by safety', value: '' },
      ],
    }

    if(drone.navdata.t0.demo) {
      info.show[1].value = drone.navdata.t0.demo.batteryPercentage;
      // console.log(drone.navdata.t0)
    }
    if(drone.navdata.t0.windSpeed) {
      info.show[3].value = Math.round(drone.navdata.t0.windSpeed.speed, -2) + ' ms';
    }

    if(drone.state) {

      info.state_0[0].value = (1 === drone.state.autopilot ? 'success' : 'danger');
      info.state_0[1].value = (1 === drone.state.inAir ? 'success' : 'danger');
      info.state_0[2].value = (1 === drone.state.safe ? 'success' : 'danger');

      info.state_1[0].value = (1 === drone.state.control ? 'success' : 'danger');
      info.state_1[1].value = (1 !== drone.state.inAir ? 'success' : 'danger');
      info.state_1[2].value = (1 === drone.state.stopped ? 'success' : 'danger');
    }

    newData.lstMocap.forEach(function(droneMOCAP) {
      if(droneMOCAP.id == drone.id) {
        var XYZ_found = droneMOCAP.GetLastPoint();
        var XYZ_est = droneMOCAP.GetLastPoint_NotEstimated();

        info.show[4].value = Math.round((XYZ_found.t - XYZ_est.t) * 1000) + ' ms';
        info.show[5].value = [
          Math.round(XYZ_est.p.x),
          Math.round(XYZ_est.p.y),
          Math.round(XYZ_est.p.z),
        ];
        var thisDroneTarget = target.Get(drone.id);
        info.show[6].value = [
          Math.round(thisDroneTarget.x),
          Math.round(thisDroneTarget.y),
          Math.round(thisDroneTarget.z),
        ];



        info.show[2].value = GetTargetPositionDif(XYZ_est.p, thisDroneTarget);
        grade += GetTargetPositionDif(XYZ_est.p, target.Get(drone.id));
        info.show[10].value = grade;


      }
    })
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

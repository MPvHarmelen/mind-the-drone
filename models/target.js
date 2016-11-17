fs = require('fs');

var CommandFromFile = function(file)
{
    var command = {
        velocity: { vx: 0, vy: 0, vz: 0, vYaw: 0 },
        length: 0
    }

	if (fs.existsSync( file ))
    {
        var new_command;
        try {
    	    new_command = JSON.parse(fs.readFileSync(file,'utf8'));
        } catch(SyntaxError) {
            new_command = {length: 0};
            fs.writeFileSync(file, JSON.stringify(command), 'utf8');
        }
        // console.log(new_command)

        if (new_command.length) {
            fs.writeFileSync(file, JSON.stringify(command), 'utf8');
            if (undefined !== new_command.velocity && undefined !== new_command.length) {}
            command = new_command;
        }
    }

	return command;
}



// //////////////////////////////////////////////////////////////////////////////////
// ///////////////////////////////// TARGET //////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////
// // var microS = require('microseconds');
// var HANS_ID = 0;

// var mocap = require('./mocap.js');
// var centerOfShow = {
// 	x: 250,
// 	y: -1500,
// }

// var distanceFromHans = {
// 	x: 0,
// 	y: 0,
// 	z: 1200
// }
// // Implement formular for circle

// ///////////// basic lemniscate ///////////////////////
// var lemniscate = function(time) {

// 	var xVar = 2250; //variation in the x-direction
// 	var yVar = 1250; //variation in the y-direction
// 	var freq = 15 * 1000; //frequency in ms
// 	var denominator = (Math.pow(Math.sin((2*Math.PI * time) / freq), 2) + 1) ;
// 	var xTarget = (xVar * Math.cos((2*Math.PI * time) / freq)) / denominator;
// 	var yTarget = (yVar * Math.cos((2*Math.PI * time) / freq) * Math.sin((2*Math.PI * time) / freq) / denominator);
// 	return {x : xTarget + centerOfShow.x, y : yTarget + centerOfShow.y, z: 2000, yaw : 0};
// }

// /// Folow hans
// var followHans = function(hans_id) {
// 	var hans = mocap.GetLastPointById(hans_id)[0].p
// 	// console.log(hans);
// 	res = {
// 		x: hans.x + distanceFromHans.x,
// 		y: hans.y + distanceFromHans.y,
// 		z: hans.z + distanceFromHans.z,
// 		yaw: 0,
// 	};
// 	// console.log(res);
// 	return res;
// }

// var command = function readTextFile(file)
// {
//     var rawFile = new XMLHttpRequest();
//     rawFile.open("GET", file, false);
//     rawFile.onreadystatechange = function ()
//     {
//         if(rawFile.readyState === 4)
//         {
//             if(rawFile.status === 200 || rawFile.status == 0)
//             {
//                 var allText = rawFile.responseText;
//                 return allText;
//             }
//         }
//     }
//     rawFile.send(null);
// }

module.exports = {

  Get: function(id) {

    // return { x: 0, y: 1000, z:1700, yaw: 0 };
    return CommandFromFile('eeg.txt');
  },
};

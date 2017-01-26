fs = require('fs');

var filename;

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
        console.log(new_command)

        if (new_command.length) {
            fs.writeFileSync(file, JSON.stringify(command), 'utf8');
            if (undefined !== new_command.velocity && undefined !== new_command.length) {}
            command = new_command;
        }
    }

	return command;
}

var SetCommandFilename = function(filname) {
    filename = filname
}


module.exports = {

  Get: function(id) {

    // return { x: 0, y: 1000, z:1700, yaw: 0 };
    return CommandFromFile(filename);
  },

  SetCommandFilename: SetCommandFilename,
};

Installation
============

Install [npm](https://www.npmjs.com/) (`sudo apt-get install npm`) and run
`npm install` in the main directory of this repository.


Usage
=====

Starting the server
-------------------

To start the server run `node index.js` in the main directory of this
repository. Check with your motion caption software whether the UDP port is
correct. If it's not, change it in `index.js`.

Controlling drones
------------------

To control the drones, visit the web url reported when starting the server. You
can manually control a drone with <kbd>W</kbd>, <kbd>A</kbd>, <kbd>S</kbd> and
<kbd>D</kbd> for forwards, left, backwards and right respectively. Use <kbd>Q</kbd>
and <kbd>E</kbd> for rotating the drone and <kbd>Up</kbd> and <kbd>Down</kbd>
to move the drone, well, up and down. Clicking the car icon will let the
program control the drone.


To-Do
=====
 - [X]  Don't hard code states in models/views.js:75-84
 - [ ]  Look at `sent_last` in models/views.js:16
 - [ ]  Add recover button
     - [ ]  Add button in view
     - [ ]  Read information from `navdata` for button colour
     - [ ]  Write function that recovers drone ([docs](https://www.npmjs.com/package/ar-drone#clientdisableemergency))
     - [ ]  Make clicking button execute said function
         - [ ]  Socket listener thing (similar to index.js:52-68)
         - [ ]  Socket shouter thing (similar to views/overview.html, search for `App.socket.emit`)
 - [ ]  `|| true` ?! in flock.js:143
 - [ ]  Make 9999 look nicer models/views.js:87
 - [X]  Make EegCommand in target.js read json objects
 - [ ]  Don't pass `this.go` as an argument at models/flock.js:210, but figure
        out why using `this` inside `MoveAutopilot` doesn't work and fix it
        in a nicer way.
 - [ ]  Make sure the user notices when models/target.js:14 produces a syntax error.
 - [ ]  Remove everything we aren't using.


Thoughts
========
 -  It seems like `return calc || stop;` in `models/control.js`is a bad idea.
    Isn't it better to send no command instead of telling it to stop?
 -  ~~We could listen for commands coming from the view (separately from commands
    coming from the EEG)? To control whether EEG commands are executed, the
    view then just flips a boolean that is checked by the EEG.~~
 -  ~~A second command executed before the first finished breaks things. Solutions:~~
     - [ ]  ~~Save a boolean in the `state` of a drone showing whether it's already
            obeying a command. If it is, the current command is ignored.~~
     - [ ]  ~~Save a queue somewhere. Every executed command is added to the
            queue and the drone (magically?) executes all commands in the
            queue.~~
     - [X]  ~~Save the end of the last command as a time stamp in the state of a
            drone and have `ExecuteCommand` start the command at that moment.
            There doesn't seem to be a "execute at time stamp" function in Node,
            but there is an
            ["execute after delay"](https://nodejs.org/api/timers.html#timers_settimeout_callback_delay_args)
            function. This could be hacked
            by correctly delaying both the start and stop messages.~~

Attributions
============

This repository contains code written [here](https://bitbucket.org/TimLeunissen/dn-droneshow).

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
[ ] don't hard code states in models/views.js:75-84
[ ] look at `sent_last` in models/views.js:16
[ ] add recover button
[ ] `|| true` ?! in flock.js:143


Thoughts
========
[ ] It seems like `return calc || stop;` in `models/control.js`is a bad idea.
Isn't it better to send no command instead of telling it to stop?


Attributions
============

This repository contains code written [here](https://bitbucket.org/TimLeunissen/dn-droneshow).

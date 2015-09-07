log('we started the game');

var io = require('sandbox-io');
var def = require('./shared.js');
Planet = def.Planet;
rndI = def.rndI;

var sockets = [];
var currentId = 0;

// size of the gamefield
var WIDTH = 1000;
var HEIGHT = 1000;

io.on('connection', function(socket){
  var myid = currentId++;
  sockets[myid] = socket;
  socket.on('event', function(data){
    socket.emit("data",{"keks":true});
  });
  socket.on('send', function(data){ // a player wants to send ship
    world.planets[data.from].shipCount -= 100;
    world.planets[data.to].shipCount += 100;
  });
  socket.on('disconnect', function(){
    // TODO remove this socket from sockets
  });
  update(socket);
});

var world = {
  planets:[]
}


var gaia = {
  id: 0,
  color: "cccccc"
}; // gaia player



function init() {
  for (var i = 0; i < 30; i++) {
    createPlanet(gaia);
  }
}

function createPlanet(owner) {
  // TODO check that the planet does not collide with others
  world.planets.push(new Planet(rndI(0,WIDTH),rndI(0,HEIGHT),rndI(10,30), owner));
}

function turn() {
  // planets producing
  for (var i = 0; i < world.planets.length; i++) {
    world.planets[i].afterTurn();
  }


  // send the turn to all active players
  for (key in sockets) {
    update(sockets[key]);
  }


  setTimeout(turn, 1000);
}

function update(socket) { // update a socket
  socket.emit('turn', world);
}

init();
turn();

log('we started the game');

var io = require('sandbox-io');

var sockets = [];
var currentId = 0;

// size of the gamefield
var WIDTH = 1000;
var HEIGHT = 1000;

io.on('connection', function(socket){
  var myid = currentId++;
  sockets[myid] = socket;

  socket.on('send', function(data){ // a player wants to send ship
    // TODO check ownership
    var ships = Math.floor(world.planets[data.from].ships * data.amount /100);
    world.planets[data.from].ships -= ships;
    var turns = 2;
    world.fleets.push(new Fleet(data.from, data.to, ships, turns));

  });

  socket.on('disconnect', function(){
    // TODO remove this socket from sockets
  });
  update(socket); // send this player an initial game state
});

var world = {
  planets:[],
  fleets:[],
  players:[]
}


var gaia = {
  id: 0,
  color: "cccccc"
}; // gaia player
world.players.push(gaia);


function init() {
  for (var i = 0; i < 30; i++) {
    createPlanet(gaia);
  }
}

function createPlanet(owner) {
  // TODO check that the planet does not collide with others
  world.planets.push(new Planet(rndI(0,WIDTH),rndI(0,HEIGHT),rndI(10,30), owner.id));
}

function turn() {

  for (var i = 0; i < world.fleets.length; i++) {
    world.fleets[i].turn();
  }


  // planets producing
  for (var i = 0; i < world.planets.length; i++) {
    produceShips(world.planets[i]);
  }


  // send the turn to all active players
  for (key in sockets) {
    update(sockets[key]);
  }


  setTimeout(turn, 3000);
}

function update(socket) { // update a socket
  socket.emit('turn', world);
}

init();
turn();




// objects
function Planet(x, y, size, owner) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.owner = owner;
  this.ships = 0;
}
function produceShips(planet){
  planet.ships += planet.size; // production per turn defined by size
}

function Fleet(from, to, ships, turns) {
  this.from = from;
  this.owner = world.planets[from].owner;
  this.to = to;
  this.ships = ships;
  console.log(turns+" turns");
  this.turns = turns;
}
Fleet.prototype.turn = function() {
  this.turns --;
  if (this.turns <= 0) {
    world.fleets.splice(world.fleets.indexOf(this),1);

    if (world.planets[this.to].owner == this.owner) {
      console.log("shipment");
      // friendly shipment
      world.planets[this.to].ships += this.ships;
    } else {
      console.log("attack from "+this.owner+" to "+world.planets[this.to].owner);
      // attack
      world.planets[this.to].ships -= this.ships; // TODO active player more value?
      if (world.planets[this.to].ships < 0) {
        // successfull attack
        world.planets[this.to].ships *= -1; // the rest of the ships stays on the planet
        world.planets[this.to].owner = this.owner;
      }
    }
  }
}

// utils
function rndI(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

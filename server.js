log('we started the game');

var io = require('sandbox-io');

var sockets = [];
var secrets = ["gaia"];
var currentId = 1;

// size of the gamefield
var WIDTH = 1000;
var HEIGHT = 1000;

io.on('connection', function(socket){
  var me;
  socket.on('join', function(data) {
    if (me) {return;}
    var myid = currentId++;
    sockets[myid] = socket;
    var secret = Math.random().toString(36).substring(2);
    secrets[myid] = secret;
     me ={
        id: myid,
        name: data.name, // TODO add security check
        color: randomColor(80),
        online: true
      };
      world.players.push(me);
      // create my own planet
      createPlanet(me, 25, 100);
      socket.emit('player', me);
      socket.emit('hof', hallOfFame);
      socket.emit('secret', {'secret': secret});

      update(socket); // send this player an initial game state
    });
    socket.on('rejoin', function(data) {
      for (var i = 0; i < secrets.length; i++) {
        console.log(data);
        console.log(secrets[i]+" ==? "+data.secret);
        if (secrets[i] == data.secret) {
          // this is us
          me = world.players[i];
          me.online = true;
          socket.emit('player', me);
          socket.emit('hof', hallOfFame);
          update(socket);
          sockets[i] = socket;

          return;
        }
      }
      socket.emit('fail', {}); // this secret is probably from an old game
    });
  socket.on('send', function(data){ // a player wants to send ship
    // TODO check ownership
    var ships = Math.floor(world.planets[data.from].ships * data.amount /100);
    world.planets[data.from].ships -= ships;
    var turns = Math.ceil(dist(world.planets[data.from], world.planets[data.to])/100); // ships fly 100px per turn
    world.fleets.push(new Fleet(data.from, data.to, ships, turns));

  });

  socket.on('disconnect', function(){
    if (typeof me != "undefined") {
      me.online = false;
      console.log("player "+me.name+"("+me.id+") diconnected");
    }
    // TODO remove this socket from sockets
  });

});

var world = {
  planets:[],
  fleets:[],
  players:[]
}


var gaia = {
  id: 0,
  color: "cccccc",
  name: "gaia",
  online: false
}; // gaia player
world.players.push(gaia);

var hallOfFame = db("hof");
if (typeof hallOfFame == "undefined") {
  hallOfFame = [];
}


function resetMap() {
  world = {
    planets:[],
    fleets:[],
    players:[gaia]
  }
  currentId = 1;
  WIDTH = HEIGHT = 1000;
  secrets = ['gaia'];
  for (key in sockets) {
    if (sockets[key]) sockets[key].disconnect();
  }
  sockets = [];

  init();
}



function init() {
  for (var i = 0; i < 1; i++) {
    createPlanet(gaia, rndI(10,30), rndI(0, 20));
  }
  // start the game loop
  turn();
}

function createPlanet(owner, size, ships) {
  // TODO check that the planet does not collide with others
  world.planets.push(new Planet(rndI(size,WIDTH-size),rndI(size,HEIGHT-size), size, owner.id, ships));
}

function turn() {

  for (var i = 0; i < world.fleets.length; i++) {
    world.fleets[i].turn();
  }
  for (var i = 0; i < world.fleets.length; i++) {
      if (world.fleets[i].delete) {
        world.fleets.splice(i,1);
        i--;
      }
    }
  // planets producing
  for (var i = 0; i < world.planets.length; i++) {
    produceShips(world.planets[i]);
  }


  // send the turn to all active players
  for (key in sockets) {
    update(sockets[key]);
  }


  // check for win condition
  var owner = world.planets[0].owner;
  if (owner == 0) {tt();return;} // gaia cannot win
  for (var i = 0; i < world.planets.length; i++) {
    if (world.planets[i].owner != owner) {
      tt();return;
    }
  }
  if (owner == 0) {tt();return; }// gaia cannot win
var dt =  new Date();
  // player won
  hallOfFame.push({
    date: dt.getDate() + "."+ (dt.getMonth()+1) +"."+(dt.getYear()-100),
    user: world.players[owner].name,
    players: world.players.length - 1
  });
  db("hof", hallOfFame);

  sockets[owner].emit('won', {
    players:  world.players.length -1
  });
  resetMap();
}

function tt() { // turn timeout
  setTimeout(turn, 3000);
}

function update(socket) { // update a socket
  socket.emit('turn', world);
}

init();




// objects
function Planet(x, y, size, owner, ships) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.owner = owner;
  this.ships = ships;
  this.limit = size*10; // production limit
}
function produceShips(planet){
  var prod = planet.size / 10;  // production per turn defined by size
  if (world.players[planet.owner].online) {prod*=2;} // faster production, when you're online
  if (planet.ships <= planet.limit) { // the planet is still able to produce
    planet.ships += Math.floor(prod);
  }
}

function Fleet(from, to, ships, turns) {
  this.from = from;
  this.owner = world.planets[from].owner;
  this.to = to;
  this.ships = ships;
  console.log(turns+" turns");
  this.justStarted = true;
  this.turns = turns ;// turns will be decreased by 1 to the actual count in the first turn
  this.way = turns; // length of the way
}
Fleet.prototype.turn = function() {
  if (this.justStarted) {
    this.justStarted = false;
  } else {
    this.turns --;
  }
  if (this.turns <= 0) {
    this.delete = true;

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
function dist(a,b) {
  return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}
function randomColor(brightness){
  function randomChannel(brightness){
    var r = 255-brightness;
    var n = 0|((Math.random() * r) + brightness);
    var s = n.toString(16);
    return (s.length==1) ? '0'+s : s;
  }
  return randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}

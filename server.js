var io = require("sandbox-io");

var sockets = [];
var secrets = ["gaia"];
var currentId = 1;

// size of the gamefield
var INITIAL_WIDTH = 1000;
var INITIAL_HEIGHT = 1000;


var world = {
  planets:[],
  fleets:[],
  players:[],
  arrived:[], // ships that arrived in this turn
  wwidth: INITIAL_WIDTH,
  wheight: INITIAL_HEIGHT
}


var gaia = {
  id: 0,
  color: "cccccc",
  name: "ga'ia",
  online: false,
  planets: 0
}; // gaia player
world.players.push(gaia);

var hallOfFame = db("hof");
if (typeof hallOfFame == "undefined") {
  hallOfFame = [];
}
// background stuff
var dustfields = [];
var starfield = [];



io.on("connection", function(socket){
  var me;
  socket.on("join", function(data) {
    if (me) {return;}
    if (data.name.length > 12) {
      socket.emit("fail", {message:"na'me has to be 12 characters or shorter."})
      return;
    }
    if (data.name.length < 3) {
      socket.emit("fail", {message:"na'me has to be 3 characters or longer."})
      return;
    }
    var myid = currentId++;
    sockets[myid] = socket;
    var secret = Math.random().toString(36).substring(2);
    secrets[myid] = secret;
     me ={
        id: myid,
        name: data.name,
        color: randomColor(myid),
        online: true,
        planets: 0
      };
      world.players.push(me);
      // create my own planet
      pP(me);
      socket.emit("player", me);
      socket.emit("hof", hallOfFame);
      socket.emit("dustfields", dustfields);
      socket.emit("starfield", starfield);
      socket.emit("secret", {"secret": secret});

      update(socket); // send this player an initial game state
    });
    socket.on("rejoin", function(data) {
      for (var i = 0; i < secrets.length; i++) {
        console.log(data);
        console.log(secrets[i]+" ==? "+data.secret);
        if (secrets[i] == data.secret) {
          // this is us
          me = world.players[i];

          if (me.deadTil) {
            if (me.deadTil < Date.now()) {
              // revive
              pP(me);
              me.deadTil = null;
            } else {
              socket.emit("dead", {dead:me.deadTil-Date.now()});
            }
          }


          me.online = true;
          socket.emit("player", me);
          socket.emit("hof", hallOfFame);
          socket.emit("dustfields", dustfields);
          socket.emit("starfield", starfield);
          update(socket);
          sockets[i] = socket;

          return;
        }
      }
      socket.emit("fail", {message:""}); // this secret is probably from an old game
    });
  socket.on("send", function(data){ // a player wants to send ship
    var ships = Math.floor(world.planets[data.fromP].ships * Math.min(data.amount,100) /100);
    if (ships <= 0) {return;} // no ships to send
    world.planets[data.fromP].ships -= ships;
    var turns = Math.ceil(dist(world.planets[data.fromP], world.planets[data.toP])/100); // ships fly 100px per turn
    world.fleets.push(new Fleet(data.fromP, data.toP, ships, turns));

  });

  socket.on("disconnect", function(){
    if (typeof me != "undefined") {
      me.online = false;
      console.log("pl'ayer "+me.name+"("+me.id+") diconnected");
    }
    // TODO remove this socket from sockets
  });

});

function pP(me) {

  createPlanet(me, 10, 100);
  createPlanet(me, 10, 100);
  createPlanet(me, 25, 200);
}

function resetMap() {
  world = {
    planets:[],
    fleets:[],
    players:[gaia],
    wwidth: INITIAL_WIDTH,
    wheight: INITIAL_HEIGHT
  }
  currentId = 1;
  secrets = ["ga'ia"];
  for (key in sockets) {
    if (sockets[key]) sockets[key].disconnect();
  }
  sockets = [];

  dustfields =[];
  starfield = [];

  init();
}



function init() {
  for (var i = 0; i < 30; i++) {
    createPlanet(gaia, rndI(10,30), rndI(0, 100));
  }

  for (var i = 0; i < 5; i++) {
    dustfields.push( {
      x: rndI(0,world.wwidth),
      y: rndI(0,world.wheight),
      color: randomColorR(100,0.1),
      size: rndI(300, 400),
      midpoint: rnd(0.2,0.5)
    });
  }
  for (var i = 0; i < 500; i++) {
    var part = {
      x: rndI(0,world.wwidth),
      y: rndI(0,world.wheight),
      color: {r:rndI(230,255),
        g:rndI(250,255),b:rndI(120,255),a:rndI(2,10)/10},
     size:Math.floor(rnd(0.2,1)*100)/100};
  //  part.star = true;
    starfield.push(part);
  }


  // start the game loop
  doTurn();
}

function createPlanet(owner, size, ships) {
  // TODO check that the planet does not collide with others
  var x = rndI(size,world.wwidth-size);
  var y = rndI(size,world.wheight-size);

  for (var i = 0; i < world.planets.length; i++) {
    if (dist({x:x, y:y}, world.planets[i]) < size+ world.planets[i].size + 10) { // 10 extra padding
      // retry finding a position
      i = -1;
      x = rndI(size,world.wwidth-size);
      y = rndI(size,world.wheight-size);

      // grow the world with each failed try to place a planet, so that there will be more space
      world.wwidth++;
      world.wheight++;
      continue;
    }
  }

  world.planets.push(new Planet(x,y, size, owner.id, ships));
  owner.planets++;

}

function doTurn() {
  world.arrived = []; // don"t show the ones from last turn again

  for (var i = 0; i < world.fleets.length; i++) {
    world.fleets[i].doTurn();
  }
  for (var i = 0; i < world.fleets.length; i++) {
      if (world.fleets[i].todelete) {
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
  for (var i = 0; i < world.fleets.length; i++) { // even with a fleet, that player is still alive
    if (world.fleets[i].owner != owner) {
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

  sockets[owner].emit("won", {
    players:  world.players.length -1
  });
  resetMap();
}

function tt() { // turn timeout
  setTimeout(doTurn, 3000);
}

function update(socket) { // update a socket
  socket.emit("turn", world);
}

init();


// objects
function Planet(x, y, size, owner, ships) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.owner = owner;
  this.ships = ships;
  this.limit = size*15 + rndI(-50,50); // production limit
}
function produceShips(planet){
  var prod = planet.size / 10;  // production per turn defined by size
  if (world.players[planet.owner].online) {prod*=2;} // faster production, when you"re online

  // calculate the limit based on the planets a player owns
  var limit = planet.limit / Math.max(1, Math.min(5, world.players[planet.owner].planets/8));
//  console.log("limit: "+limit+"/"+planet.limit);
  if (planet.ships <= limit) { // the planet is still able to produce
    planet.ships += Math.floor(prod);
  }
}

function Fleet(fromP, toP, ships, turns) {
  this.fromP = fromP;
  this.owner = world.planets[fromP].owner;
  this.toP = toP;
  this.ships = ships;
  console.log(turns+" turns");
  this.justStarted = true;
  this.turns = turns ;// turns will be decreased by 1 to the actual count in the first turn
  this.way = turns; // length of the way
}
Fleet.prototype.doTurn = function() {
  if (this.justStarted) {
    this.justStarted = false;
  } else {
    this.turns --;
  }
  if (this.turns <= 0) {
    this.todelete = true;

    if (world.planets[this.toP].owner == this.owner) {
      world.arrived.push({
        fromP: this.fromP,
        toP: this.toP,
        owner: this.owner,
        fight: false
      });
      console.log("shipment");
      // friendly shipment
      world.planets[this.toP].ships += this.ships;
    } else {
      console.log("attack from "+this.owner+" to "+world.planets[this.toP].owner);
      // attack

      var defender = world.players[world.planets[this.toP].owner];
      console.log(defender);
      var attackModifier =
        (0.7+0.4*(defender.planets/world.planets.length))  // smaller players have defensive bonus
        *(defender.online?0.7:1);      // online players have defensive bonus

        var attackStrength = Math.floor(attackModifier*this.ships);

      console.log("planets: "+defender.planets+" / "+world.planets.length);
      console.log((defender.planets/world.planets.length));


      console.log("planet bonus: "+ (0.7+0.4*(defender.planets/world.planets.length)));
      console.log("attack modifier: " + attackModifier);
      console.log("attack: " + attackStrength +" / " + this.ships);

      if (world.planets[this.toP].ships < attackStrength) {
        // successfull attack
        console.log("pre: "+world.planets[this.toP].ships);
        world.planets[this.toP].ships = Math.floor(this.ships - (world.planets[this.toP].ships/attackModifier)); // the rest of the ships stays on the planet
        console.log("after: "+world.planets[this.toP].ships);

        var lostGuy = world.planets[this.toP].owner;
        world.players[lostGuy].planets--;
        world.players[this.owner].planets++;

        world.planets[this.toP].owner = this.owner;

        checkAlive(lostGuy);

        world.arrived.push({
          fromP: this.fromP,
          toP: this.toP,
          owner: this.owner,
          fight: true,
          victory: true
        });
      } else {
        world.planets[this.toP].ships -= attackStrength;

        // unsuccessfull attack
        // might be the last ship of the owner
        checkAlive(this.owner);

        world.arrived.push({
          fromP: this.fromP,
          toP: this.toP,
          owner: this.owner,
          fight: true,
          victory: false
        });
      }
    }
  }
}

function checkAlive(lostGuy) {

  // has the
  var stillAlive = false;
  for (var i = 0; i < world.planets.length; i++) {
    if (world.planets[i].owner == lostGuy) {
      stillAlive = true;
      break;
    }
  }

  if (!stillAlive) {
    for (var i = 0; i < world.fleets.length; i++) {
      if (!world.fleets[i].todelete && world.fleets[i].owner == lostGuy) {
        stillAlive = true;
        break;
      }
    }
  }

  if (!stillAlive) {
    // that was his last planet
    world.players[lostGuy].deadTil = Date.now() + 30000;
    if (sockets[lostGuy]) {
      sockets[lostGuy].emit("dead", {dead:30000});
    }
  }

}

// utils
function rnd(min, max) {
  return min +Math.random() * (max - min);
}
function rndI(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function dist(a,b) {
  return Math.sqrt((a.x-b.x)*(a.x-b.x) + (a.y-b.y)*(a.y-b.y));
}
var clrs = [ // get a usefull order of colors
  0.6,
  0,
  0.8,
  0.1,
  0.4,
  0.5,
  0.3,
  0.7,
  0.2,
  0.9,

];
function randomColor(i) {
  i-=1;
  var h = clrs[i%10]+Math.abs(Math.cos(i*.5+rnd(0,1)))*0.09;
  var s = Math.sin(i/15)*0.2  +0.8 + rnd(-0.1,0);
  var v =Math.cos(i/39)*0.3  +0.7 + rnd(-0.2,0.1);

  h = h % 1;

  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch(i % 6){
      case 0: r = v, g = t, b = p; break;
      case 1: r = q, g = v, b = p; break;
      case 2: r = p, g = v, b = t; break;
      case 3: r = p, g = q, b = v; break;
      case 4: r = t, g = p, b = v; break;
      case 5: r = v, g = p, b = q; break;
  }
  r = Math.max(0, Math.min(1, r));
  g = Math.max(0, Math.min(1, g));
  b = Math.max(0, Math.min(1, b));
  function toHex(x) {
    x = Math.floor(x);
    return (x<16?"0":"")+x.toString(16);
  }
  return toHex(r*255)+toHex(g*255)+toHex(b*255);
}
function randomColorR(brightness, alpha){
  function randomChannel(brightness){
    var r = 255-brightness;
    var n = 0|((Math.random() * r) + brightness);
    return n;
  //  var s = n.toString(16);
    //return (s.length==1) ? "0"+s : s;
  }
  return {
  r:randomChannel(brightness),
      g:randomChannel(brightness),
    b: randomChannel(brightness),
    a:alpha
  };
}

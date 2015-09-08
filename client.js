var TURN_LENGTH = 3000;

var lastTurn;
var nextTurnDelta; // delta to the next turn (0: lastTurn just happend  1: nextTurn should be now)

var player = {id:0};

// init
console.log("start game");

var socket = {}
function init() {
  if (!socket.connected) socket = io(document.location.href);


  if (localStorage.secret) {
    // try to rejoin
    socket.emit("rejoin", {secret: localStorage.secret});
  } else {
    socket.emit("join", {name: window.prompt("Enter your name:")});
  }
  socket.on("fail", function(data) {
    // probably the last game we were in has ended
    socket.emit("join", {name: window.prompt("Enter your name:")});
  });

  socket.on('player', function(data) {
    player = data;
    document.body.style.border = "5px solid #"+player.color;

    // we can start the game now
    loop();
  });
  socket.on('secret', function(data) {
    localStorage.secret = data.secret;// we can use the secret to login
  });
  socket.on('turn', function(data){
    world = data;
    lastTurn = Date.now();



      console.log("recieved world");
      console.log(world);
    // check that we are still alive
    for (var i = 0; i < world.planets.length; i++) {
      if(world.planets[i].owner == player.id) {
        return; // we have a planet
      }
    }

    alert ("YOU DIED!");

  });
  socket.on('disconnect', function() {
    alert("SERVER DISCONNECTED");
  });

}

init();


var world = {
  planets:[],
  fleets:[],
  players:[]
};


var selectedStart = -1;
var selectedEnd = -1;
var selectedTime = 0; // to create sin effect

var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;


var canvas = document.createElement('canvas');

var ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

resize();

// move the map
var translatedX = -70;
var translatedY = -64;
var currentScale = 1;



function loop() {
  // Use the identity matrix while clearing the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(1/currentScale, 0, 0, 1/currentScale, -translatedX, -translatedY);

  // draw planets
  align("center");
  font("14px sans-serif");
  for (var i = 0; i < world.planets.length; i++) {
    drawPlanet(i);
  }

  nextTurnDelta = Math.min(1,(Date.now()-lastTurn)/ TURN_LENGTH); // when will the next turn be?

  for (var i = 0; i < world.fleets.length; i++) {
    drawFleet(world.fleets[i]);
  }


  // hud
  // ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawHud();


  requestAnimationFrame(loop);
}

window.onresize = function(event) {
  resize();
};
function resize() {
  WIDTH = window.innerWidth - 10;
  HEIGHT = window.innerHeight - 10;
  console.log(WIDTH+","+HEIGHT);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
}

var lastX = -1, lastY; // for translating the map
window.onmousedown = function(event) {
  var pos = getRelativeCoords(event);
  // TODO check, that we are the owner

  lastX = pos.x;
  lastY = pos.y;
  selectedStart = getPlanet(pos);
  if (selectedStart!= -1 && world.planets[selectedStart].owner != player.id) {
    selectedStart = -1;
  }
  selectedTime = 0;

}
window.onmousemove = function(event) {

  var pos = getRelativeCoords(event);
  if (selectedStart != -1) {
    var plan = getPlanet(pos);
    if (plan != selectedStart) {
      selectedEnd = plan;
    }
  } else if(lastX != -1){ // translate the map
    console.log(pos.x - lastX);
    ctx.translate(pos.x - lastX, pos.y - lastY);
    translatedX -= pos.x - lastX;
    translatedY -= pos.y - lastY;
    lastX = pos.x;
    lastY = pos.y;
  }
}
window.onmouseup = function(event) {
  if (selectedStart != -1 && selectedEnd != -1) {

    var amount = 50;
    // send ships
    socket.emit('send', {
      'from': selectedStart,
      'to': selectedEnd,
      'amount': amount // in percent
    });
    world.planets[selectedStart].ships -= Math.floor(world.planets[selectedStart].ships * amount /100);
    world.fleets.push({
      owner: world.planets[selectedStart].owner,
      from: selectedStart,
      to: selectedEnd,
      justStarted: true
    });
  }
  selectedStart = -1;
  selectedEnd = -1;
  lastX = -1;
}

window.onmousewheel = function (e) {
  	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))*.2 + 1;
    console.log(delta);
    currentScale /= delta;
    ctx.scale(delta, delta);
}

function getPlanet(pos) {
  pos.x += translatedX; pos.y+=translatedY;
  pos.x *= currentScale; pos.y*=currentScale;

  console.log(pos.x+","+pos.y);

  for (var i = 0; i < world.planets.length; i++) {
    if ((world.planets[i].x - pos.x)*(world.planets[i].x - pos.x) + (world.planets[i].y - pos.y)*(world.planets[i].y - pos.y) < world.planets[i].size*world.planets[i].size) {
      return i;
    }
  }
  return -1;
}

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function test() {
  socket.emit("event", {name: "test"});
}


function drawPlanet(p) {
  var planet = world.planets[p];
  color(world.players[planet.owner].color);
  circleF(planet.x, planet.y, planet.size);
  if (p == selectedStart || p == selectedEnd) {
    selectedTime++;
    console.log(selectedTime);

    circle(planet.x, planet.y, (planet.size+Math.abs(Math.sin(selectedTime/10))*5)+2);
  }
  color("FFFFFF");
  text(planet.ships , planet.x, planet.y + planet.size + 12);
}

function drawFleet(fleet) {




  var x,y;
  if (fleet.justStarted) {
    x = world.planets[fleet.from].x;
    y = world.planets[fleet.from].y;
  } else {
    if (fleet.turns > fleet.way) {
      console.error(fleet.turns);
    }

    // TODO add size of the planet?
    x = inter(world.planets[fleet.to].x, world.planets[fleet.from].x, (fleet.turns-nextTurnDelta)/fleet.way);
    y = inter(world.planets[fleet.to].y, world.planets[fleet.from].y, (fleet.turns-nextTurnDelta)/fleet.way);
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(world.planets[fleet.to].y- world.planets[fleet.from].y, world.planets[fleet.to].x - world.planets[fleet.from].x));
  ctx.beginPath();
  ctx.moveTo(-7, -5);
  ctx.lineTo(7,0);
  ctx.lineTo(-7, 5);
  ctx.lineTo(-5,0);
  ctx.lineTo(-7, -5);

  color(world.players[fleet.owner].color);
  ctx.fill();
  color("000000");
  ctx.stroke();

  ctx.restore();
}



function drawHud() {
  font("64px sans-serif");
  align("left");
  text("space reversed", 0, 0);
  font("16px sans-serif");
  text("<--- menu",-30,-45);


  align("right");
  color("ffffff");
  text("online: ", 0, 20);
  var onlinePlayers = 0;
  for (var i = 0; i < world.players.length; i++) {
    if (world.players[i].online) {
      color(world.players[i].color);
      text(world.players[i].name, 0 - 10, 18*onlinePlayers +40);
      onlinePlayers++;
    }
  }
}

// canvas functions
function color(c) {
  ctx.fillStyle="#" + c;
  ctx.strokeStyle="#" + c;
}
function rect(x, y, w, h) {
  ctx.rect(x, y, w, h);
  ctx.stroke();
}
function rectF(x, y, w, h) {
  ctx.rect(x, y, w, h);
  ctx.fill();
}
function circle(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0,2*Math.PI);
  ctx.stroke();
}
function circleF(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0,2*Math.PI);
  ctx.fill();
}
function font(f) {
  ctx.font = f;
}
function text(t, x, y) {
  ctx.fillText(t, x, y);
}

function align(a) {
  ctx.textAlign = a;
}






// utils
function rndI(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function inter(a ,b, v) { // interpolate v=1 -> b v=0 -> a
  return v * b + (1-v) *a;
}

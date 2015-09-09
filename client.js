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
    var name = null;
    while (name == null) {
      name = window.prompt("Enter your name:");
    }
    socket.emit("join", {name: name});
  }
  socket.on("fail", function(data) {
    // probably the last game we were in has ended
    var name = null;
    while (name == null) {
      name = window.prompt("Enter your name:");
    }
    socket.emit("join", {name: name});
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
  socket.on('hof', function(data) {
    hallOfFame = data;
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

    error = "you died";
    localStorage.secret = null;

  });
  socket.on('won', function(data) {
    error = "You won a game with " + data.players+" players!";
  });
  socket.on('disconnect', function() {
    if (error == null) error = "disconnected from server";
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

var error = null;

var hallOfFame = [];


var info = null;

function loop() {
  // Use the identity matrix while clearing the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.setTransform(1/currentScale, 0, 0, 1/currentScale, -translatedX, -translatedY);

  // draw planets
  align("center");
  font(14);
  for (var i = 0; i < world.planets.length; i++) {
    drawPlanet(i);
  }

  nextTurnDelta = Math.min(1,(Date.now()-lastTurn)/ TURN_LENGTH); // when will the next turn be?

  for (var i = 0; i < world.fleets.length; i++) {
    drawFleet(world.fleets[i]);
  }

  if (selectedStart != -1 && selectedEnd != -1) {
    ctx.lineWidth = 3;
    color (player.color);
    line(world.planets[selectedStart].x ,world.planets[selectedStart].y, world.planets[selectedEnd].x ,world.planets[selectedEnd].y);
    ctx.lineWidth = 1;
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
  WIDTH = window.innerWidth - 9;
  HEIGHT = window.innerHeight - 9;
  console.log(WIDTH+","+HEIGHT);
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
}

window.oncontextmenu = function() {return false;}
var lastX , lastY, mouseDown, scaling = false, scalingDist, changeAmount = false; // for translating the map
window.ontouchstart= window.onmousedown = function(event) {

  if (event.button == 2) {
    event.preventDefault();
    return false;
  }
  if (error != null) {
    location.reload();
    return;
  }

  var pos = getRelativeCoords(event);
  // TODO check, that we are the owner

  lastX = pos.x;
  lastY = pos.y;

  if (lastX < 50 && lastY > HEIGHT-50) {
    changeAmount = true;
    return;
  }
  if (lastX > WIDTH-50 && lastY > HEIGHT-50) {
    // center on planet
    focusPlanet(world.planets[0]);
    return;
  }

  selectedStart = getPlanet(pos);
  if (selectedStart!= -1 && world.planets[selectedStart].owner != player.id) {
    selectedStart = -1;
  }
  selectedTime = 0;
  mouseDown = true;
  if (event.touches && event.touches.length == 2) {
    scaling = true;
    scalingDist = Math.max(1,dist(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY -  event.touches[1].pageY));

  } else {
    scaling = false;
  }
    event.preventDefault();
}
window.ontouchmove = window.onmousemove = function(event) {
info = Date.now() + " "+scaling;
  if (scaling) {
    // zoom around the center between both fingers
    lastX = (event.touches[0].pageX + event.touches[1].pageX)/2;
    lastY = (event.touches[0].pageY + event.touches[1].pageY)/2;

    var dst =  Math.max(1,dist(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY));
    info = "scaleMove "+ scalingDist+","+dst+", "+(scalingDist/dst);

    zoom(dst / scalingDist);
    scalingDist = dst;
  }else if (changeAmount) {
    var pos = getRelativeCoords(event);
    amount += (pos.x-lastX + pos.y - lastY) / 4;
    amount = Math.floor(Math.max(1, Math.min(100, amount)));
    lastX = pos.x;
    lastY = pos.y;
  } else {
    var pos = getRelativeCoords(event);
    if (selectedStart != -1) {
      var plan = getPlanet(pos);
      if (plan != selectedStart) {
        selectedEnd = plan;
      }
    } else if(mouseDown){ // translate the map
      console.log(pos.x - lastX);
      ctx.translate(pos.x - lastX, pos.y - lastY);
      translatedX -= pos.x - lastX;
      translatedY -= pos.y - lastY;
    }
    lastX = pos.x;
    lastY = pos.y;
  }
  event.preventDefault();
}


var amount = 50; // percent of ships to send

window.ontouchend = window.onmouseup = function(event) {
  if (selectedStart != -1 && selectedEnd != -1) {

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
  mouseDown = false;
  scaling = false;
  changeAmount = false;

}

window.onmousewheel = function (e) {

  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  if (e.pageX < 50 && e.pageY > HEIGHT-50) {
    // change amount
    amount += delta * 2;
    amount = Math.floor(Math.max(1, Math.min(100, amount)));
  } else {
    var zm = delta*.2 + 1;
    // zoom
    console.log(zm);
    console.log(lastX);

    zoom(zm);

}
}

function zoom(delta) {
  // zenter the zooming on the mouse cursor
  translatedX = ((translatedX + lastX) * delta) - lastX;
  translatedY = ((translatedY + lastY) * delta) - lastY;

  // mouse coordinates changed
//    window.onmousemove
//  translatedX = ((translatedX + lastX) * delta) - lastX;


  currentScale /= delta;
}
if (document.addEventListener) document.addEventListener("DOMMouseScroll", window.onmousewheel);

function focusPlanet(planet) { // focus the canvas on this planet
  translatedX = planet.x / currentScale - WIDTH/2;
  translatedY = planet.y / currentScale - HEIGHT/2;
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
  // adds border
    // if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    if(event.touches !== undefined) {
      return { x: event.touches[0].pageX - 5, y: event.touches[0].pageY -5 };
    }
    return { x: event.pageX -5, y: event.pageY -5};
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
  ctx.closePath();
  color(world.players[fleet.owner].color);
  ctx.fill();
  color("000000");
  ctx.stroke();

  ctx.restore();
}



function drawHud() {


  font(64);
  color("ffffff");
  align("left");
  text(info == null?"space reversed":info, 0, 0);
  font(16);
  text("<--- menu",-30,-45);


  align("right");
  color("ffffff");
  text("online: ", 0, 20);
  var position = 40;
  for (var i = 0; i < world.players.length; i++) {
    if (world.players[i].online) {
      color(world.players[i].color);
      text(world.players[i].name, 0 - 10, position);
      position+= 18;
    }
  }

  position += 20;
  color("d4af37");
  font("bold 16");
  text("Hall of Fame", 0, position);
  position += 18;
  font(16);

  text("User    Date        Players", 0, position);
  position += 20;
  color("ffffff");
  for (var i = hallOfFame.length-1; i >= 0; i--) {
    text(hallOfFame[i].user, -160, position);
    text(hallOfFame[i].date, -60, position);
    text(hallOfFame[i].players, 0, position);
    position += 18;
  }


  ctx.setTransform(1, 0, 0, 1, 0, 0); // stuff that stays at the same place of the screen

  align("center");

  color(player.color);
  rectF(0, HEIGHT - 50, 50, 50);
  rectF(WIDTH - 50, HEIGHT - 50, 50, 50);

  color("000000");
  text(amount + "%", 25, HEIGHT-20);

  if (error != null) {
    color("ff0000");
    font("32px sans-serif");
    text(error, WIDTH/2,HEIGHT/2 - 40);
    color("ffffff");
    font("24px sans-serif");
    text("touch to restart", WIDTH/2, HEIGHT/2);
  }

}

// canvas functions
function color(c) {
  ctx.fillStyle="#" + c;
  ctx.strokeStyle="#" + c;
}
function line (ax, ay, bx, by) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}
function rect(x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.stroke();
}
function rectF(x, y, w, h) {
  ctx.beginPath();
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
  ctx.font = f+"px sans-serif";
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
function dist(x, y) {
  return Math.sqrt(x*x + y*y);
}

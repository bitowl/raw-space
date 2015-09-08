
var players={};
var myPlayer= {x:Math.random()*640,y:Math.random()*480,aimX:0,aimY:0};

// init
console.log("start game");

var socket = {}
function init() {
  if (!socket.connected) socket = io(document.location.href);
  socket.emit("join", {name: "bitowl"});

  
  socket.on('turn', function(data){
    world = data;
    console.log("recieved world");
    console.log(world);
  });

}

init();


var world = {
  planets:[]
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
var translatedX = 0;
var translatedY = 0;
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

  requestAnimationFrame(loop);
}
loop();


window.onresize = function(event) {
  resize();
};
function resize() {
  WIDTH = window.innerWidth;
  HEIGHT = window.innerHeight;
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
    // send ships
    socket.emit('send', {
      'from': selectedStart,
      'to': selectedEnd,
      'amount': 50 // in percent
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
  color("000000");
  text(planet.ships , planet.x, planet.y);
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

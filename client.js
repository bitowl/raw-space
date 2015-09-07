
var players={};
var myPlayer= {x:Math.random()*640,y:Math.random()*480,aimX:0,aimY:0};

// init
console.log("start game");

var socket = {}
function init() {
  if (!socket.connected) socket = io(document.location.href);
  socket.emit("join", {name: "bitowl"});
  socket.on("data",function(data){
    console.log(data);
  });
  socket.on("draw", function(data) {
    ctx.fillRect(data.x-10,data.y-10,10,10);
    console.log("drawing at "+data);
  });



  // players
/*  socket.on('join', function(data){
    players[data.key] = data.values;
  });*/
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



function loop() {
  // fill background
  color("000000");
  rectF(0, 0, WIDTH, HEIGHT);

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
window.onmousedown = function(event) {
  var pos = getRelativeCoords(event);
  // TODO check, that we are the owner
  selectedStart = getPlanet(pos);
  selectedTime = 0;
}
window.onmousemove = function(event) {
  if (selectedStart != -1) {
    var pos = getRelativeCoords(event);
    var plan = getPlanet(pos);
    if (plan != selectedStart) {
      selectedEnd = plan;
    }
  }
}
window.onmouseup = function(event) {
  if (selectedStart != -1 && selectedEnd != -1) {
    // send ships
    socket.emit('send', {
      'from': selectedStart,
      'to': selectedEnd
    });
  }
  selectedStart = -1;
  selectedEnd = -1;
}

function getPlanet(pos) {
  for (var i = 0; i < world.planets.length; i++) {
    if ((world.planets[i].x - pos.x)*(world.planets[i].x - pos.x) + (world.planets[i].y - pos.y)*(world.planets[i].y - pos.y) < world.planets[i].size*world.planets[i].size) {
      return i;
    }
  }
  return -1;
}

canvas.addEventListener('onmousedown', function(event) {
  var pos = getRelativeCoords(event);
  socket.emit("draw", pos);
}, false);

function getRelativeCoords(event) {
    if (event.offsetX !== undefined && event.offsetY !== undefined) { return { x: event.offsetX, y: event.offsetY }; }
    return { x: event.layerX, y: event.layerY };
}

function test() {
  socket.emit("event", {name: "test"});
}


function drawPlanet(p) {
  var planet = world.planets[p];
  color(planet.owner.color);
  circleF(planet.x, planet.y, planet.size);
  if (p == selectedStart || p == selectedEnd) {
    selectedTime++;
    console.log(selectedTime);

    circle(planet.x, planet.y, (planet.size+Math.abs(Math.sin(selectedTime/10))*5)+2);
  }
  color("000000");
  text(planet.shipCount, planet.x, planet.y);
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

var TURN_LENGTH = 3000;

var lastTurn;
var nextTurnDelta; // delta to the next turn (0: lastTurn just happend  1: nextTurn should be now)

var player = {id:0};

var WHITE = "ffffff";

var socket = {}

var particles =[];

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

      name = window.prompt("Enter your name:\n"+data.message);
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
    hallOfFame.sort(function(a,b) {
      return a.players - b.players;
    });
  });
  socket.on('turn', function(data){

    // add particles for every crashing fleet
    for (var i = 0; i < world.fleets.length; i++) {
      var fleet = world.fleets[i];
      if (fleet.turns == 1 && fleet.owner != world.planets[fleet.to].owner) {



        // this would crash this frame
        var from = world.planets[fleet.from];
        var to = world.planets[fleet.to];

        var ang = Math.atan2(from.y-to.y, from.x-to.x);
        var x= Math.cos(ang)*(from.size+5) + to.x; // 5: radius of the fleet
        var y= Math.sin(ang)*(from.size+5) + to.y;

        for (var j = 0; j < 80; j++) {
          SPEED = .1
          particles.push(new Particle(x, y, rndI(200,300), {r:rndI(128,255),g:rndI(0,128),b:0,a:1},{r:255,g:255,b:0,a:0}, rnd(1,2), 0, rnd(-SPEED,SPEED), rnd(-SPEED,SPEED)));
        }

        if (fleet.ships > to.ships) {
          // we will capture this planet
          for (var i = 0; i < Math.PI*2; i+=Math.PI/8) {
            particles.push(new Particle(to.x+Math.cos(i)*to.size, to.y+Math.sin(i)*to.size, 500, world.players[fleet.owner].color,null,2, 0, Math.cos(i)*.1, Math.sin(i)*.1));
          }
        }

      }
    }

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
    for (var i = 0; i < world.fleets.length; i++) {
      if(world.fleets[i].owner == player.id) {
        return; // we have a fleet
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
var translatedX = localStorage.hadIntroduction?-10:-710;
localStorage.hadIntroduction = true;
var translatedY = -64;
var currentScale = 1;

var error = null;

var hallOfFame = [];


var info = null;

var leftBound = -750;
var topBound = -64;
var lastTime = Date.now();;

function loop() {
  // Use the identity matrix while clearing the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  // keep in game bounds
  if (translatedX + WIDTH -50 > world.width/currentScale ) {
    translatedX = world.width/currentScale -  WIDTH +50;
  }
  if (translatedY + HEIGHT -50 > world.height/currentScale ) {
    translatedY = world.height/currentScale -  HEIGHT +50;
  }
  if (translatedX < leftBound/currentScale) {
    translatedX = leftBound / currentScale;
  }
  if (translatedY < topBound/currentScale) {
    translatedY = topBound / currentScale;
  }

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



  console.log("particles: "+particles.length);
  var time = Date.now();
  var delta = time-lastTime;
  for (var i = 0; i < particles.length; i++) {
    var particle = particles[i];
    particle.ttl -= delta;
    if (particle.ttl <= 0) {
      particles.splice(i,1);
      i--;
      continue;
    }
    var v = 1-(particle.ttl/particle.time); // interpolation value
    particle.x += particle.speedX * delta;
    particle.y += particle.speedY * delta;
    console.log(particle.startColor.a);

    if (particle.endColor == null) {
        color(particle.startColor);
    } else {
      ctx.fillStyle = "rgba("+Math.floor(inter(particle.startColor.r, particle.endColor.r,v))+","+Math.floor(inter(particle.startColor.g, particle.endColor.g,v))+","+Math.floor(inter(particle.startColor.b, particle.endColor.b,v))+","+inter(particle.startColor.a, particle.endColor.a,v)+")";
      console.log("rgba("+Math.floor(inter(particle.startColor.r, particle.endColor.r,v))+","+Math.floor(inter(particle.startColor.g, particle.endColor.g,v))+","+Math.floor(inter(particle.startColor.b, particle.endColor.b,v))+","+inter(particle.startColor.a, particle.endColor.a,v)+")");
    }
    circleF(particle.x, particle.y, inter(particle.startSize, particle.endSize, v));
  }
  lastTime = time;



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
  zoom(1);
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
    focusNext();
    return;
  }
  if (lastX < 50 && lastY < 50) {
    // go to menu
    translatedX = -70;
    translatedY = -64;
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
  if (scaling) {
    // zoom around the center between both fingers
    lastX = (event.touches[0].pageX + event.touches[1].pageX)/2;
    lastY = (event.touches[0].pageY + event.touches[1].pageY)/2;

    var dst =  Math.max(1,dist(event.touches[0].pageX - event.touches[1].pageX, event.touches[0].pageY - event.touches[1].pageY));

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
    var ships = Math.floor(world.planets[selectedStart].ships * amount /100);
    if (ships <= 0) {return;}
    world.planets[selectedStart].ships -= ships;
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


  currentScale /= delta;

  if ((world.width - leftBound )/currentScale< WIDTH-100) {
    currentScale = (world.width - leftBound)/(WIDTH-100) ;
    return;
  }
  if ((world.height -topBound )/currentScale < HEIGHT - 50) {
    currentScale = (world.height -topBound )/(HEIGHT-50) ;

    return;
  }
  if (currentScale < 0.2) {
    currentScale = 0.2;
    return;
  }

  // zenter the zooming on the mouse cursor
  translatedX = ((translatedX + lastX) * delta) - lastX;
  translatedY = ((translatedY + lastY) * delta) - lastY;

  // mouse coordinates changed
//    window.onmousemove
//  translatedX = ((translatedX + lastX) * delta) - lastX;


}
if (document.addEventListener) document.addEventListener("DOMMouseScroll", window.onmousewheel);

var focused = -1;
function focusPlanet(planet) { // focus the canvas on this planet


  translatedX = planet.x / currentScale - WIDTH/2;
  translatedY = planet.y / currentScale - HEIGHT/2;
}
function focusNext() {
  for (var i = focused + 1; i < world.planets.length; i++) {
    if (world.planets[i].owner == player.id) {
      focusPlanet(world.planets[i]);
      focused = i;
      return;
    }
  }
  for (var i = 0; i <= focused; i++) {
    if (world.planets[i].owner == player.id) {
      focusPlanet(world.planets[i]);
      focused = i;
      return;
    }
  }
  // there is no planet of us left
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
  color(WHITE);
  text(planet.ships , planet.x, planet.y + planet.size + 12);
}

function drawFleet(fleet) {

  var from = world.planets[fleet.from];
  var to = world.planets[fleet.to];


  var x,y;
  if (fleet.justStarted) {
    var fromC = addSpace(from, to);
    x = fromC.x;
    y = fromC.y;
  } else {
    if (fleet.turns > fleet.way) {
      console.error(fleet.turns);
    }

      // add size of the planet
    var fromC = addSpace(from, to);
    var toC = addSpace(to, from);

    x = inter(toC.x, fromC.x, (fleet.turns-nextTurnDelta)/fleet.way);
    y = inter(toC.y, fromC.y, (fleet.turns-nextTurnDelta)/fleet.way);



        // add particles

        var ang = Math.atan2(from.y-to.y, from.x-to.x);
        var angle = rnd(ang-.5,ang+.5);
        particles.push(new Particle(x + Math.cos(ang)*5,y+Math.sin(ang)*5,rndI(500,1000),{r:rndI(200,255),g:rndI(0,90),b:0,a:1},{r:255,g:255,b:0,a:0},1, 0, Math.cos(angle)/20, Math.sin(angle)/20, 0.2));

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
function addSpace(from, to) {
  var ang = Math.atan2(to.y-from.y, to.x-from.x);
  return {x: Math.cos(ang)*(from.size+5) + from.x, // 5: radius of the fleet
  y: Math.sin(ang)*(from.size+5) + from.y
};
}

var exp = ["instructions:",
"use simple click or touch so move the field",
"use two fingers or the mouse wheel to zoom",
"touch one of your planets and drag to",
"another to send ships",
"",
"a game by:",
"  @bitowl",
"  http://bitowl.de"];


function drawHud() {


  font(64);
  color(WHITE);
  align("left");
  text(info == null?"space reversed":info, 0, 0);

  font(16);
  align("right");
  color(WHITE);
  if (translatedX < 0) { // online users and hall of fame
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

    text("User", -150, position);
    text("Date", -70, position);
    text("Players", 0, position);
    position += 20;
    color(WHITE);
    for (var i = hallOfFame.length-1; i >= 0; i--) {
      text(hallOfFame[i].user, -150, position);
      text(hallOfFame[i].date, -70, position);
      text(hallOfFame[i].players, 0, position);
      position += 18;
    }

  }

  if (translatedX < -370 /currentScale) {
    align("left");
    for (var i = 0; i < exp.length; i++) {
      text(exp[i],-700,i*18);
    }

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
    font(32);
    text(error, WIDTH/2,HEIGHT/2 - 40);
    color(WHITE);
    font(24);
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



function Particle(x, y, ttl, startColor, endColor, startSize, endSize,speedX, speedY) {
  this.x = x;
  this.y = y;
  this.startColor = startColor;
  this.endColor = endColor;
  this.startSize = startSize;
  this.endSize = endSize;
  this.ttl = ttl;
  this.time = ttl; // Total time of this particle
  this.speedX = speedX;
  this.speedY = speedY;
}




// utils
function rndI(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}
function rnd(min, max) {
    return min +Math.random() * (max - min);
}
function inter(a ,b, v) { // interpolate v=1 -> b v=0 -> a
  return v * b + (1-v) *a;
}
function dist(x, y) {
  return Math.sqrt(x*x + y*y);
}

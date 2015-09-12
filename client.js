var TURN_LENGTH = 3000;
var WHITE = "ffffff";
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;

var lastTurn;
var nextTurnDelta; // delta to the next turn (0: lastTurn just happend  1: nextTurn should be now)

var player = {id:0};

var socket = {}

var particles =[];
var starfield = []; // particles belonging to the star field to render them in background
var dustfields = []; // blury bg background circles

var world = {
  planets:[],
  fleets:[],
  players:[],
  wwidth: 1,
  wheight: 1
};


var selectedStart = -1;
var selectedEnd = -1;
var selectedTime = 0; // to create sin effect

var cnvs = document.createElement("canvas");

var ctx = cnvs.getContext("2d");

// move the map
var translatedX = (localStorage.hadIntroduction==1)?-10:-730;
localStorage.hadIntroduction = 1;
var translatedY = -64;
var currentScale = 1;

var error = null;
var info = null;

var hallOfFame = [];

var leftBound = -780;
var topBound = -70;
var lastTime = Date.now();


var nextFrameTime = 0, framesDone;

var focused = -1;

var mp, backgroundMusic = null, loadingStart;
var dead = -1;

var lastX = 0, lastY = 0, mouseDown, scaling = false, scalingDist, changeAmount = false; // for translating the map


if (typeof localStorage.showParticles === "undefined") {
  localStorage.showParticles = 1;
}
if (typeof localStorage.musicOn === "undefined") {
  localStorage.musicOn = 0;
}
if (typeof localStorage.soundOn === "undefined") {
  localStorage.soundOn = 1;
}
if (typeof localStorage.amount === "undefined" || isNaN(localStorage.amount)) {
  localStorage.amount = 50; // percent of ships to send
}



function init() {
  if (!socket.connected) socket = io(document.location.href);

  if (localStorage.secret) {
    // try to rejoin
    socket.emit("rejoin", {secret: localStorage.secret});
  } else {
    var name = null;
    while (name == null) {
      name = window.prompt("Enter your n'ame:");
    }
    socket.emit("join", {name: name});
  }
  socket.on("fail", function(data) {
    // probably the last game we were in has ended
    var name = null;
    while (name == null) {

      name = window.prompt("Enter your n'ame:  "+data.message);
    }
    socket.emit("join", {name: name});
  });
  socket.on("dead", function(data) {
    dead = data.dead;
  });

  socket.on("player", function(data) {
    player = data;
    document.body.style.border = "5px solid #"+player.color;

    // start music if wished
    if (localStorage.musicOn == 1) {
      setTimeout(loadSong,100);
    }
  });
  socket.on("secret", function(data) {
    localStorage.secret = data.secret;// we can use the secret to login
  });
  socket.on("hof", function(data) {
    hallOfFame = data;
    hallOfFame.sort(function(a,b) {
      return a.players - b.players;
    });
  });
  socket.on("dustfields", function(data) {
    dustfields = data;
  });
  socket.on("starfield", function(data) {
    starfield = data;
  });
  socket.on("turn", function(data){
    var start = false;
    if (world.players.length == 0) {
      // we have not recieved a world before
      start = true;

    }


    world = data;
    lastTurn = Date.now();


    // add particles for every crashing fleet
    if (particles) {
      for (var i = 0; i < world.arrived.length; i++) {
        var fleet = world.arrived[i];
        if (fleet.fight) {
          var from = world.planets[fleet.fromP];
          var to = world.planets[fleet.toP];

          var ang = Math.atan2(from.y-to.y, from.x-to.x);
          var x= Math.cos(ang)*(from.size+5) + to.x; // 5: radius of the fleet
          var y= Math.sin(ang)*(from.size+5) + to.y;

          for (var j = 0; j < 80; j++) {
            SPEED = .1
            particles.push(new Particle(x, y, rndI(200,300), {r:rndI(128,255),g:rndI(0,128),b:0,a:1},{r:255,g:255,b:0,a:0}, rnd(1,2), 0, rnd(-SPEED,SPEED), rnd(-SPEED,SPEED)));
          }

          if (fleet.victory) {
            // this planet got captured
            for (var i = 0; i < Math.PI*2; i+=Math.PI/8) {
              particles.push(new Particle(to.x+Math.cos(i)*to.size, to.y+Math.sin(i)*to.size, 500, world.players[fleet.owner].color,null,2, 0, Math.cos(i)*.1, Math.sin(i)*.1));
            }
            playSnd(3);
          } else {
            // explosion
            playSnd(0);
          }
        }
      }
    }


    if (start) {
      document.body.innerHTML="";
      document.body.appendChild(cnvs);

      rescale();
      // we can start the game now
      doLoop();
    }
  });
  socket.on("won", function(data) {
    error = "You w'on a game with " + data.players+" pla'yers!";
  });
  socket.on("disconnect", function() {
    if (error == null) error = "disconnected from server";
  });
}


function doLoop() {
  var time = Date.now();
  var delta = time-lastTime;

  nextTurnDelta = Math.min(1,(Date.now()-lastTurn)/ TURN_LENGTH); // when will the next turn be?


  if (dead > 0) {  // count down the death timer
    dead -= delta;
    if (dead < 0) {
      dead = -2;
    }
  }

  // use the identity matrix to clean the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cnvs.width, cnvs.height);

  // keep viewport in game bounds
  if (translatedX + WIDTH -50 > world.wwidth/currentScale ) {
    translatedX = world.wwidth/currentScale -  WIDTH +50;
  }
  if (translatedY + HEIGHT -50 > world.wheight/currentScale ) {
    translatedY = world.wheight/currentScale -  HEIGHT +50;
  }
  if (translatedX < leftBound/currentScale) {
    translatedX = leftBound / currentScale;
  }
  if (translatedY < topBound/currentScale) {
    translatedY = topBound / currentScale;
  }

  ctx.setTransform(1/currentScale, 0, 0, 1/currentScale, -translatedX, -translatedY);



  if (localStorage.showParticles == 1) {
    // draw dust and star field
    for (var i = 0; i < dustfields.length; i++) {
      var dust = dustfields[i];
      var radgrad = ctx.createRadialGradient(dust.x, dust.y,0,dust.x,dust.y, dust.size);
      radgrad.addColorStop(0, "rgba("+dust.color.r+","+dust.color.g+","+dust.color.b+",.2)");
      radgrad.addColorStop(dust.midpoint, "rgba("+dust.color.r+","+dust.color.g+","+dust.color.b+",.1)");
      radgrad.addColorStop(1, "rgba("+dust.color.r+","+dust.color.g+","+dust.color.b+",0)");

      ctx.fillStyle = radgrad;
      ctx.fillRect(dust.x-dust.size,dust.y-dust.size,dust.size*2,dust.size*2);
    }

    for (var i = 0; i < starfield.length; i++) {
      var star = starfield[i];
      ctx.fillStyle = "rgba("+star.color.r+","+star.color.g+","+star.color.b+","+star.color.a+")";
      circleF(star.x, star.y, star.size);
    }
  }

  // draw planets
  align("center");
  font(14);
  for (var i = 0; i < world.planets.length; i++) {
    drawPlanet(i);
  }

  for (var i = 0; i < world.fleets.length; i++) {
    drawFleet(world.fleets[i]);
  }

  if (localStorage.showParticles == 1) {
    ctx.globalCompositeOperation = "screen"; // additive blending

    framesDone++;
    if (nextFrameTime < time) {
      nextFrameTime = time + 1000;
      console.info("fps: "+framesDone);
      framesDone = 0;
    }
    for (var i = 0; i < particles.length; i++) {
      var particle = particles[i];

      particle.ttl -= delta;
      if (particle.ttl <= 0) {
        particles.splice(i,1);
        i--;
        continue;
      }

      particle.x += particle.speedX * delta;
      particle.y += particle.speedY * delta;

      drawParticle(particle);
    }
    ctx.globalCompositeOperation = "source-over";
  }

  // connection line, if there will be ships send if we let go of the mouse
  if (selectedStart != -1 && selectedEnd != -1) {
    ctx.lineWidth = 3;
    color (player.color);
    lineS(world.planets[selectedStart].x ,world.planets[selectedStart].y, world.planets[selectedEnd].x ,world.planets[selectedEnd].y);
    ctx.lineWidth = 1;
  }

  drawHud();

  lastTime = time;
  requestAnimationFrame(doLoop);
}

window.oncontextmenu = function() {return false;}

window.ontouchstart = window.onmousedown = function(event) {
  if (event.button == 2) {
    event.preventDefault();
    return false;
  }
  if (error != null || (dead < 0 && dead != -1)) {
    location.reload();
    return;
  }

  var pos = getRelativeCoords(event);

  lastX = pos.x;
  lastY = pos.y;

  if (lastX < 150 && lastY > HEIGHT-50) {
    changeAmount = true;
    return;
  }
  if (lastX > WIDTH-50 && lastY > HEIGHT-50) {
    // center on planet
    focusNext();
    playSnd(1);
    return;
  }
  if (lastX < 50 && lastY < 50) {
    // go to menu
    translatedX = -70;
    translatedY = -64;
    return;
  }
  var rx = (lastX +translatedX)*currentScale;
  var ry = (lastY +translatedY)*currentScale;


  if (rx < 0  && rx > -120 && ry <0 && ry > -20) {
    // particle option
    if (localStorage.showParticles == 1) {
      playSnd(6);
      localStorage.showParticles = 0;
    } else {
      playSnd(5);
      localStorage.showParticles = 1;
    }
    return;
  }

  if (rx < 0  && rx > -120 && ry <-20 && ry > -50) {
    // music option
    if (localStorage.musicOn == 1) {
      localStorage.musicOn = 0;
      if (backgroundMusic != null) {
        backgroundMusic.pause();
      }
      playSnd(6);
    } else {
      localStorage.musicOn = 1;
      if (backgroundMusic == null) {
        loadSong();
      } else {
        backgroundMusic.play();
      }
      playSnd(5);
    }
    return;
  }

  if (rx < 0  && rx > -120 && ry <-50 && ry > -70) {
    // sound option
    if (localStorage.soundOn == 1) {
      localStorage.soundOn = 0;
    } else {
      localStorage.soundOn = 1;
      playSnd(5);
    }
    return;
  }

  if (rx < -500 && ry < (exp.length-1) * 18 && ry> (exp.length-3)*18) { // homepage
    window.open("http://bitowl.de");
    return;
  }


  selectedStart = getPlanet(pos);
  if (selectedStart!= -1 && world.planets[selectedStart].owner != player.id) {
    selectedStart = -1;
  } else if (selectedStart != -1) {
    // selected own planet
    playSnd(1);
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
    var amount = parseInt(localStorage.amount)+(pos.x-lastX /*+ pos.y - lastY*/);
    localStorage.amount = Math.floor(Math.max(1, Math.min(100, amount)));
    lastX = pos.x;
    lastY = pos.y;
  } else {
    var pos = getRelativeCoords(event);
    if (selectedStart != -1) {
      var plan = getPlanet(pos);
      if (plan != selectedStart) {
        if (plan != -1 && selectedEnd != plan) {

          /*// calculate distance
          var start = world.planets[selectedStart];
          var end = world.planets[plan];
          if (dist(end.x-start.x, end.y-start.y) > world.width/3) {
            selectedEnd = -1;
            return;
          }*/
          // we selected another planet
          if (world.planets[plan].owner == player.id) {
            playSnd(1);
          } else {
            playSnd(2);
          }
        }
        selectedEnd = plan;
      }
    } else if(mouseDown){ // translate the map
      translatedX -= pos.x - lastX;
      translatedY -= pos.y - lastY;
    }
    lastX = pos.x;
    lastY = pos.y;
  }
  event.preventDefault();
}

window.ontouchend = window.onmouseup = function(event) {
  if (selectedStart != -1 && selectedEnd != -1) {

    // send ships
    socket.emit("send", {
      "fromP": selectedStart,
      "toP": selectedEnd,
      "amount": parseInt(localStorage.amount) // in percent
    });
    var ships = Math.floor(world.planets[selectedStart].ships * localStorage.amount /100);
    if (ships > 0) {
      world.planets[selectedStart].ships -= ships;
      world.fleets.push({
        owner: world.planets[selectedStart].owner,
        fromP: selectedStart,
        toP: selectedEnd,
        justStarted: true
      });
      playSnd(4);
    }
  }
  selectedStart = -1;
  selectedEnd = -1;
  mouseDown = false;
  scaling = false;
  changeAmount = false;
  event.preventDefault();
}

window.onmousewheel = function (e) {

  var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
  if (e.pageX < 150 +10 && e.pageY > HEIGHT-50 -10) {
    // change amount
    var amount = parseInt(localStorage.amount) +delta * 2;
    localStorage.amount = Math.floor(Math.max(1, Math.min(100, amount)));
  } else {
    var zm = delta*.2 + 1;
    // zoom

    zoom(zm);

  }
}

function zoom(delta) {
  var ocs = currentScale;
  currentScale /= delta;

  if ((world.wwidth - leftBound )/currentScale< WIDTH-100) {
    currentScale = (world.wwidth - leftBound)/(WIDTH-100) ;
    return;
  }
  if ((world.wheight -topBound )/currentScale < HEIGHT - 50) {
    currentScale = (world.wheight -topBound )/(HEIGHT-50) ;
    return;
  } else
  if (currentScale < 0.2) {

    currentScale = 0.2;
    delta = ocs/currentScale;
  }

  // center the zooming on the mouse cursor
  if (delta != 0) {
  translatedX = ((translatedX + lastX) * delta) - lastX;
  translatedY = ((translatedY + lastY) * delta) - lastY;
  }
}
if (document.addEventListener) document.addEventListener("DOMMouseScroll", window.onmousewheel);

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

window.onresize = function(event) {
  rescale();
};
function rescale() {
  WIDTH = window.innerWidth - 9;
  HEIGHT = window.innerHeight - 9;
  cnvs.width = WIDTH;
  cnvs.height = HEIGHT;
  if (world.wwidth != 1) {zoom(1);}
}

function drawPlanet(p) {
  var planet = world.planets[p];
  color(world.players[planet.owner].color);
  circleF(planet.x, planet.y, planet.size);

  if (p == selectedStart || p == selectedEnd) {
    selectedTime++;
    if (p == selectedEnd && planet.owner != player.id) {
      color("ff0000"); // signal attack
    }

    circleS(planet.x, planet.y, (planet.size+Math.abs(Math.sin(selectedTime/10))*5)+2);
  }
  color(WHITE);
  textF(planet.ships , planet.x, planet.y + planet.size + 12);
}

function drawFleet(fleet) {
  var from = world.planets[fleet.fromP];
  var to = world.planets[fleet.toP];

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

    if(localStorage.showParticles == 1) {
      // add particles
      var ang = Math.atan2(from.y-to.y, from.x-to.x);
      for (var i = 0; i < 5; i++) {
        var angle = rnd(ang-.5,ang+.5);
        var speed = rnd(0.03,0.05);
        particles.push(new Particle(x + Math.cos(ang)*5,y+Math.sin(ang)*5,rndI(500,1000),{r:rndI(200,255),g:rndI(0,90),b:0,a:1},{r:255,g:255,b:0,a:0},1, 0, Math.cos(angle)*speed, Math.sin(angle)*speed));
      }
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(world.planets[fleet.toP].y- world.planets[fleet.fromP].y, world.planets[fleet.toP].x - world.planets[fleet.fromP].x));
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
function drawParticle(particle) {
  var v = 1 - (particle.ttl / particle.time);

  if (particle.endColor == null) {
    color(particle.startColor);
  } else {
    ctx.fillStyle = "rgba("+Math.floor(inter(particle.startColor.r, particle.endColor.r,v))+","+Math.floor(inter(particle.startColor.g, particle.endColor.g,v))+","+Math.floor(inter(particle.startColor.b, particle.endColor.b,v))+","+inter(particle.startColor.a, particle.endColor.a,v)+")";
  }
  circleF(particle.x, particle.y, inter(particle.startSize, particle.endSize, v));
}


//"raw | space is a t'urn based, multipl'ayer",
//"spacewar game optimised for touch control.",

var exp = ["*Instructions:",
"",
"Click and drag to move the field.",
"Pinch the screen or use the mouse wheel to zo'om.",
"",
"Touch one of your plan'ets and drag to",
"another to se'nd sh'ips.",
"You can change the percentage of shi'ps that",
"are se'nt with the slider in the bottom left.",
"But be careful! A planet without",
"sh'ips is defenseless agains other pl'ayers.",
"",
"Click on the button in the bottom",
"right to focus the view on one of your pla'nets.",
"",
"Capture all plan'ets to win a round and get an",
"entry in the Hall of Fame.",
"If there were more pla'yers in your round, you",
"get more fame, so invite people to play.",
"",
"To play just drag to the right.",
"",
"",
"",
"",
"*Further Tipps:",
"",
"Each tu'rn is three seconds long.",
"Ship orders can be placed anytime, but",
"will be executed on the next tu'rn.",
"",
"Bigger plan'ets produce more shi'ps per tu'rn",
"than smaller ones.",
"Pla'nets have a l'imit of sh'ips they can store.",
"If there are more ship's on a planet than the lim'it,",
"no new shi'ps will be produced (by that planet).",
"",
"When you get stronger your strength will slowly",
"reverse. The lim'it of your plan'ets will decrease.",
"Defending shi'ps are stronger than attacking",
"ones, but the more sh'ips you have in total, the",
"lower their defensive strength is.",
"If you are offline, your ship's will still",
"exist. But watch out! When you come back, the",
"situation in the universe might be reversed.",
"",
"",
"",
"If you are on a computer, you can tu'rn on music.",
"If the game runs slow, tur'n off partic'les and sound.",
"",
"",
"a game by:",
"*  @bitowl",
"*  http://bitowl.de"];


function drawHud() {
  font(64);
  color(WHITE);
  align("left");
  textF(info == null?"raw | space":info, 30, -10);

  font(16);
  align("right");
  if (localStorage.showParticles == 1) {
    color("00cc00");
    textF("on",-10, -10);
  } else {
    color("cc0000");
    textF("off", -10, -10);
  }
  if (localStorage.musicOn == 1) {
    color("00cc00");
    textF("on",-10, -30);
  } else {
    color("cc0000");
    textF("off", -10, -30);
  }
  if (localStorage.soundOn == 1) {
    color("00cc00");
    textF("on",-10, -50);
  } else {
    color("cc0000");
    textF("off", -10, -50);
  }
  color(WHITE);
  textF("par'ticles: ", -30, -10);
  textF("music: ", -30, -30);
  textF("sound: ", -30, -50);

  if (translatedX < 0) { // online users and hall of fame
    textF("onli'ne: ", 0, 20);
    var position = 40;
    for (var i = 0; i < world.players.length; i++) {
      if (world.players[i].online) {
        color(world.players[i].color);
        textF(world.players[i].name, 0 - 10, position);
        position+= 18;
      }
    }

    position += 20;
    color("d4af37");
    font("bold 16");
    textF("Hall of Fame", 0, position);
    position += 18;
    font(16);

    textF("User", -150, position);
    textF("Date", -70, position);
    textF("Players", 0, position);
    position += 20;
    color(WHITE);
    for (var i = hallOfFame.length-1; i >= 0; i--) {
      textF(hallOfFame[i].user, -150, position);
      textF(hallOfFame[i].date, -70, position);
      textF(hallOfFame[i].players, 0, position);
      position += 18;
    }

  }

  if (translatedX < -370 /currentScale) { // introduction
    align("left");
    var bold = false;
    for (var i = 0; i < exp.length; i++) {
      if (exp[i].startsWith("*")) {
        font("bold 16");
        bold = true;

        textF(exp[i].substring(1),-720,i*18);
        continue;
      } else if (bold) {
        font("16")
        bold = false;
      }

      textF(exp[i],-720,i*18);
    }

  }


  ctx.setTransform(1, 0, 0, 1, 0, 0); // stuff that stays at the same place of the screen

  align("center");
  font(16);

  color(player.color);

  rectF(0, HEIGHT-35, 150, 20);
  rectF(localStorage.amount, HEIGHT-50, 50,50);  // slider
  rectF(WIDTH - 50, HEIGHT - 50, 50, 50);        // knob

  color("000000");
  textF(localStorage.amount + "%", parseInt(localStorage.amount) + 25, HEIGHT-20);
  textF(">", WIDTH-25, HEIGHT-20);

  if (error != null) {
    color("ff0000");
    font(32);
    textF(error, WIDTH/2,HEIGHT/2 - 40);
    color(WHITE);
    font(24);
    textF("touch to restart", WIDTH/2, HEIGHT/2);
  } else if (dead != -1) {
    color("ff0000");
    font(32);
    textF("You died!", WIDTH/2,HEIGHT/2 - 40);
    color(WHITE);
    font(24);
    if (dead > 0) {
      textF("wait " + Math.floor(dead/1000)+ " seconds...", WIDTH/2, HEIGHT/2);
    } else {
      textF("touch to respawn", WIDTH/2, HEIGHT/2);
    }
  }

}

// canvas functions
function color(c) {
  ctx.fillStyle="#" + c;
  ctx.strokeStyle="#" + c;
}
function lineS(ax, ay, bx, by) {
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.lineTo(bx, by);
  ctx.stroke();
}

function rectF(x, y, w, h) {
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.fill();
}
function circleS(x, y, r) {
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
function textF(t, x, y) {
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


init();

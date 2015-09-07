
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
  socket.on('update', function(data){
    players[data.key] = data.values;
  });

}

init();

var canvas = document.getElementById("c");
var ctx = canvas.getContext('2d');

var WIDTH = 20;
var HEIGHT = 15;
var img = new Image();
img.src = "./img.png";
img.onload = function() {
  var sx = 0;
  var sy = 0;
  var dx = 0;
  var dy = 0;
  for (var x = 0; x < WIDTH; x++) {
    for (var y = 0; y < HEIGHT; y++) {
      drawImg(rndI(0,3), x, y);
    }
  }
};


// size of our tile image
var IMG_W = 4;
var IMG_H = 4;

function drawImg(id, x, y) {
  var sx = (id % IMG_W) * 8;
  var sy = Math.floor(id/IMG_W) * 8;
  ctx.drawImage(img, sx, sy, 8, 8, x*8, y*8, 8, 8);
}


ctx.fillStyle="#FF0000";

canvas.addEventListener('click', function(event) {
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

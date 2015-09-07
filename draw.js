var timer;

var DEAD_ZONE = 0.2;
var SPEED = 5;
function gameLoop() {
  // input
  getGamepadInput();
  // console.log(leftX+","+leftY+"  "+rightX+","+rightY)

  var update = false;
  if (Math.abs(leftX) > DEAD_ZONE) {
    myPlayer.x += leftX * SPEED;
    update = true;
  }
  if (Math.abs(leftY) > DEAD_ZONE) {
    myPlayer.y += leftY * SPEED;
    update = true;
  }
  if (Math.abs(rightX) > DEAD_ZONE || Math.abs(rightY) > DEAD_ZONE) {
    myPlayer.aimX = rightX;
    myPlayer.aimY = rightY;
    update = true;
  } else if(myPlayer.aimX!=0 || myPlayer.aimY != 0) { // reset to not shooting
    myPlayer.aimX = 0;
    myPlayer.aimY = 0;
    update = true;
  }
  if (update) { // if we moved, send the update to the other players
    socket.emit('update', myPlayer);
  }

console.log(myPlayer.aimX+","+myPlayer.aimY);
console.log(players);




  // draw
  ctx.clearRect(0, 0, canvas.width, canvas.height);


  for (key in players) {
    var player = players[key];
    ctx.fillColor = "#ffffff";
    drawCircle(player.x, player.y, 10);
    ctx.fillColor = "#ff0000";
    drawLine(player.x, player.y, player.x+player.aimX*10, player.y+player.aimY*10);
  }


  timer = requestAnimationFrame(gameLoop);
}
gameLoop();




// util functions
function drawCircle(x,y,radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI*2, true);
  ctx.closePath();
  ctx.fill();
}
function drawLine(sx,sy,dx,dy) {
  ctx.beginPath();
  ctx.moveTo(sx,sy);
  ctx.lineTo(dx,dy);
  ctx.stroke();
}

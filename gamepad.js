/*window.addEventListener("gamepadconnected", function(e) {
  console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
    e.gamepad.index, e.gamepad.id,
    e.gamepad.buttons.length, e.gamepad.axes.length);
    gp = e.gamepad;
});

// chrome gamepad detection
var interval;
if (!('ongamepadconnected' in window)) {
  // No gamepad events available, poll instead.
  interval = setInterval(pollGamepads, 500);
}

function pollGamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  for (var i = 0; i < gamepads.length; i++) {
    var gamepad = gamepads[i];
    if (gamepad) {
      console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
        gamepad.index, gamepad.id,
        gamepad.buttons.length, gamepad.axes.length);
      gp = gamepad;
      clearInterval(interval);
    }
  }
}

window.addEventListener("gamepaddisconnected", function(e) {
  console.log("Gamepad disconnected from index %d: %s",
    e.gamepad.index, e.gamepad.id);
});*/

// connected gamepad
var gp;

var DEAD_ZONE = .2;

var leftX, leftY, rightX, rightY;
function getGamepadInput() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads : []);
  if (!gamepads) {
    return;
  }

  var gp = gamepads[0];
  if (gp == null) return;
  if (gp.axes[0] > DEAD_ZONE) {
      player.down();
  }
  leftY = gp.axes[1];
  rightX = gp.axes[3];
  rightY = gp.axes[4];
}

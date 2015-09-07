
// objects
function Planet(x, y, size, owner) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.owner = owner;
  this.shipCount = 0;
}
Planet.prototype.afterTurn = function() {
  this.shipCount += this.size; // production per turn defined by size
}





// utils
function rndI(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}



if (typeof exports != "undefined") {
exports.Planet = Planet;
exports.rndI = rndI;
}

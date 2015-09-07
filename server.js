log('we started the game');

var io = require('sandbox-io');

var sockets = [];
var currentId = 0;

io.on('connection', function(socket){
  var myid = currentId++;
  sockets[myid] = socket;
  socket.on('event', function(data){
    socket.emit("data",{"keks":true});
  });
  socket.on('draw', function(data) {
    for (key in sockets) {
      sockets[key].emit("draw", data);
    }
  });
  socket.on('update', function(data){ // a player updates us with his position
    for (key in sockets) {
      sockets[key].emit('update', {
        key: myid,
        values: data
      });
    }
  });
  socket.on('disconnect', function(){
    // TODO remove this socket from sockets
  });
});

// Setup basic express server
var express = require("express");
var app = express();
var server = require("http").createServer(app);
var io = require("socket.io")(server);
var port = process.env.PORT || 3000;

var players = [];
var currPlayerIndex = 0;
var player1Turn = true;
const stanzaSyllables = [5, 7, 5, 0];
var stanzaLine = 1;

server.listen(port, function () {
  console.log("Server listening at port %d", port);
});

// Routing
app.use(express.static("public"));

// Chatroom
var numUsers = 0;

// when a client is connected to server?
io.on("connection", function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on("new message", function (data) {
    // client will only be able to send message when it's their turn.
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username,
      message: data,
    });

    switchTurns();
  });

  // when the client emits 'add user', this listens and executes
  socket.on("add user", function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    ++numUsers;
    addedUser = true;

    players.push({
      id: socket.id,
      username: username,
    });
    
    if (players.length === 1) {
      
      socket.emit("waiting room", {message: "Waiting for another buddy to join..." })
      io.to(players[0].id).emit("not your turn", { username: players[0].username, waiting: true, });
      
    } else if (players.length === 2) {
      switchTurns();
      console.log("CHAT ROOM MAY COMMENCE...");
    }

    socket.emit("login", {
      numUsers: numUsers,
    });

    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      numUsers: numUsers,
    });
  });

  // when the client emits 'typing', we broadcast it to others
  socket.on("typing", function () {
    socket.broadcast.emit("typing", {
      username: socket.username,
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on("stop typing", function () {
    socket.broadcast.emit("stop typing", {
      username: socket.username,
    });
  });

  // when the user disconnects.. perform this
  socket.on("disconnect", function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit("user left", {
        username: socket.username,
        numUsers: numUsers,
      });
      // internal tracking of array
      players.splice(players.indexOf(socket.username), 1);
      // currPlayerIndex--;
      console.log("Array has... ", +players.length);
    }
  });

  function switchTurns() {
      // increment stanza count – socket or io ?
    if (stanzaLine == 4){
      // send message, dash in the chat? 
      // io.emit("blank message", "--");
      io.emit('blank message', { message: '--' });
      stanzaLine = 1;
    }
    
    // Disperse information to all clients about the stanza syllables (all clients are updated) ...
    io.emit("stanzaSyllables", { stanzaSyllables: stanzaSyllables[stanzaLine - 1] });
    
    stanzaLine += 1;
    console.log('you are currently writing a stanza with line ... '+stanzaLine +' syllables' +stanzaSyllables);
    
    // Notify the current player that it's their turn
    io.to(players[currPlayerIndex].id).emit("your turn", { username: players[currPlayerIndex].username, });

    // Notify the other player that it's not their turn
    const otherPlayerIndex = (currPlayerIndex + 1) % players.length;
    io.to(players[otherPlayerIndex].id).emit("not your turn", { username: players[otherPlayerIndex].username, waiting: false, });

    // increment the turn index for the next switch
    currPlayerIndex = (currPlayerIndex + 1) % players.length;

  

  }
});

// Note: The following code in p5 serves the same purpose as this html:
/*
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Chatroom</title>
  <link rel="stylesheet" href="style.css">
  <link rel="shortcut icon" href="https://cdn.glitch.com/e6d1cd65-3819-4e3d-8786-8536d04dc950%2Ffavicon.ico?1495138588053" type="image/x-icon">
</head>
<body>
  <ul class="pages">
    <li class="chat page">
      <div class="chatArea">
        <ul class="messages"></ul>
      </div>
      <input class="inputMessage" placeholder="Type here..."/>
    </li>
    <li class="login page">
      <div class="form">
        <h3 class="title">Type Username</h3>
        <input class="usernameInput" type="text" maxlength="14" />
      </div>
    </li>
  </ul>
*/

var pages,
  chatPage,
  chatArea,
  messages,
  inputMessage,
  usernameInput,
  loginPage,
  projectTitle,
  loginTitle,
  syllableCountText,
  syllabusChatCount;
var socket = io();
var FADE_TIME = 150; // milliseconds
var TYPING_TIMER_LENGTH = 400; // milliseconds
var loginElem;
var messageElem;
var username;
var connected = false;
var typing = false;
var lastTypingTime;

// HAIKU SPECIFIC VARIABLES HERE @@@@@@@@@@@@@@@@@@@@@@@@@@
const maxPlayer = 2;
var player1Turn = true;
var stanzaLine = 1; // 1, 2, 3 > haiku | 4 > empty stanza that adds a space and resets
let lastTime = 0;
let interval = 3500;
var sendMessage;
var syllableCheck;
var stanzaSyllables = 5;
var clearUsernameInput = false;
var stanzaSyllablesUpdated = false;
var inactivityThreshold = 10000;


// let stanzaSyllables = [5, 7, 5, 0];

var COLORS = [
  "#e21400",
  "#91580f",
  "#f8a700",
  "#f78b00",
  "#58dc00",
  "#287b00",
  "#a8f07a",
  "#4ae8c4",
  "#3b88eb",
  "#3824aa",
  "#a700ff",
  "#d300e7",
];

function setup() {
  // using p5js to create html elements
  // check out https://p5js.org/reference/#/libraries/p5.dom for reference on the p5 DOM library

  // Create pages div
  pages = createElement("div", "");
  pages.class("pages");
  pages.parent(document.body);

  // Create a new div within pages to encapsulate chat-related elements
  let chatElementsDiv = createDiv("");
  chatElementsDiv.class("chat-elements");
  chatElementsDiv.parent(pages);

  // Create chatPage and append it to chatElementsDiv
  chatPage = createElement("div", "");
  chatPage.class("chat page");
  chatPage.parent(chatElementsDiv);

  // Create chatArea and append it to chatPage
  chatArea = createDiv("");
  chatArea.class("chatArea");
  chatArea.parent(chatPage);

  // Create syllabusChatCount and append it to chatElementsDiv
  // syllabusChatCount = createP(+stanzaSyllables + " syllables left");
  // syllabusChatCount.class("syllablesChatCount");
  // syllabusChatCount.parent(chatArea);

  // Create messages and append it to chatArea
  messages = createElement("ul", "");
  messages.class("messages");
  messages.parent(chatArea);

  // login page code –––––––––––––––––––––––––––––––––––––––
  inputMessage = createInput("");
  inputMessage.class("inputMessage");
  inputMessage.parent(chatArea);
  
  syllableCountText = createDiv("");
  syllableCountText.parent(chatArea);

  loginPage = createElement("div", "");
  loginPage.class("login page");
  loginPage.parent(pages);

  form = createDiv("");
  form.class("form");
  form.parent(loginPage);

  // me code
  projectTitleJapanese = createElement("h3", "(俳句) ");
  projectTitleJapanese.class("projectTitleJapanese");
  projectTitleJapanese.parent(form);

  projectTitle = createElement("h1", "HAIKU <br> CHATROOM");
  projectTitle.class("projectTitle");
  projectTitle.parent(form);

  let spacingDiv1 = createDiv("");
  spacingDiv1.parent(form);
  spacingDiv1.style("height", "20px"); // Adjust the height as needed

  loginTitle = createElement(
    "h2",
    "Five, seven, then five <br> Syllables mark a haiku. <br> Remarkable oaf."
  );
  loginTitle.class("title");
  loginTitle.parent(form);

  haikuDescription = createElement(
    "h3",
    "– Macmu-Ling's insulting Haiku in <br> Tales of Ba Sing Se."
  );
  haikuDescription.class("haikuDescription");
  haikuDescription.parent(form);

  let defaultText = "Enter your 3 letter name";
  // div to contain both the title and the input
  let inputContainer = createDiv("");
  inputContainer.parent(form);

  usernameInput = createInput(defaultText);
  usernameInput.parent(inputContainer);
  usernameInput.class("usernameInput");

  // Add an input event listener to clear the default text
  usernameInput.input(clearDefaultText);

  function clearDefaultText() {
    if (clearUsernameInput == false) {
      usernameInput.value("");
      clearUsernameInput = true;
    }

    // Limit the input to 3 letters
    if (usernameInput.value().length > 2) {
      usernameInput.value(usernameInput.value().slice(0, 3));
    }
    // Check if the current input value is equal to the default text    
  }

  loginElem = new p5.Element(usernameInput.elt);
  messageElem = new p5.Element(inputMessage.elt);

  createCanvas(0, 0); // the canvas is below the chatroom which is made with html
  initJQuery();
}

function draw() {
  //you can change the html elements like this, make sure to create the p5 element in setup!
  background("#DCDDDD");
  // loginElem.style("color", hex(random(100, 155)));
  loginElem.style("color", "black");
  messageElem.style("color", "black");

  // inputElem.style('width:'+random(0,200)+'px;'); // you can change anything that you can change in the css like this

  // periodically check if the message in the user's box has reached x syllables
  let currentTime = millis();

  if (currentTime - lastTime >= interval) {
    lastTime = currentTime;

    if (username) {
      syllableCheck();
    }
  }
}

// jquery is used to update the html elements that p5 made
// all socketio communication is in here too.
function initJQuery() {
  // Initialize variables
  var $window = $(window);
  var $usernameInput = $(".usernameInput"); // Input for username
  var $messages = $(".messages"); // Messages area
  var $inputMessage = $(".inputMessage"); // Input message input box
  var $loginPage = $(".login.page"); // The login page
  var $chatPage = $(".chat.page"); // The chatroom page
  var $currentInput = $usernameInput.focus();

  function addParticipantsMessage(data) {
    var message = "";

    if (data.numUsers === 1) {
      message += "Waiting for another play to join...";
    } else {
      message += data.numUsers + " Players in the room.";
    }
    log(message);
  }

  // Sets the client's username
  function setUsername() {
    console.log($usernameInput);

    username = {
      name: cleanInput($usernameInput.val().trim()),
      emo: "what I clicked",
    };

    // If the username is valid
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off("click");
      $currentInput = $inputMessage.focus();

      // Tell the server your username
      socket.emit("add user", username);
    }
  }

  syllableCheck = function () {
    // stanzaSyllables
    var message = $inputMessage.val();

    var syllablesBeforeSend = stanzaSyllables;

    var syllablesCount = 0;
    let splitMessage = split(message, " ");

    for (let i = 0; i < splitMessage.length; i++) {
      // Getting splitted string
      var syllables = RiTa.syllables(splitMessage[i]);
      syllablesCount += syllables.split("/").length;
    }
    
    $('.syllableCountText').text(syllablesCount +"syllables");

    // Use case: 4 syllables, writing word with a 5th?  – how will it detect?
    if (syllablesCount === syllablesBeforeSend) {
      console.log("stanza " + stanzaLine + "" + stanzaSyllables);

      sendMessage(message);
    } else if (syllablesCount > syllablesBeforeSend) {
        $('.inputMessage').css('background-color', '#FCDEE2');
      // change the bar to red

    } else {
        $('.inputMessage').css('background-color', 'white');

    }
  };

  // Sends a chat message
  // function sendMessage() {
  sendMessage = function (message) {
    // Prevent markup from being injected into the message
    message = cleanInput(message);
    // if there is a non-empty message and a socket connection
    if (message && connected) {
      $inputMessage.val("");
      addChatMessage({
        username: username.name,
        message: message,
      });

      if (message == "–-") {
        // tell server to execute 'new message' and send along one parameter
        socket.emit("new message", message);

      } else {
        // executed after a player sent a message into the chat
        // tell server to end the current players turn
        socket.emit("new message", message);

      }
    }
  };

  // Log a message
  function log(message, options) {
    var $el = $("<li>").addClass("log").text(message);
    addMessageElement($el, options);
  }

  // Adds the visual chat message to the message list
  function addChatMessage(data, options) {
    // Don't fade the message in if there is an 'X was typing'
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    if (data.message === "--") {
      console.log("Client is adding -- to the chat.");
      var $messageBodyDiv = $('<span class="messageBody">').html("<br>");
      var $messageDiv = $('<li class="message"/>')
        .addClass(options.fade ? "typing" : "")
        .append($messageBodyDiv);
      addMessageElement($messageDiv, options);
    }

    var $usernameDiv;
    // console.log(data.username.name +' '+username.name);
    if (data.username.name === undefined) {
      // If the message is from the local user, use 'You' as the username
      $usernameDiv = $('<span class="username"/>')
        .text("You:")
        .css("color", "black");
    } else {
      // If the message is from another user, display their username
      $usernameDiv = $('<span class="username"/>')
        .text(data.username.name + ":")
        .css("color", "black");
    }

    var $messageBodyDiv = $('<span class="messageBody">').text(data.message);

    var typingClass = data.typing ? "typing" : "";
    var $messageDiv = $('<li class="message"/>')
      .data("username", data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Adds the visual chat typing message
  function addChatTyping(data) {
    data.typing = true;
    data.message = "is typing";
    addChatMessage(data);
  }
  // Removes the visual chat typing message
  function removeChatTyping(data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Adds a message element to the messages and scrolls to the bottom
  // el - The element to add as a message
  // options.fade - If the element should fade-in (default = true)
  // options.prepend - If the element should prepend
  //   all other messages (default = false)
  function addMessageElement(el, options) {
    var $el = $(el);

    // Setup default options
    if (!options) {
      options = {};
    }
    if (typeof options.fade === "undefined") {
      options.fade = false;
    }
    if (typeof options.prepend === "undefined") {
      options.prepend = false;
    }

    // Apply options
    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME);
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Prevents input from having injected markup
  function cleanInput(input) {
    return $("<div/>").text(input).text();
  }

  // Updates the typing event
  function updateTyping() {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit("typing");
      }
      lastTypingTime = new Date().getTime();

      setTimeout(function () {
        var typingTimer = new Date().getTime();
        var timeDiff = typingTimer - lastTypingTime;
        if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
          socket.emit("stop typing");
          console.log("stop typing hehehehehe");
          typing = false;
        }
      }, TYPING_TIMER_LENGTH);
    }
  }

  // Gets the 'X is typing' messages of a user
  function getTypingMessages(data) {
    return $(".typing.message").filter(function (i) {
      return $(this).data("username") === data.username;
    });
  }

  // Gets the color of a username through our hash function
  function getUsernameColor(username) {
    // Compute hash code
    var hash = 7;
    for (var i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + (hash << 5) - hash;
    }
    // Calculate color
    var index = Math.abs(hash % COLORS.length);
    return COLORS[index];
  }

  // KEYBOARD EVENTS ##############################################################

  $window.keydown(function (event) {
    // Auto-focus the current input when a key is typed
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    // When the client hits ENTER on their keyboard
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit("stop typing");
        typing = false;
        //
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on("input", function () {
    updateTyping();
  });

  // CLICK EVENTS

  // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });

  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
  });

  // SOCKET EVENTS ###################################################################

  // Whenever the server emits 'login', log the login message

  socket.on("login", function (data) {
    if (data.numUsers <= maxPlayer) {
      connected = true;

      if (data.numUsers == 1) {
        socket.emit("your turn", { username: username.name });
      }

      // Display the welcome message
      var message = "Take turns chatting and be mindful of your syllables!";
      log(message, {
        prepend: true,
      });
    } else {
      // Display message if the room is full
      var message = "Room is currently full";
      socket.emit("reject", {
        message: "The room is full. Please try again later.",
      });
      socket.disconnect(true);
    }

    addParticipantsMessage(data);
  });

  // Whenever the server emits 'new message', update the chat body
  socket.on("new message", function (data) {
    console.log(data);
    addChatMessage(data);
  });

  socket.on("blank message", function (data) {
    console.log("Received blank message on the client:", data);
    addChatMessage(data);
  });

  // Whenever the server emits 'user joined', log it in the chat body
  socket.on("user joined", function (data) {
    log(data.username.name + " joined");
    addParticipantsMessage(data);
  });

  // Whenever the server emits 'user left', log it in the chat body
  socket.on("user left", function (data) {
    log("Other player has left");
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  socket.on("your turn", function (data) {
    console.log("It's your turn, " + data.username);
    inputMessage.elt.disabled = false;
    
      inputMessage.elt.placeholder = "Type " +stanzaSyllables +" syllables...";
    

  });

  socket.on("not your turn", function (data) {
    console.log("It's not your turn, " + data.username);
    inputMessage.elt.disabled = true;

    if (data.waiting) {
      // Handle the case when the player is waiting
      console.log(data.username + ", please wait for your turn.");
      inputMessage.elt.placeholder = "Waiting for another player to join...";
    } else {
      // Handle the case when it's not the player's turn
      console.log(data.username + ", it's not your turn.");
      inputMessage.elt.placeholder = "Waiting for the other user to chat back...";
    }
  });

  // Whenever the server emits 'typing', show the typing message
  socket.on("typing", function (data) {
    // addChatTyping(data);
  });

  // Whenever the server emits 'stop typing', kill the typing message
  socket.on("stop typing", function (data) {
    // removeChatTyping(data);
  });

  // only certain player (either P1 / P2 can trigger an event)
  socket.on("stanzaSyllables", function (data) {
    stanzaSyllables = data.stanzaSyllables;
    console.log("Received stanzaSylables – " + stanzaSyllables);
  });

  socket.on("waiting room", function (data) {
    console.log("Currently waiting...");
  });
  
  setInterval(function(){
  for(let ident in clients){
    if(now - clients[ident].updated > inactivityThreshold){

      // Their last update was more than inactivityThreshold millis ago!
      // This user has probably closed their page; remove them.
      if (clients[ident] != undefined){
        clients[ident].remove();
        delete clients[ident];
      }
    }
  }
}, inactivityThreshold);
}

//================================================
// Don't delete these 'comments'; they are essential hacks to make p5.js work in the Glitch.com editor.
// First: shut Glitch up about p5's global namespace pollution using this magic comment:
/* global describe p5 setup draw P2D WEBGL ARROW CROSS HAND MOVE TEXT WAIT HALF_PI PI QUARTER_PI TAU TWO_PI DEGREES RADIANS DEG_TO_RAD RAD_TO_DEG CORNER CORNERS RADIUS RIGHT LEFT CENTER TOP BOTTOM BASELINE POINTS LINES LINE_STRIP LINE_LOOP TRIANGLES TRIANGLE_FAN TRIANGLE_STRIP QUADS QUAD_STRIP TESS CLOSE OPEN CHORD PIE PROJECT SQUARE ROUND BEVEL MITER RGB HSB HSL AUTO ALT BACKSPACE CONTROL DELETE DOWN_ARROW ENTER ESCAPE LEFT_ARROW OPTION RETURN RIGHT_ARROW SHIFT TAB UP_ARROW BLEND REMOVE ADD DARKEST LIGHTEST DIFFERENCE SUBTRACT EXCLUSION MULTIPLY SCREEN REPLACE OVERLAY HARD_LIGHT SOFT_LIGHT DODGE BURN THRESHOLD GRAY OPAQUE INVERT POSTERIZE DILATE ERODE BLUR NORMAL ITALIC BOLD BOLDITALIC LINEAR QUADRATIC BEZIER CURVE STROKE FILL TEXTURE IMMEDIATE IMAGE NEAREST REPEAT CLAMP MIRROR LANDSCAPE PORTRAIT GRID AXES frameCount deltaTime focused cursor frameRate getFrameRate setFrameRate noCursor displayWidth displayHeight windowWidth windowHeight width height fullscreen pixelDensity displayDensity getURL getURLPath getURLParams pushStyle popStyle popMatrix pushMatrix registerPromisePreload camera perspective ortho frustum createCamera setCamera setAttributes createCanvas resizeCanvas noCanvas createGraphics blendMode noLoop loop push pop redraw applyMatrix resetMatrix rotate rotateX rotateY rotateZ scale shearX shearY translate arc ellipse circle line point quad rect square triangle ellipseMode noSmooth rectMode smooth strokeCap strokeJoin strokeWeight bezier bezierDetail bezierPoint bezierTangent curve curveDetail curveTightness curvePoint curveTangent beginContour beginShape bezierVertex curveVertex endContour endShape quadraticVertex vertex alpha blue brightness color green hue lerpColor lightness red saturation background clear colorMode fill noFill noStroke stroke erase noErase createStringDict createNumberDict storeItem getItem clearStorage removeItem select selectAll removeElements createDiv createP createSpan createImg createA createSlider createButton createCheckbox createSelect createRadio createColorPicker createInput createFileInput createVideo createAudio VIDEO AUDIO createCapture createElement deviceOrientation accelerationX accelerationY accelerationZ pAccelerationX pAccelerationY pAccelerationZ rotationX rotationY rotationZ pRotationX pRotationY pRotationZ pRotateDirectionX pRotateDirectionY pRotateDirectionZ turnAxis setMoveThreshold setShakeThreshold isKeyPressed keyIsPressed key keyCode keyIsDown movedX movedY mouseX mouseY pmouseX pmouseY winMouseX winMouseY pwinMouseX pwinMouseY mouseButton mouseIsPressed requestPointerLock exitPointerLock touches createImage saveCanvas saveGif saveFrames loadImage image tint noTint imageMode pixels blend copy filter get loadPixels set updatePixels loadJSON loadStrings loadTable loadXML loadBytes httpGet httpPost httpDo createWriter save saveJSON saveJSONObject saveJSONArray saveStrings saveTable writeFile downloadFile abs ceil constrain dist exp floor lerp log mag map max min norm pow round sq sqrt fract createVector noise noiseDetail noiseSeed randomSeed random randomGaussian acos asin atan atan2 cos sin tan degrees radians angleMode textAlign textLeading textSize textStyle textWidth textAscent textDescent loadFont text textFont append arrayCopy concat reverse shorten shuffle sort splice subset float int str boolean byte char unchar hex unhex join match matchAll nf nfc nfp nfs split splitTokens trim day hour minute millis month second year plane box sphere cylinder cone ellipsoid torus orbitControl debugMode noDebugMode ambientLight specularColor directionalLight pointLight lights lightFalloff spotLight noLights loadModel model loadShader createShader shader resetShader normalMaterial texture textureMode textureWrap ambientMaterial emissiveMaterial specularMaterial shininess remove canvas drawingContext*/
// Also socket.io:
/* global describe io*/

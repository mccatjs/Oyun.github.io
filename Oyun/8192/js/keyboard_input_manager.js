function KeyboardInputManager() {
    this.events = {};
  
    if (window.navigator.msPointerEnabled) {
      //Internet Explorer 10 style
      this.eventTouchstart    = "MSPointerDown";
      this.eventTouchmove     = "MSPointerMove";
      this.eventTouchend      = "MSPointerUp";
    } else {
      this.eventTouchstart    = "touchstart";
      this.eventTouchmove     = "touchmove";
      this.eventTouchend      = "touchend";
    }
  
    this.listen();
  }
  
  KeyboardInputManager.prototype.on = function (event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  };
  
  KeyboardInputManager.prototype.emit = function (event, data) {
    //console.log(event);
    var callbacks = this.events[event];
    if (callbacks) {
      callbacks.forEach(function (callback) {
        callback(data);
      });
    }
  };
  
  KeyboardInputManager.prototype.listen = function () {
    var self = this;
  
    var map = {
      38: 0, // Up
      39: 1, // Right
      40: 2, // Down
      37: 3, // Left
      75: 0, // Vim up
      76: 1, // Vim right
      74: 2, // Vim down
      72: 3, // Vim left
      87: 0, // W
      68: 1, // D
      83: 2, // S
      65: 3  // A
    };
  
    // Respond to direction keys
    document.addEventListener("keydown", function (event) {
      var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                      event.shiftKey;
      var mapped    = map[event.which];
  
      // Ignore the event if it's happening in a text field
      if (self.targetIsInput(event)) return;
  
      if (!modifiers) {
        if (mapped !== undefined) {
          event.preventDefault();
          self.emit("move", mapped);
        }
      }
  
      // R key restarts the game
      if (!modifiers && event.which === 82) {
        self.restart.call(self, event);
      }
    });
  
    // Respond to button presses
    this.bindButtonPress(".restart-button", this.restart);
    this.bindButtonPress(".begin-button", this.begin);
    this.bindButtonPress(".keep-playing-button", this.keepPlaying);
    this.bindButtonPress(".gamemode-difficulty-easy", this.difficultyEasy);
    this.bindButtonPress(".gamemode-difficulty-medium", this.difficultyMedium);
    this.bindButtonPress(".gamemode-difficulty-hard", this.difficultyHard);
    this.bindButtonPress(".gamemode-size-four", this.sizeFour);
    this.bindButtonPress(".gamemode-size-five", this.sizeFive);
    this.bindButtonPress(".gamemode-size-six", this.sizeSix);
    this.bindButtonPress(".gamemode-add", this.gmAdd);
    this.bindButtonPress(".gamemode-remove", this.gmRemove);
  
  
    // Respond to swipe events
    var touchStartClientX, touchStartClientY;
    var gameContainer = document.getElementsByClassName("game-container")[0];
  
    gameContainer.addEventListener(this.eventTouchstart, function (event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 1) ||
          event.targetTouches > 1 ||
          self.targetIsInput(event)) {
        return; // Ignore if touching with more than 1 finger or touching input
      }
  
      if (window.navigator.msPointerEnabled) {
        touchStartClientX = event.pageX;
        touchStartClientY = event.pageY;
      } else {
        touchStartClientX = event.touches[0].clientX;
        touchStartClientY = event.touches[0].clientY;
      }
  
      event.preventDefault();
    });
  
    gameContainer.addEventListener(this.eventTouchmove, function (event) {
      event.preventDefault();
    });
  
    gameContainer.addEventListener(this.eventTouchend, function (event) {
      if ((!window.navigator.msPointerEnabled && event.touches.length > 0) ||
          event.targetTouches > 0 ||
          self.targetIsInput(event)) {
        return; // Ignore if still touching with one or more fingers or input
      }
  
      var touchEndClientX, touchEndClientY;
  
      if (window.navigator.msPointerEnabled) {
        touchEndClientX = event.pageX;
        touchEndClientY = event.pageY;
      } else {
        touchEndClientX = event.changedTouches[0].clientX;
        touchEndClientY = event.changedTouches[0].clientY;
      }
  
      var dx = touchEndClientX - touchStartClientX;
      var absDx = Math.abs(dx);
  
      var dy = touchEndClientY - touchStartClientY;
      var absDy = Math.abs(dy);
  
      if (Math.max(absDx, absDy) > 10) {
        // (right : left) : (down : up)
        self.emit("move", absDx > absDy ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0));
      }
    });
  };
  
  KeyboardInputManager.prototype.restart = function (event) {
    event.preventDefault();
    this.emit("restart");
  };
  
  KeyboardInputManager.prototype.begin = function (event) {
    event.preventDefault();
    this.emit("begin");
  };
  
  //gamemode related stuff
  KeyboardInputManager.prototype.difficultyEasy = function (event) {
    event.preventDefault();
    this.emit("difficultyEasy");
  };
  KeyboardInputManager.prototype.difficultyMedium = function (event) {
    event.preventDefault();
    this.emit("difficultyMedium");
  };
  KeyboardInputManager.prototype.difficultyHard = function (event) {
    event.preventDefault();
    this.emit("difficultyHard");
  };
  KeyboardInputManager.prototype.sizeFour = function (event) {
    event.preventDefault();
    this.emit("sizeFour");
  };
  KeyboardInputManager.prototype.sizeFive = function (event) {
    event.preventDefault();
    this.emit("sizeFive");
  };
  KeyboardInputManager.prototype.sizeSix = function (event) {
    event.preventDefault();
    this.emit("sizeSix");
  };
  KeyboardInputManager.prototype.gmAdd = function (event) {
    event.preventDefault();
    this.emit("gmAdd");
  };
  KeyboardInputManager.prototype.gmRemove = function (event) {
    event.preventDefault();
    this.emit("gmRemove");
  };
  
  KeyboardInputManager.prototype.keepPlaying = function (event) {
    event.preventDefault();
    this.emit("keepPlaying");
  };
  
  KeyboardInputManager.prototype.bindButtonPress = function (selector, fn) {
    console.log("Binding: " + selector);
    var button = document.querySelector(selector);
    button.addEventListener("click", fn.bind(this));
    button.addEventListener(this.eventTouchend, fn.bind(this));
  };
  
  KeyboardInputManager.prototype.targetIsInput = function (event) {
    return event.target.tagName.toLowerCase() === "input";
  };
  
function GameManager(InputManager, Actuator, StorageManager) {
    this.size           = 5; // Size of the grid
    this.inputManager   = new InputManager;
    this.storageManager = new StorageManager;
    this.actuator       = new Actuator;
  
    this.startTiles     = 2;
    this.spawnChance    = 0.8;
    this.isDebug = true;
  
    // maintain a storage version, if this is 
    // higher than the current cookie storage
    // then the cookie is deleted to allow changes
    // in the storage manager. 
    this.storageVersion = 3; 
  
    this.inputManager.on("move", this.move.bind(this));
    this.inputManager.on("restart", this.restart.bind(this));
    this.inputManager.on("begin", this.beginGame.bind(this));
    this.inputManager.on("keepPlaying", this.keepPlaying.bind(this));
    this.inputManager.on("difficultyEasy", this.gamemodeDifficultyEasy.bind(this));
    this.inputManager.on("difficultyMedium", this.gamemodeDifficultyMedium.bind(this));
    this.inputManager.on("difficultyHard", this.gamemodeDifficultyHard.bind(this));
    this.inputManager.on("sizeFour", this.gamemodeSizeFour.bind(this));
    this.inputManager.on("sizeFive", this.gamemodeSizeFive.bind(this));
    this.inputManager.on("sizeSix", this.gamemodeSizeSix.bind(this));
    this.inputManager.on("gmAdd", this.gamemodeAddToggle.bind(this));
    this.inputManager.on("gmRemove", this.gamemodeRemoveToggle.bind(this));
  
    this.timers = {
      "add": {
        "object": null,
        "currentSeconds": 0
      },
      "remove": {
        "object": null,
        "currentSeconds": 0
      }
    }
  
    this.difficultySettings = {
      "easy":{
        "timerAddMaxSeconds": 9,
        "gamemodeAddAmount": 1,
        "timerRemoveMaxSeconds": 30,
        "startMultiplier": 0.5
      },
      "medium":{
        "timerAddMaxSeconds": 5,
        "gamemodeAddAmount": 1,
        "timerRemoveMaxSeconds": 20,
        "startMultiplier": 1.0
      },
      "hard":{
        "timerAddMaxSeconds": 2,
        "gamemodeAddAmount": 2,
        "timerRemoveMaxSeconds": 10,
        "startMultiplier": 2.0
      }
    };
    this.isMenu = true;
    this.gameModeAddEnabled = false;
    this.gameModeRemoveEnabled = false;
    this.gameModeDifficulty = "medium";
    this.gameModeMultiplier = 1.0;
  
    //perform storage integrity check
    this.verifyStorageController();
  
    //reset the game menu
    this.resetGameMenu();
  
    //setup the game and grid
    this.setup();
  }
  
  
  // Integrity check of the storage controller
  GameManager.prototype.verifyStorageController = function () {
    //if the storage version is invalid clear all game data from the cookie
    if (this.storageManager.getStorageVersion() < this.storageVersion) {
      console.log("New storage manager version, current version wiped");
      this.storageManager.clearBestScore();
      this.storageManager.clearGameState();
      this.storageManager.setStorageVersion(this.storageVersion);
    }
  };
  
  
  // Restart the game
  GameManager.prototype.restart = function () {
    console.log("Restart Game");
    this.resetGameMenu();
    this.isMenu = true;
    this.setup();
    this.clearTimers();
  };
  
  GameManager.prototype.beginGame = function () {
    this.isMenu = false;
    this.storageManager.clearGameState();
    this.actuator.continueGame(); // Clear the game won/lost message
    this.setup();  
  };
  
  
  
  // Keep playing after winning (allows going over 2048)
  GameManager.prototype.keepPlaying = function () {
    this.keepPlaying = true;
    this.actuator.continueGame(); // Clear the game won/lost message
  };
  
  // Return true if the game is lost, or has won and the user hasn't kept playing
  GameManager.prototype.isGameTerminated = function () {
    if (this.over || (this.won && !this.keepPlaying)) {
      return true;
    } else {
      return false;
    }
  };
  
  // Display the menu
  GameManager.prototype.displayMenu = function () {
    this.isMenu = true;
    this.clearTimers();
  };
  
  
  
  // Set up the game
  GameManager.prototype.setup = function () {
    
    var previousState = this.storageManager.getGameState();
  
    this.actuator.setupActuator(this.size, this.gameModeDifficulty);
    //this.storageManager.clearBestScore();
    // Reload the game from a previous game if present
    if (previousState) {
      this.actuator.setupGameGrid(previousState.grid.size);
      this.grid        = new Grid(previousState.grid.size,
                                  previousState.grid.cells); // Reload grid
      this.score       = previousState.score;
      this.over        = previousState.over;
      this.won         = previousState.won;
      this.keepPlaying = previousState.keepPlaying;
    } else if (this.isMenu) {
      this.grid        = new Grid(this.size);
      this.score       = 0;
      this.over        = false;
      this.won         = false;
      this.keepPlaying = false;
      this.timers["add"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerAddMaxSeconds"];
      this.timers["remove"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerRemoveMaxSeconds"];
      this.actuator.setupGameGrid(this.size);
    } else {
      this.grid        = new Grid(this.size);
      this.score       = 0;
      this.over        = false;
      this.won         = false;
      this.keepPlaying = false;
      this.timers["add"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerAddMaxSeconds"];
      this.timers["remove"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerRemoveMaxSeconds"];
      this.actuator.updateAddTimer(this.timers["add"]["currentSeconds"]);
      this.actuator.updateRemoveTimer(this.timers["remove"]["currentSeconds"]);
      this.actuator.setupGameGrid(this.size);
      //change the title
      this.actuator.updateGameHeaderDifficulty(this.gameModeDifficulty);
      this.actuator.updateGameHeaderSize(this.size);
      this.actuator.updateGameHeaderAdd(this.gameModeAddEnabled);
      this.actuator.updateGameHeaderRemove(this.gameModeRemoveEnabled);
  
      // Add the initial tiles
      this.addStartTiles();
    }
    //start the timer
    if (!this.isMenu) {
      if (this.gameModeAddEnabled === true) {
  
        this.timers["add"]["object"] = window.setInterval(this.addTimer.bind( this ), 1000 );
      }
      if (this.gameModeRemoveEnabled === true) {
        this.timers["remove"]["object"] = window.setInterval(this.removeTimer.bind( this ), 1000 );
      }
    }
  
    //setup multiplier
    this.recalculateMultiplier();
    // Update the actuator
    this.actuate();
  };
  
  GameManager.prototype.resetGameMenu = function () {
    this.clearTimers();
    this.gameModeDifficulty = "medium";
    this.size = 5;
    this.gameModeAddEnabled = false;
    this.gameModeRemoveEnabled = false;
    this.actuator.deactivateButton(".gamemode-difficulty-easy");
    this.actuator.activateButton(".gamemode-difficulty-medium");
    this.actuator.deactivateButton(".gamemode-difficulty-hard");
    this.actuator.deactivateButton(".gamemode-size-four");
    this.actuator.activateButton(".gamemode-size-five");
    this.actuator.deactivateButton(".gamemode-size-six");
    this.actuator.deactivateButton(".gamemode-add");
    this.actuator.deactivateButton(".gamemode-remove");
  }
  
  // Set up the initial tiles to start the game with
  GameManager.prototype.addStartTiles = function () {
    for (var i = 0; i < this.startTiles; i++) {
      this.addRandomTile();
    }
  };
  
  GameManager.prototype.addTimer = function() {
    if (this.over == true) {
      this.timers["add"]["currentSeconds"] = 0;
      this.clearTimers();
    } else {
      this.timers["add"]["currentSeconds"] = this.timers["add"]["currentSeconds"] - 1; 
      if (this.timers["add"]["currentSeconds"] < 0) {
         this.timers["add"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerAddMaxSeconds"];
         for (var i =0; i <= this.difficultySettings[this.gameModeDifficulty]["gamemodeAddAmount"] - 1; i++) {
  
           if (this.grid.cellsAvailable()) {
            
            var tile = new Tile(this.grid.randomAvailableCell(), "X");
  
            this.grid.insertTile(tile);
            this.actuator.addTile(tile);
            this.storageManager.setGameState(this.serialize());
            if (!this.movesAvailable()) {
              console.log("Game Over");
              this.over = true; // Game over!
              this.actuate(this.grid, this);
              this.clearTimers();
            }
  
           }
          }
      }
      
    }
    //Do code for showing the number of seconds here
    this.actuator.updateAddTimer(this.timers["add"]["currentSeconds"]);
  };
  
  GameManager.prototype.removeTimer = function() {
    if (this.over == true) {
      this.timers["remove"]["currentSeconds"] = 0;
      this.clearTimers();
    } else {
      this.timers["remove"]["currentSeconds"] = this.timers["remove"]["currentSeconds"] - 1; 
      if (this.timers["remove"]["currentSeconds"] < 0) {
         this.timers["remove"]["currentSeconds"] = this.difficultySettings[this.gameModeDifficulty]["timerRemoveMaxSeconds"];
         console.log("Removed a tile");
         //remove a tile!
         var selectedCells = this.grid.selectedCells();
         console.log(selectedCells);
         if (selectedCells.length) {
            //remove the tile(s) from grid
            for (var i = 0; i < selectedCells.length; i++) {
              var t = this.grid.cellContent({ x: selectedCells[i].x, y: selectedCells[i].y });
              console.log("Removed Tile: " + selectedCells[i].x + "," + selectedCells[i].y);
              console.log("Removed Tile Entity: " + t.x + "," + t.y);
              this.grid.removeTile(t);
              this.actuator.removeTile(t);
              this.score -= Math.round(t.value * this.gameModeMultiplier);
            };
            this.storageManager.setGameState(this.serialize());
            if (this.grid.usedCells().length === 0 || this.score <= 0) {
              console.log("Game Over");
              this.over = true; // Game over!
              this.actuate(this.grid, this);
              this.clearTimers();
            }
         }
        } else if (this.timers["remove"]["currentSeconds"] === this.difficultySettings[this.gameModeDifficulty]["timerRemoveMaxSeconds"] - 1) {
           //select a new tile to remove
          if (this.grid.usedCells().length > 0) {
            var cell = this.grid.randomUsedCell();
            this.grid.cells[cell.x][cell.y].selected = true;
            var selector = document.querySelector(".tile-" + this.size + "-position-" + (cell.x + 1) + "-" + (cell.y + 1));
            if (selector) {
              selector.classList.add("tile-remove");
            } 
          }
      }
      
    }
    //Do code for showing the number of seconds here
    this.actuator.updateRemoveTimer(this.timers["remove"]["currentSeconds"]);
    this.actuator.removeScore(this.score);
  };
  
  // Adds a tile in a random position
  GameManager.prototype.addRandomTile = function () {
    //only spawn a new tile at certain times
    
      if (this.grid.cellsAvailable()) {
        var value = Math.random() < 0.9 ? 2 : 4;
        var tile = new Tile(this.grid.randomAvailableCell(), value);
  
        this.grid.insertTile(tile);
      }
      return tile;
  
  };
  
  // Sends the updated grid to the actuator
  GameManager.prototype.actuate = function () {
    if (this.storageManager.getBestScore(this.size, this.gameModeDifficulty) < this.score) {
      this.storageManager.setBestScore(this.score, this.size, this.gameModeDifficulty);
    }
  
    // Clear the state when the game is over (game over only, not win)
    if (this.over) {
      this.storageManager.clearGameState();
      this.ismenu = true;
    } else {
      this.storageManager.setGameState(this.serialize());
      this.ismenu = false;
    }
  
    this.actuator.actuate(this.grid, {
      score:      this.score,
      over:       this.over,
      won:        this.won,
      bestScore:  this.storageManager.getBestScore(this.size, this.gameModeDifficulty),
      terminated: this.isGameTerminated(),
      isMenu:     this.isMenu,
      difficulty: this.gameModeDifficulty,
      size:       this.size,
      multiplier: this.gameModeMultiplier   
    });
  
  };
  
  
  //get percentage of cells in use
  GameManager.prototype.getPercentageGridFilled = function() {
    var tilesInUse = 0;
    var tilesTotal = this.size * this.size;
    this.grid.cells.forEach(function (column) {
      column.forEach(function (cell) {
        if (cell) {
          tilesInUse += 1;
        }
      });
    });
  
    if (tilesInUse > 0) {
      return tilesInUse / tilesTotal;
    } else {
      return 0;
    }
  }
  
  //recalculate multiplier
  GameManager.prototype.recalculateMultiplier = function() {
    var multiplier  = 0;
    var baseM       = this.difficultySettings[this.gameModeDifficulty]["startMultiplier"];
  
    //get percentage fill based multiplier
    var pcM = 1 - 2*(this.getPercentageGridFilled());
  
    if (this.gameModeAddEnabled) {
      multiplier += 1;
    }
    if (this.gameModeRemoveEnabled) {
      multiplier += 1;
    }
  
    if (this.size === 4) {
      multiplier += 1;
    } else if (this.size === 5) {
      multiplier += 0.5;
    }
  
    //console.log("m=" + multiplier + ", pcM=" + pcM + ", baseM=" + baseM);
    //set the multiplier
    var multiplyerFinal = multiplier + baseM + pcM;
    if (multiplyerFinal > 0.1) {
      this.gameModeMultiplier = this.actuator.toFixed(multiplyerFinal, 1);
    } else {
      this.gameModeMultiplier = 0.1;
    }
    
  }
  
  // Represent the current game as an object
  GameManager.prototype.serialize = function () {
    return {
      grid:        this.grid.serialize(),
      score:       this.score,
      over:        this.over,
      won:         this.won,
      keepPlaying: this.keepPlaying
    };
  };
  
  // Save all tile positions and remove merger info
  GameManager.prototype.prepareTiles = function () {
    this.grid.eachCell(function (x, y, tile) {
      if (tile) {
        tile.mergedFrom = null;
        tile.savePosition();
      }
    });
  };
  
  // Move a tile and its representation
  GameManager.prototype.moveTile = function (tile, cell) {
    this.grid.cells[tile.x][tile.y] = null;
    this.grid.cells[cell.x][cell.y] = tile;
    tile.updatePosition(cell);
  };
  
  GameManager.prototype.clearTimers = function () {
    if (this.gameModeAddEnabled === true) {
      clearInterval(this.timers["add"]["object"]);
    }
    if (this.gameModeRemoveEnabled === true) {
      clearInterval(this.timers["remove"]["object"]);
    }
  };
  
  
  // Move tiles on the grid in the specified direction
  GameManager.prototype.move = function (direction) {
    // 0: up, 1: right, 2: down, 3: left
    var self = this;
  
    if (this.isGameTerminated()) return; // Don't do anything if the game's over
  
    var cell, tile;
  
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
  
    // Save the current tile positions and remove merger information
    this.prepareTiles();
  
    // Traverse the grid in the right direction and move tiles
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
  
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
  
          // Only one merger per row traversal?
          if (next && next.value === tile.value && !next.mergedFrom) {
            var position = positions.next;
            var merged = new Tile(position, tile.value * 2);
            merged.mergedFrom = [tile, next];
            merged.updateSelected(false);
  
            self.grid.insertTile(merged, false);
            self.grid.removeTile(tile);
  
            // Converge the two tiles' positions
            tile.updatePosition(positions.next);
  
            // Update the score
            self.score += Math.round(merged.value * self.gameModeMultiplier);
            // The mighty 8192 tile
            if (merged.value === 8192) {
              self.won = true;
            }
          } else {
            self.moveTile(tile, positions.farthest);
          }
  
          if (!self.positionsEqual(cell, tile)) {
            moved = true; // The tile moved from its original cell!
          }
        }
      });
    });
  
    if (moved) {
      //recalculate multiplier
      this.recalculateMultiplier();
  
      if (Math.random() < this.spawnChance) {
        this.addRandomTile();
      }
      if (!this.movesAvailable()) {
        this.over = true; // Game over!
      }
  
      this.actuate();
    }
  };
  
  // Get the vector representing the chosen direction
  GameManager.prototype.getVector = function (direction) {
    // Vectors representing tile movement
    var map = {
      0: { x: 0,  y: -1 }, // Up
      1: { x: 1,  y: 0 },  // Right
      2: { x: 0,  y: 1 },  // Down
      3: { x: -1, y: 0 }   // Left
    };
  
    return map[direction];
  };
  
  // Build a list of positions to traverse in the right order
  GameManager.prototype.buildTraversals = function (vector) {
    var traversals = { x: [], y: [] };
  
    for (var pos = 0; pos < this.size; pos++) {
      traversals.x.push(pos);
      traversals.y.push(pos);
    }
  
    // Always traverse from the farthest cell in the chosen direction
    if (vector.x === 1) traversals.x = traversals.x.reverse();
    if (vector.y === 1) traversals.y = traversals.y.reverse();
  
    return traversals;
  };
  
  GameManager.prototype.findFarthestPosition = function (cell, vector) {
    var previous;
  
    // Progress towards the vector direction until an obstacle is found
    do {
      previous = cell;
      cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
    } while (this.grid.withinBounds(cell) &&
             this.grid.cellAvailable(cell));
  
    return {
      farthest: previous,
      next: cell // Used to check if a merge is required
    };
  };
  
  GameManager.prototype.movesAvailable = function () {
    return this.grid.cellsAvailable() || this.tileMatchesAvailable();
  };
  
  // Check for available matches between tiles (more expensive check)
  GameManager.prototype.tileMatchesAvailable = function () {
    var self = this;
  
    var tile;
  
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
  
        if (tile) {
  
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
  
            var other  = self.grid.cellContent(cell);
  
            if (other && other.value === tile.value && (other.value !== "X" || tile.value !== "X")) {
              return true; // These two tiles can be merged
            }
          }
        }
      }
    }
  
    return false;
  };
  
  //check if positions are equal
  GameManager.prototype.positionsEqual = function (first, second) {
    return first.x === second.x && first.y === second.y;
  };
  
  
  //Game Mode Stuff
  
  // Restart the game
  GameManager.prototype.gamemodeDifficultyEasy = function () {
    this.gameModeDifficulty = "easy";
    this.actuator.activateButton(".gamemode-difficulty-easy");
    this.actuator.deactivateButton(".gamemode-difficulty-medium");
    this.actuator.deactivateButton(".gamemode-difficulty-hard");
  
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeDifficultyEasy");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeDifficultyMedium = function () {
    this.gameModeDifficulty = "medium";
    this.actuator.deactivateButton(".gamemode-difficulty-easy");
    this.actuator.activateButton(".gamemode-difficulty-medium");
    this.actuator.deactivateButton(".gamemode-difficulty-hard");
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeDifficultyMedium");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeDifficultyHard = function () {
    this.gameModeDifficulty = "hard";
    this.actuator.deactivateButton(".gamemode-difficulty-easy");
    this.actuator.deactivateButton(".gamemode-difficulty-medium");
    this.actuator.activateButton(".gamemode-difficulty-hard");
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeDifficultyHard");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeSizeFour = function () {
    this.size = 4;
    this.actuator.activateButton(".gamemode-size-four");
    this.actuator.deactivateButton(".gamemode-size-five");
    this.actuator.deactivateButton(".gamemode-size-six");
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeSizeFour");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeSizeFive = function () {
    this.size = 5;
    this.actuator.deactivateButton(".gamemode-size-four");
    this.actuator.activateButton(".gamemode-size-five");
    this.actuator.deactivateButton(".gamemode-size-six");
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeSizeFive");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeSizeSix = function () {
    this.size = 6;
    this.actuator.deactivateButton(".gamemode-size-four");
    this.actuator.deactivateButton(".gamemode-size-five");
    this.actuator.activateButton(".gamemode-size-six");
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeSizeSix");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeAddToggle = function () {
    if (this.gameModeAddEnabled === true) {
      this.gameModeAddEnabled = false;
      this.actuator.deactivateButton(".gamemode-add");
    } else {
      this.gameModeAddEnabled = true;
      this.actuator.activateButton(".gamemode-add");
    }
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeAddToggle");
    }
  };
  // Restart the game
  GameManager.prototype.gamemodeRemoveToggle = function () {
    if (this.gameModeRemoveEnabled === true) {
      this.gameModeRemoveEnabled = false;
      this.actuator.deactivateButton(".gamemode-remove");
    } else {
      this.gameModeRemoveEnabled = true;
      this.actuator.activateButton(".gamemode-remove");
    }
    if (this.isDebug === true) {
      console.log("Button Press: gamemodeRemoveToggle");
    }
  };
  
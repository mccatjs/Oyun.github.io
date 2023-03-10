window.fakeStorage = {
    _data: {},
  
    setItem: function (id, val) {
      return this._data[id] = String(val);
    },
  
    getItem: function (id) {
      return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
    },
  
    removeItem: function (id) {
      return delete this._data[id];
    },
  
    clear: function () {
      return this._data = {};
    }
  };
  
  function LocalStorageManager() {
    this.bestScoreKey       = "bestScore";
    this.gameStateKey       = "gameState";
    this.storageVersionKey  = "storageVersion";
  
    var supported = this.localStorageSupported();
    this.storage = supported ? window.localStorage : window.fakeStorage;
  }
  
  LocalStorageManager.prototype.localStorageSupported = function () {
    var testKey = "test";
    var storage = window.localStorage;
  
    try {
      storage.setItem(testKey, "1");
      storage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Best score getters/setters
  LocalStorageManager.prototype.getBestScore = function (type, difficulty) {
    var scoresData  = this.getBestScoreArray();
    
    try {
      var scoresObj   = JSON.parse(scoresData);
      var size        = type + "x" + type;
      if (scoresObj.constructor == Object) {
        return scoresObj[size][difficulty] || 0;
      } else {
        this.clearBestScore();
        return 0;
      }
      
    } catch (error) {
      console.log(error);
      return 0;
    }
  
  };
  
  LocalStorageManager.prototype.getBestScoreArray = function () {
    return this.storage.getItem(this.bestScoreKey) || 0;
  };
  
  LocalStorageManager.prototype.isArray = function(what) {
      return Object.prototype.toString.call(what) === '[object Array]';
  }
  
  LocalStorageManager.prototype.clearBestScore = function () {
    this.storage.removeItem(this.bestScoreKey);
  };
  
  LocalStorageManager.prototype.setBestScore = function (score, type, difficulty) {
    var currentScores   = this.getBestScoreArray();
    var scoresObj       = null;
    var size            = type + "x" + type; 
    //console.log(currentScores);
    if (currentScores !== 0) {
        scoresObj = JSON.parse(currentScores);
        scoresObj[size][difficulty] = score; //TO FIX!
    } else {
      scoresObj = {
        "4x4" : {
          "easy": 0, 
          "medium": 0, 
          "hard": 0
        },
        "5x5" : {
          "easy": 0, 
          "medium": 0, 
          "hard": 0
        },
        "6x6" : {
          "easy": 0, 
          "medium": 0, 
          "hard": 0
      }};
      scoresObj[size][difficulty] = score;
    }
    this.storage.setItem(this.bestScoreKey, JSON.stringify(scoresObj));
  };
  
  // Game state getters/setters and clearing
  LocalStorageManager.prototype.getGameState = function () {
    var stateJSON = this.storage.getItem(this.gameStateKey);
    return stateJSON ? JSON.parse(stateJSON) : null;
  };
  
  LocalStorageManager.prototype.setGameState = function (gameState) {
    this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
  };
  
  LocalStorageManager.prototype.getStorageVersion = function () {
    return this.storage.getItem(this.storageVersionKey) || 0;
  };
  
  LocalStorageManager.prototype.setStorageVersion = function (version) {
    this.storage.setItem(this.storageVersionKey, version);
  };
  
  LocalStorageManager.prototype.clearGameState = function () {
    this.storage.removeItem(this.gameStateKey);
  };
  
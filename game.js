'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (vector instanceof Vector) {
      return new Vector(vector.x + this.x, vector.y + this.y);
    } else {
      throw (Error('Переданный параметр не является вектором'));
    }
  }

  times(multiplier) {
    return new Vector(multiplier * this.x, multiplier * this.y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (pos instanceof Vector && size instanceof Vector && speed instanceof Vector) {
      this.pos = pos;
      this.size = size;
      this.speed = speed;
    } else {
      throw (Error('Переданный параметр не является объектом типа Vector'));
    }
  }

  act() {}

  get left() {
    return this.pos.x;
  }

  get top() {
    return this.pos.y;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  get type() {
    return 'actor';
  }

  isIntersect(actor) {
    if (actor instanceof Actor) {
      if (actor !== this && actor.left < this.right && actor.right > this.left && actor.bottom > this.top && actor.top < this.bottom) {
        return true;
      } else {
        return false;
      }
    } else {
      throw (Error('Переданный параметр не является объектом типа Actor'));
    }
  }
}

class Level {
  constructor(grid, actors) {
    if (grid === undefined) {
      this.grid = [];
      this.height = 0;
      this.width = 0;
    } else {
      let maxLength = 0;
      grid.forEach((row) => maxLength = (row.length > maxLength) ? row.length : maxLength);

      this.grid = grid;
      this.height = grid.length;
      this.width = maxLength;
    }

    if (actors === undefined) {
      this.actors = [];
      this.player = undefined;
    } else {
      this.actors = actors;
      this.player = actors.find((a) => a.type === 'player');
    }

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    if (this.status !== null && this.finishDelay <0) {
      return true;
    } else {
      return false;
    }
  }

  actorAt(actor) {
    if (actor instanceof Actor) {
      return this.actors.find((a) => a.isIntersect(actor));  
    } else {
      throw (Error('Переданный параметр не является объектом типа Actor'));
    }
  }

  obstacleAt(pos, size) {
    if (pos instanceof Vector && size instanceof Vector) {
      if (pos.y < 0 || pos.x < 0 || (pos.x + size.x) > this.width) {
        return 'wall';
      } else if ((pos.y + size.y) > this.height) {
        return 'lava';
      } else {
        if ((pos.y + size.y) > Math.floor(pos.y + size.y)) {
          for (let i = Math.floor(pos.x); i < Math.ceil(pos.x + size.x); i++) {
            if (this.grid[Math.floor(pos.y + size.y)][i] !== undefined) {
              return this.grid[Math.floor(pos.y + size.y)][i];
            }
          }
        }

        if ((pos.y) < Math.ceil(pos.y)) {
          for (let i = Math.floor(pos.x); i < Math.ceil(pos.x + size.x); i++) {
            if (this.grid[Math.floor(pos.y)][i] !== undefined) {
              return this.grid[Math.floor(pos.y)][i];
            }
          }
        }

        if ((pos.x + size.x) > Math.floor(pos.x + size.x)) {
          for (let i = Math.floor(pos.y); i < Math.ceil(pos.y + size.y); i++) {
            if (this.grid[i][Math.floor(pos.x + size.x)] !== undefined) {
              return this.grid[i][Math.floor(pos.x + size.x)];
            }
          }
        }

        if ((pos.y) < Math.ceil(pos.y)) {
          for (let i = Math.floor(pos.y); i < Math.ceil(pos.y + size.y); i++) {
            if (this.grid[i][Math.floor(pos.x)] !== undefined) {
              return this.grid[i][Math.floor(pos.x)];
            }
          }
        }
        return this.grid[Math.floor(pos.y)][Math.floor(pos.x)];
      }
    } else {
      throw (Error('Переданный параметр не является объектом типа Vector'));
    }
  }

  removeActor(actor) {
    if (this.actors.indexOf(actor) !== -1) {
      this.actors.splice(this.actors.indexOf(actor),1);
    } 
  }

  noMoreActors(type) {
    if (this.actors.findIndex((a) => a.type === type) !== -1) {
      return false;
    } else {
      return true;
    }
  }

  playerTouched(type, actor) {
    if (this.status === null) {
      if (type === 'lava' || type === 'fireball') {
        this.status = 'lost';
      } else if (type === 'coin') {
        this.removeActor(actor);
        if (this.noMoreActors('coin')) {
          this.status = 'won';
        }
      }
    }
  }
}

class LevelParser {
  constructor(actorDict = {}) {
    this.actorDict = actorDict;
  }

  actorFromSymbol(str) {
    return(this.actorDict[str]);
  }

  obstacleFromSymbol(str) {
    switch (str) {
      case 'x' :
        return 'wall';
        break;

      case '!' :
        return 'lava';
        break;

      default :
        return undefined;
    }
  }

  createGrid(arr) {
    let grid = [];

    for (let str of arr) {
      grid.push((str.split('').map((a) => this.obstacleFromSymbol(a))));
    }

    return grid;
  }

  createActors(arr) {
    let actors = [];

    for (let y = 0; y < arr.length; y++) {
      let row = arr[y].split('');

      for (let x = 0; x < row.length; x++) {
        let currentObj = this.actorFromSymbol(row[x]);

        if (currentObj !== undefined) {
          if (Actor.prototype.isPrototypeOf(currentObj.prototype) || currentObj === Actor) {
            actors.push(new currentObj(new Vector(x, y)));
          }
        }
      }
    }

    return actors;
  }

  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}

class Fireball extends Actor {
  constructor(pos = new Vector(0, 0), speed = new Vector(0, 0)) {
    super();
    this.pos = pos;
    this.speed = speed;
    this.size = new Vector(1, 1);
  }

  get type() {
    return 'fireball';
  }

  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }

  handleObstacle() {
    this.speed = this.speed.times(-1);
  }

  act(time, level) {
    let newPos = this.getNextPosition(time);

    if (level.obstacleAt(newPos, this.size) === undefined) {
      this.pos = newPos;
    } else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super();
    this.pos = pos;
    this.speed = new Vector(2, 0);
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super();
    this.pos = pos;
    this.speed = new Vector(0, 2);
  }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super();
    this.pos = pos;
    this.startX = pos.x;
    this.startY = pos.y;
    this.speed = new Vector(0, 3);
  }

  handleObstacle() {
    this.pos = new Vector(this.startX, this.startY);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super();
    this.pos = pos.plus(new Vector(0, -0.5));
    this.size = new Vector(0.8, 1.5);
  }

  get type() {
    return 'player';
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super();
    this.pos = pos.plus(new Vector(0.2, 0.1));
    this.size = new Vector(0.6, 0.6);
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.PI * Math.random() * 2;
    this.startPos = pos.plus(new Vector(0.2, 0.1));
  }

  get type() {
    return 'coin';
  }

  updateSpring(time = 1) {
    this.spring += time * this.springSpeed;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time) {
    this.updateSpring(time);
    return this.startPos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

loadLevels()
    .then(function(schemas) {
      const actorDict = {
        '@': Player,
        'o': Coin,
        '=': HorizontalFireball,
        '|': VerticalFireball,
        'v': FireRain
      };

      const parser = new LevelParser(actorDict);

      runGame(JSON.parse(schemas), parser, DOMDisplay)
          .then(() => alert('Поздравляем, вы победили, теперь идите и займитесь чем-нибудь полезным!'));
    });





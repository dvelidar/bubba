'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw (Error('Переданный параметр не является вектором'));
    }

    return new Vector(vector.x + this.x, vector.y + this.y);
  }

  times(multiplier) {
    return new Vector(multiplier * this.x, multiplier * this.y);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector && size instanceof Vector && speed instanceof Vector)) {
      throw (Error('Переданный параметр не является объектом типа Vector'));
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
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
    if (!(actor instanceof Actor)) {
      throw (Error('Переданный параметр не является объектом типа Actor'));
    }

    return (actor !== this && actor.left < this.right && actor.right > this.left && actor.bottom > this.top && actor.top < this.bottom);
  }
}

class Level {
  constructor(grid = [], actors = []) {
    let maxLength = 0;
    grid.forEach((row) => maxLength = (row.length > maxLength) ? row.length : maxLength);

    this.grid = grid;
    this.height = grid.length;
    this.width = maxLength;
    this.actors = actors;
    this.player = actors.find((a) => a.type === 'player');

    this.status = null;
    this.finishDelay = 1;
  }

  isFinished() {
    return (this.status !== null && this.finishDelay <0);
  }

  actorAt(actor) {
    if (!(actor instanceof Actor)) {
      throw (Error('Переданный параметр не является объектом типа Actor'));
    }

    return this.actors.find((a) => a.isIntersect(actor));
  }

  obstacleAt(pos, size) {
    if (!(pos instanceof Vector && size instanceof Vector)) {
      throw (Error('Переданный параметр не является объектом типа Vector'));
    }

    if (pos.y < 0 || pos.x < 0 || (pos.x + size.x) > this.width) {
      return 'wall';
    } else if ((pos.y + size.y) > this.height) {
      return 'lava';
    } else {
      for (let i = Math.floor(pos.y); i < Math.ceil(pos.y + size.y); i++) {
        for (let j = Math.floor(pos.x); j < Math.ceil(pos.x + size.x); j++) {
          if (this.grid[i][j] !== undefined) {
            return this.grid[i][j];
          }
        }
      }
    }
  }

  removeActor(actor) {
    let actorPos = this.actors.indexOf(actor);
    if (actorPos !== -1) {
      this.actors.splice(actorPos, 1);
    } 
  }

  noMoreActors(type) {
    return (this.actors.findIndex((a) => a.type === type) === -1);
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
    super(pos, new Vector(1, 1), speed);
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
    super(pos, new Vector(2, 0));
  }
}

class VerticalFireball extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos = new Vector(0, 0)) {
    super(pos, new Vector(0, 3));
    this.startX = pos.x;
    this.startY = pos.y;
  }

  handleObstacle() {
    this.pos = new Vector(this.startX, this.startY);
  }
}

class Player extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0, -0.5)), new Vector(0.8, 1.5));
  }

  get type() {
    return 'player';
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    super(pos.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
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





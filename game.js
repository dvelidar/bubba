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
      throw ('Переданный параметр не является вектором');
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
      throw ('Переданный параметр не является объектом типа Vector');
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
      throw ('Переданный параметр не является объектом типа Actor');
    }
  }
}

class Level {
  constructor(grid, actors) {
    let maxLength = 0;
    grid.forEach((row) => maxLength = (row.length > maxLength) ? row.length : maxLength);

    this.grid = grid;
    this.actors = actors;
    this.player = actors.find((a) => a.type === 'player');
    this.height = grid.length;
    this.width = maxLength;
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
      throw ('Переданный параметр не является объектом типа Actor');
    }
  }

  obstacleAt(pos, size) {
    if (pos instanceof Vector && size instanceof Vector) {
      if (this.grid[pos.y] < 0 || this.grid[pos.x] < 0 || this.grid[pos.x + size.x] > this.width) {
        return 'wall';
      } else if (this.grid[pos.y + size.y] > this.height) {
        return 'lava';
      } else {
        return this.grid[pos.y][pos.x];
      }
    } else {
      throw ('Переданный параметр не является объектом типа Vector');
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
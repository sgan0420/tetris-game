import { assert, describe, expect, it } from "vitest";
import { main } from "../src/main";
import { dropTetromino, hardDrop, isCollision, isOutOfBounds, resetPosition, rotateTetromino } from "../src/state";
import { INITIAL_LEVEL, INITIAL_SEED, RNG, getRandomTetromino } from "../src/util";
import { Constants } from "../src/types";

const sampleState = {
  gameEnd: false,
  gamePause: false,
  gameRestart: false,
  grid: Array.from({ length: (Constants.GRID_HEIGHT) }, () => Array(Constants.GRID_WIDTH).fill(0)),
  currentTetromino: getRandomTetromino(0.01),
  nextTetromino: getRandomTetromino(RNG.scale(RNG.hash(0.01 * 314159))),
  holdTetromino: undefined,
  level: INITIAL_LEVEL,
  score: 0,
  highScore: 0,
}

describe("main", () => {
  it("is defined", () => {
    assert.isDefined(main);
  });
  it("is a function", () => {
    assert.isFunction(main);
  });
});

describe('isCollision function', () => {
  it('should return true if there is a collision', () => {
    const x = 0;
    const y = 0;
    const shape = [[1, 1], [1, 1]];
    const grid = [[0, 0, 0], [0, 1, 0], [0, 0, 0]];

    expect(isCollision(x, y, shape, grid)).toBe(true);
  });

  it('should return false if there is no collision', () => {
    const x = 1;
    const y = 1;
    const shape = [[1, 1], [1, 1]];
    const grid = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

    expect(isCollision(x, y, shape, grid)).toBe(false);
  });
});

describe('isOutOfBounds function', () => {
  it('should return true if the tetromino is out of bounds', () => {
    const x = 10;
    const y = 0;
    const shape = [[1, 1], [1, 1]];

    expect(isOutOfBounds(x, y, shape)).toBe(true);
  });

  it('should return false if the tetromino is within bounds', () => {
    const x = 1;
    const y = 1;
    const shape = [[1, 1], [1, 1]];

    expect(isOutOfBounds(x, y, shape)).toBe(false);
  });
});

describe('hardDrop function', () => {
  it('should perform a hard drop and update the game state', () => {
    const initialState = sampleState;
    const nextState = hardDrop(initialState, 0.01);

    expect(nextState.currentTetromino.y).toBeLessThanOrEqual(0);
    expect(nextState.grid).not.toEqual(initialState.grid);
  });
});

describe('resetPosition function', () => {
  it('should reset the tetromino position and orientation', () => {
    const tetromino = sampleState.currentTetromino;
    const rotatedState = rotateTetromino(sampleState);
    const resetTetromino = resetPosition(rotatedState.currentTetromino);

    expect(resetTetromino).toEqual({
      colour: tetromino.colour,
      key: tetromino.key,
      x: tetromino.x, 
      y: tetromino.y,
      orientation: 0,
      shape: tetromino.shape,
    });
  });
});

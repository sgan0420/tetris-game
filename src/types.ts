/**
 * Represents valid key inputs for the game.
 */
export type Key = "ArrowDown" | "ArrowLeft" | "ArrowRight" | "ArrowUp" | "Space" | "KeyC";

/**
 * Represents possible input types for the game system.
 */
export type Input = number | KeyboardEvent | MouseEvent | [number, KeyboardEvent];

/**
 * Represents a two-dimensional matrix of values of type T.
 */
export type Matrix<T> = ReadonlyArray<ReadonlyArray<T>>;

/**
 * Represents the game state with various properties.
 */
export type State = Readonly<{
  gameEnd: boolean;
  gamePause: boolean;
  gameRestart: boolean;
  grid: Matrix<number>;
  currentTetromino: Tetromino;
  nextTetromino: Tetromino;
  holdTetromino: Tetromino | undefined;
  level: number;
  score: number;
  highScore: number;
}>;

/**
 * Represents a tetromino block with its properties.
 */
export type Tetromino = Readonly<{
  key: string;
  orientation: number;
  shape: Matrix<number>;
  colour: string;
  x: number;
  y: number;
}>;

/**
 * Constants related to the game canvas dimensions.
 */
export const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
  HOLD_WIDTH: 160,
  HOLD_HEIGHT: 80,
} as const;

/**
 * Game constants, tick rate and grid dimensions.
 */
export const Constants = {
  TICK_RATE_MS: 500,
  MINIMUM_TICKRATE: 25,
  TICKRATE_INCREMENT: 50,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

/**
 * Defines the size of a single block based on the canvas and grid dimensions.
 */
export const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
} as const;

/**
 * Defines the shapes of different tetrominos.
 * All shapes implement the Super Rotation System (SRS).
 */
export const TetrominoShapes: { [key: string]: Matrix<number> } = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0]
  ],
  O: [
    [1, 1],
    [1, 1]
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0]
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0]
  ]
};

/**
 * Defines colours associated with each tetromino shape.
 */
export const TetrominoColours: { [key: string]: string } = {
  I: "cyan",
  J: "orange",
  L: "dodgerblue",
  O: "yellow",
  T: "magenta",
  S: "green",
  Z: "red",
};

/**
 * Contains wall kick data for each tetromino's rotation orientation.
 * All wall kicks implement clockwise rotations of the Super Rotation System (SRS).
 * - Orientation 0: 0 degree, the original position. 
 * - Orientation 1: 90 degree clockwise from the original position.
 * - Orientation 2: 180 degree clockwise from the original position.
 * - Orientation 3: 270 degree clockwise from the original position.
 */
export const WallKickData: { [key: string]: ReadonlyArray<Matrix<number>> } = {
  I: [
    // 0 >> 1 (clockwise rotation from 0 to 1)
    [[-2, 0], [1, 0], [-2, 1], [1, -2]],
    // 1 >> 2 (clockwise rotation from 1 to 2)
    [[-1, 0], [2, 0], [-1, -2], [2, 1]],
    // 2 >> 3 (clockwise rotation from 2 to 3)
    [[2, 0], [-1, 0], [2, -1], [-1, 2]],
    // 3 >> 0 (clockwise rotation from 3 to 4)
    [[1, 0], [-2, 0], [1, 2], [-2, -1]]
  ],
  J: [
    // 0 >> 1
    [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    // 1 >> 2
    [[1, 0], [1, 1], [0, -2], [1, -2]],
    // 2 >> 3
    [[1, 0], [1, -1], [0, 2], [1, 2]],
    // 3 >> 0
    [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
  ],
  L: [
    // 0 >> 1
    [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    // 1 >> 2
    [[1, 0], [1, 1], [0, -2], [1, -2]],
    // 2 >> 3
    [[1, 0], [1, -1], [0, 2], [1, 2]],
    // 3 >> 0
    [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
  ],
  O: [[[]]],
  S: [
    // 0 >> 1
    [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    // 1 >> 2
    [[1, 0], [1, 1], [0, -2], [1, -2]],
    // 2 >> 3
    [[1, 0], [1, -1], [0, 2], [1, 2]],
    // 3 >> 0
    [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
  ],
  T: [
    // 0 >> 1
    [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    // 1 >> 2
    [[1, 0], [1, 1], [0, -2], [1, -2]],
    // 2 >> 3
    [[1, 0], [1, -1], [0, 2], [1, 2]],
    // 3 >> 0
    [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
  ],
  Z: [
    // 0 >> 1
    [[-1, 0], [-1, -1], [0, 2], [-1, 2]],
    // 1 >> 2
    [[1, 0], [1, 1], [0, -2], [1, -2]],
    // 2 >> 3
    [[1, 0], [1, -1], [0, 2], [1, 2]],
    // 3 >> 0
    [[-1, 0], [-1, 1], [0, -2], [-1, -2]]
  ],
};

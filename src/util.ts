import { Tetromino, TetrominoShapes, TetrominoColours, Constants, State } from "./types";
import { map, scan } from "rxjs/operators";
import type { Observable } from "rxjs";

/**
 * Abstract class providing random number generator methods.
 * 
 * The implementations of RNG here are referred to FIT2102 Tutorial 3.
 */
export abstract class RNG {

  private static m = 0x7FFFFFFF;
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Linear congruential generator hash function.
   * @param seed - Seed value.
   * @returns Hashed random number.
   */
  public static hash = (seed: number): number => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Scales a hash value to a random number in the range [0, 1).
   * @param hash - Hash value.
   * @returns Scaled random number.
   */
  public static scale = (hash: number): number => hash / (RNG.m - 1);

}

/**
 * Creates an observable stream of random numbers from a source.
 * @param source$ - Observable source.
 * @returns Function to create a random number stream.
 */
export function createRngStreamFromSource<T>(source$: Observable<T>) {
  return function createRngStream(seed: number): Observable<number> {
    const randomNumberStream = source$.pipe(
      scan((prevSeed, _) => RNG.hash(prevSeed), seed),
      map(RNG.scale)
    );
    return randomNumberStream;
  };
}

/**
 * Generates a random tetromino using the provided random number.
 * @param rng - Random number used for tetromino selection.
 * @returns Randomly generated tetromino.
 */
export const getRandomTetromino = (rng: number): Tetromino => {
  const tetrominoKeys = Object.keys(TetrominoShapes);
  const randomIndex = Math.floor(rng * tetrominoKeys.length);
  const randomTetrominoKey = tetrominoKeys[randomIndex];
  return {
    key: randomTetrominoKey,
    orientation: INITIAL_ORIENTATION,
    shape: TetrominoShapes[randomTetrominoKey],
    colour: TetrominoColours[randomTetrominoKey],
    x: Math.floor(Constants.GRID_WIDTH / 2) - Math.floor(TetrominoShapes[randomTetrominoKey][0].length / 2),
    y: -2,
  };
};

/**
 * Constant initial values of the game.
 */
export const INITIAL_SEED: number = Math.random();
export const INITIAL_LEVEL: number = 0;
export const INITIAL_ORIENTATION: number = 0;
export const INITIAL_SCORE: number = 0;

/**
 * Initial game state configuration.
 */
export const INITIAL_STATE: State = {
  gameEnd: false,
  gamePause: false,
  gameRestart: false,
  grid: Array.from({ length: (Constants.GRID_HEIGHT) }, () => Array(Constants.GRID_WIDTH).fill(0)),
  currentTetromino: getRandomTetromino(INITIAL_SEED),
  nextTetromino: getRandomTetromino(RNG.scale(RNG.hash(INITIAL_SEED * 314159))),
  holdTetromino: undefined,
  level: INITIAL_LEVEL,
  score: INITIAL_SCORE,
  highScore: INITIAL_SCORE,
};

import { INITIAL_ORIENTATION, getRandomTetromino } from "./util";
import { State, TetrominoShapes, Constants, Tetromino, Key, WallKickData, Matrix, Input } from "./types";

/**
 * Checks if a tetromino is colliding with other tetrominoes on the grid.
 * @param x - X-coordinate of the tetromino.
 * @param y - Y-coordinate of the tetromino.
 * @param shape - Matrix representing the tetromino shape.
 * @param grid - Matrix representing the game grid.
 * @returns True if collision, false otherwise.
 */
export const isCollision = (x: number, y: number, shape: Matrix<number>, grid: Matrix<number>): boolean => {
  return shape.some((row, yBlock) => {
    return row.some((cell, xBlock) => {
      if (cell === 1) {
        const newX = x + xBlock;
        const newY = y + yBlock;
        return (
          newY >= Constants.GRID_HEIGHT
          || newX < 0
          || newX >= Constants.GRID_WIDTH
          || (newY >= 0 && grid[newY][newX] === 1)
        );
      }
      return false; // No collision check needed for empty cells.
    });
  });
};

/**
 * Checks if a tetromino shape is out of bounds.
 * @param x - X-coordinate of the tetromino.
 * @param y - Y-coordinate of the tetromino.
 * @param shape - Matrix representing the tetromino shape.
 * @returns True if out of bounds, false otherwise.
 */
export const isOutOfBounds = (x: number, y: number, shape: Matrix<number>): boolean => {
  return shape.some((row, yBlock) => {
    return row.some((cell, xBlock) => {
      if (cell === 1) {
        const newX = x + xBlock;
        const newY = y + yBlock;
        return (
          newX < 0
          || newX >= Constants.GRID_WIDTH
          || newY >= Constants.GRID_HEIGHT
        );
      }
      return false; // No out-of-bounds check needed for empty cells.
    });
  });
};

/**
 * Checks if the current tetromino is settled (cannot move downwards) on the grid.
 * @param currentTetromino - The current tetromino.
 * @param grid - Matrix representing the game grid.
 * @returns True if the tetromino is settled, false otherwise.
 */
const isSettled = (currentTetromino: Tetromino, grid: Matrix<number>): boolean => {
  const yDownByOne = currentTetromino.y + 1;
  return (
    isCollision(currentTetromino.x, yDownByOne, currentTetromino.shape, grid)
    || isOutOfBounds(currentTetromino.x, yDownByOne, currentTetromino.shape)
  );
};

/**
 * Checks if the game has ended.
 * @param s - The game state.
 * @returns True if the game has ended, false otherwise.
 */
const isGameEnd = (s: State): boolean => {
  if (
    isSettled(s.currentTetromino, s.grid)
    && s.currentTetromino.y < 0
    && s.currentTetromino.shape[0].some((cell) => cell === 1)
  ) { return true; }
  return false;
};

/**
 * Moves the current tetromino by a specified offset.
 * @param s - The game state.
 * @param xOffset - X offset to move the tetromino.
 * @param yOffset - Y offset to move the tetromino.
 * @returns Updated game state after moving the tetromino.
 */
const moveTetromino = (s: State, xOffset: number, yOffset: number): State => {
  const movedTetromino = {
    ...s.currentTetromino,
    x: s.currentTetromino.x + xOffset,
    y: s.currentTetromino.y + yOffset,
  };
  // If out of bounds or collision after movement, do not update.
  if (
    isCollision(movedTetromino.x, movedTetromino.y, movedTetromino.shape, s.grid)
    || isOutOfBounds(movedTetromino.x, movedTetromino.y, movedTetromino.shape)
  ) { return s; }
  return { ...s, currentTetromino: movedTetromino };
};

/**
 * Rotates a matrix clockwise by 90 degrees.
 * @param matrix - The matrix to rotate.
 * @returns Rotated matrix.
 */
const rotateMatrix = (matrix: Matrix<number>): Matrix<number> => {
  // Rotation by transposing and reversing.
  const transposedMatrix = matrix[0].map((col, i) => matrix.map(row => row[i]));
  const rotatedMatrix = transposedMatrix.map(row => row.reverse());
  return rotatedMatrix;
};

/**
 * Attempts to perform a wall kick for an invalid basic rotation.
 * @param currentTetromino - The current tetromino.
 * @param rotatedTetromino - The rotated tetromino to be tested.
 * @param grid - Matrix representing the game grid.
 * @returns Wall-kicked tetromino if successful, undefined otherwise.
 */
const attemptWallKick = (currentTetromino: Tetromino, rotatedTetromino: Tetromino, grid: Matrix<number>): Tetromino | undefined => {

  // Attempt wall kicks based on wall kick data.
  const wallKickDataTetromino = WallKickData[currentTetromino.key];           // Test for the current shape only.
  const wallKickTests = wallKickDataTetromino[currentTetromino.orientation];  // Test for the current orientation only.
  const validWallKick = wallKickTests.find(test => {
    const adjustedTetromino = {
      ...rotatedTetromino,
      x: rotatedTetromino.x + test[0],
      y: rotatedTetromino.y + test[1],
    };
    return (
      !isCollision(adjustedTetromino.x, adjustedTetromino.y, adjustedTetromino.shape, grid)
      && !isOutOfBounds(adjustedTetromino.x, adjustedTetromino.y, adjustedTetromino.shape)
    );
  });

  // Return wall-kicked tetromino if any wall kick attempt succeeded.
  if (validWallKick) {
    const wallKickedTetromino = {
      ...rotatedTetromino,
      x: rotatedTetromino.x + validWallKick[0],
      y: rotatedTetromino.y + validWallKick[1],
    };
    return wallKickedTetromino;
  }

}

/**
 * Rotates the current tetromino clockwise by 90 degrees.
 * @param s - The game state.
 * @returns Updated game state after rotating the tetromino.
 */
export const rotateTetromino = (s: State): State => {

  const rotatedTetromino = {
    ...s.currentTetromino,
    orientation: (s.currentTetromino.orientation + 1) % 4,
    shape: rotateMatrix(s.currentTetromino.shape),
  };

  // Return rotated tetromino if basic rotation is valid.
  if (
    !isCollision(rotatedTetromino.x, rotatedTetromino.y, rotatedTetromino.shape, s.grid)
    && !isOutOfBounds(rotatedTetromino.x, rotatedTetromino.y, rotatedTetromino.shape)
  ) {
    return { ...s, currentTetromino: rotatedTetromino };
  }

  // Attempt and return wall-kicked tetromino if basic rotation failed.
  const wallKickedTetromino = attemptWallKick(s.currentTetromino, rotatedTetromino, s.grid);
  if (wallKickedTetromino) {
    return { ...s, currentTetromino: wallKickedTetromino };
  }

  // Return original tetromino if wall kick attempts failed.
  return s;

};

/**
 * Clears completed rows in the grid and updates the grid.
 * @param grid - Matrix representing the game grid.
 * @returns Updated grid, and the number of rows cleared.
 */
const clearCompletedRows = (grid: Matrix<number>): [Matrix<number>, number] => {
  const fullRows = grid.filter(row => row.every(cell => cell === 1));
  if (fullRows.length === 0) {
    return [grid, 0];
  }
  const numFullRows = fullRows.length;
  const clearedGrid = [
    ...Array.from({ length: numFullRows }, () => Array(Constants.GRID_WIDTH).fill(0)),
    ...grid.filter(row => !row.every(cell => cell === 1))
  ];
  return [clearedGrid, numFullRows];
};

/**
 * Updates the game state (movements of the current tetromino) based on user input.
 * @param s - The game state.
 * @param key - The user input key.
 * @returns Updated game state after processing the user input.
 */
export const updateState = (s: State, key: Key): State => {
  if (key === "ArrowLeft") {
    return moveTetromino(s, -1, 0);
  } else if (key === "ArrowRight") {
    return moveTetromino(s, 1, 0);
  } else if (key === "ArrowDown") {
    return moveTetromino(s, 0, 1);
  } else if (key === "ArrowUp") {
    return rotateTetromino(s);
  }
  return s;
};

/**
 * Drops the current tetromino to the lowest possible position.
 * @param s - The game state.
 * @returns Updated game state after dropping the tetromino.
 */
export const dropTetromino = (s: State): State => {
  const dropOneStepRecursive = (currentState: State): State => {
    if (isSettled(currentState.currentTetromino, currentState.grid)) {
      return currentState;
    }
    const nextState = moveTetromino(currentState, 0, 1);
    return dropOneStepRecursive(nextState);
  };
  return dropOneStepRecursive(s);
};

/**
 * Performs a hard drop, by dropping the tetromino and processing the next tick.
 * @param s - The game state.
 * @param rng - A random number, generated from the rng$ stream.
 * @returns Updated game state after a hard drop.
 */
export const hardDrop = (s: State, rng: number): State => {
  return tick(dropTetromino(s), rng);
};

/**
 * Resets the orientation and the position of a tetromino.
 * @param t - The tetromino to reset.
 * @returns Tetromino with reset position.
 */
export const resetPosition = (tetromino: Tetromino): Tetromino => {
  return {
    ...tetromino,
    orientation: INITIAL_ORIENTATION,
    shape: TetrominoShapes[tetromino.key],
    x: Math.floor(Constants.GRID_WIDTH / 2) - Math.floor(TetrominoShapes[tetromino.key][0].length / 2),
    y: -2,
  };
};

/**
 * Updates the game state to perform a tetromino hold operation.
 *
 * @param s - The current game state object.
 * @param tickRng - A random number used for generating the next tetromino.
 * @returns A modified game state object after the hold operation is performed.
 */
export const holdState = (s: State, tickRng: number): State => {
  // If there's no tetromino in hold, swap the current with the next.
  if (s.holdTetromino === undefined) {
    return {
      ...s,
      currentTetromino: s.nextTetromino,
      nextTetromino: getRandomTetromino(tickRng),
      holdTetromino: resetPosition(s.currentTetromino),
      gameRestart: false,
    };
  }
  // If there's a tetromino in hold, swap it with the current.
  else {
    return {
      ...s,
      currentTetromino: resetPosition(s.holdTetromino),
      holdTetromino: resetPosition(s.currentTetromino),
      gameRestart: false,
    };
  }
};

/**
 * Updates the game grid by placing the current tetromino on it.
 * @param grid - Matrix representing the game grid.
 * @param currentTetromino - The current tetromino.
 * @returns Updated game grid with the tetromino placed on it.
 */
const updateGrid = (grid: Matrix<number>, currentTetromino: Tetromino): Matrix<number> => {

  const xPivot = currentTetromino.x;
  const yPivot = currentTetromino.y;
  const yLength = currentTetromino.shape.length;
  const xLength = currentTetromino.shape[0].length;

  // Add the tetromino's value to the cell value if overlapping.
  const updatedGrid: Matrix<number> = grid.map((row, yIndex) => {
    return row.map((cell, xIndex) => {
      const isOverlap =
        yIndex >= yPivot
        && yIndex < yPivot + yLength
        && xIndex >= xPivot
        && xIndex < xPivot + xLength;
      if (isOverlap) {
        const yTetromino = yIndex - yPivot;
        const xTetromino = xIndex - xPivot;
        return cell + currentTetromino.shape[yTetromino][xTetromino];
      }
      return cell;
    });
  });

  return updatedGrid;

};

/**
 * Advances the game state by one tick.
 * @param s - The game state.
 * @param rng - A random number, generated from the rng$ stream.
 * @returns Updated game state after processing one tick.
 */
export const tick = (s: State, rng: number): State => {

  if (isGameEnd(s)) {
    return { ...s, gameEnd: true };
  }

  else if (isSettled(s.currentTetromino, s.grid)) {
    // Update grid and score.
    const updatedGrid = updateGrid(s.grid, s.currentTetromino);
    const [clearedGrid, numFullRows] = clearCompletedRows(updatedGrid);
    const newScore = s.score + numFullRows * 100;
    // Create a new tetromino for the next round.
    const newState = {
      ...s,
      grid: clearedGrid,
      currentTetromino: s.nextTetromino,
      nextTetromino: getRandomTetromino(rng),
      level: Math.floor(newScore / 1000),
      score: newScore,
      highScore: newScore > s.highScore ? newScore : s.highScore,
    };
    return newState;
  }

  return (s.gamePause || s.gameEnd) ? s : { ...moveTetromino(s, 0, 1), gameRestart: false };

};

/********************************************
 * Observable Handler Predicate Functions
 * 
 * Below are five predicate functions,
 * to determine the valid observable inputs.
 ********************************************/

export const isMovement = (s: State, input: Input): boolean => {
  return (
    input instanceof KeyboardEvent
    && !s.gameEnd
    && !s.gamePause
  );
};

export const isPause = (input: Input, button: Element): boolean => {
  return (
    input instanceof MouseEvent
    && input.target === button
  );
};

export const isRestart = (input: Input, button: Element): boolean => {
  return (
    input instanceof MouseEvent
    && input.target === button
  );
};

export const isHardDrop = (s: State, input: Input): boolean => {
  return (
    Array.isArray(input)
    && input[1].code === "Space"
    && !s.gameEnd
    && !s.gamePause
  );
};

export const isHold = (s: State, input: Input): boolean => {
  return (
    Array.isArray(input)
    && input[1].code === "KeyC"
    && !s.gameEnd
    && !s.gamePause
  );
};

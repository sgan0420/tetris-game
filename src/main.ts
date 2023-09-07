import "./style.css";
import { INITIAL_SEED, INITIAL_LEVEL, INITIAL_STATE, createRngStreamFromSource } from "./util";
import { updateState, hardDrop, tick, holdState, isMovement, isPause, isRestart, isHardDrop, isHold } from "./state";
import { show, hide, generateGridLines, renderCurrentTetromino, renderExistingTetrominoes, renderNextTetromino, renderHoldTetromino, setCanvaAttributes } from "./view";
import { Constants, Key, State, Input } from "./types";
import { fromEvent, interval, merge, zip, BehaviorSubject } from "rxjs";
import { map, filter, scan, switchMap } from "rxjs/operators";

/**
 * Tetris Game Main Function.
 */
export function main() {

  /****************
   * Canvas Set Up
   ****************/

  // Retrieves canvas elements.
  const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement & HTMLElement;
  const svgNext = document.querySelector("#svgNext") as SVGGraphicsElement & HTMLElement;
  const svgHold = document.querySelector("#svgHold") as SVGGraphicsElement & HTMLElement;
  const gameover = document.querySelector("#gameOver") as SVGGraphicsElement & HTMLElement;
  const gamepause = document.querySelector("#gamePause") as SVGGraphicsElement & HTMLElement;
  const container = document.querySelector("#main") as HTMLElement;
  const restartButton = document.querySelector("#restartButton") as HTMLButtonElement;
  const pauseButton = document.querySelector("#pauseButton") as HTMLButtonElement;
  const levelText = document.querySelector("#levelText") as HTMLElement;
  const scoreText = document.querySelector("#scoreText") as HTMLElement;
  const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

  // Sets up canvas.
  setCanvaAttributes(svg, svgNext, svgHold);
  generateGridLines(svg, 0, 0, Constants.GRID_WIDTH, Constants.GRID_HEIGHT);

  /*********************
   * Observables set up
   *********************/

  // Adjusts game's tick rate according to current level.
  const levelSubject$ = new BehaviorSubject<number>(INITIAL_LEVEL);
  const rate$ = levelSubject$.pipe(map((level) =>
    Math.max((Constants.TICK_RATE_MS - (level * Constants.TICKRATE_INCREMENT)), Constants.MINIMUM_TICKRATE)));
  const tick$ = rate$.pipe(switchMap((tickRate) => interval(tickRate)));

  // Creates an observable that generates a stream of random numbers in sync with game ticks.
  const createRngStream = createRngStreamFromSource(tick$);
  const tickRng$ = createRngStream(INITIAL_SEED);

  // Creates observables based on keyboard key presses.
  const key$ = fromEvent<KeyboardEvent>(document, "keydown");
  const fromKey = (keyCode: Key) => key$.pipe(filter(({ code }) => code === keyCode));
  const left$ = fromKey("ArrowLeft");
  const right$ = fromKey("ArrowRight");
  const down$ = fromKey("ArrowDown");
  const rotate$ = fromKey("ArrowUp");
  const drop$ = fromKey("Space");
  const hold$ = fromKey("KeyC");

  // Creates observables based on mouse clicks.
  const pauseClick$ = fromEvent<MouseEvent>(pauseButton, "click");
  const restartClick$ = fromEvent<MouseEvent>(restartButton, "click");

  // Combines the observables based on their usage.
  const movements$ = merge(left$, right$, down$, rotate$);
  const mouseclicks$ = merge(pauseClick$, restartClick$);
  const hardDrop$ = zip(tickRng$, drop$);
  const holdRng$ = zip(tickRng$, hold$);

  /**********
   * Renders
   **********/

  /**
   * Renders the game state on the canvas.
   * @param state - The current game state.
   */
  const render = (s: State) => {
    // Clears all tetromino blocks from the previous game state.
    const existingBlocks = container.querySelectorAll(".block");
    existingBlocks.forEach(block => block.remove());
    // Renders all tetromino blocks for the current game state.
    renderCurrentTetromino(s, svg);
    renderExistingTetrominoes(s, svg);
    renderNextTetromino(s, svgNext);
    renderHoldTetromino(s, svgHold);
  };

  /**
   * Updates the displayed text elements.
   * @param state - The current game state.
   */
  const updateText = (s: State) => {
    levelText.textContent = `${s.level}`;
    scoreText.textContent = `${s.score}`;
    highScoreText.textContent = `${s.highScore}`;
  };

  /***********************
   * Observable Workflows
   ***********************/

  /**
   * Handles the game logic based on user input (observable).
   * @param state - The current game state.
   * @param input - The user input.
   * @returns The updated game state.
   */
  const handleInput = (s: State, currInput: Input): State => {
    // State processing 1: Moves the tetromino as requested.
    if (isMovement(s, currInput)) {
      (currInput as KeyboardEvent).preventDefault();
      return { ...updateState(s, (currInput as KeyboardEvent).code as Key), gameRestart: false };
    }
    // State processing 2: Pauses the game as requested.
    else if (isPause(currInput, pauseButton)) {
      pauseButton.blur();
      return { ...s, gamePause: !s.gamePause, gameRestart: false };
    }
    // State processing 3: Restarts the game as requested.
    else if (isRestart(currInput, restartButton)) {
      restartButton.blur();
      return { ...INITIAL_STATE, gameRestart: true, highScore: s.highScore, };
    }
    // State processing 4: Hard drops the tetromino as requested.
    else if (isHardDrop(s, currInput)) {
      const [tickRng, drop] = currInput as [number, KeyboardEvent];
      drop.preventDefault();
      return hardDrop(s, tickRng);
    }
    // State processing 5: Holds the tetromino as requested.
    else if (isHold(s, currInput)) {
      const [tickRng, hold] = currInput as [number, KeyboardEvent];
      return { ...holdState(s, tickRng), gameRestart: false };
    }
    // State processing default: Continues the game tick if no user request.
    else {
      return (s.gameEnd || s.gamePause) ? s : tick(s, currInput as number);
    }
  }

  /**
   * Observable Workflow
   *
   * This workflow sets up and processes observable streams for a Tetris game.
   * It merges various observables related to game actions, processes the input
   * using the provided handler function, and subscribes to the resulting stream
   * for performing side effects.
   *
   * @param tickRng$ - Observable emitting random numbers synchronized with game ticks.
   * @param movements$ - Observable emitting movement actions.
   * @param mouseclicks$ - Observable emitting mouse click actions.
   * @param hardDrop$ - Observable emitting hard drop actions.
   * @param holdRng$ - Observable emitting hold actions.
   * @returns A subscription for handling observable emissions and performing side effects.
   */
  const source$ = merge(tickRng$, movements$, mouseclicks$, hardDrop$, holdRng$)
    // Pipes and transforms the states without side effects.
    .pipe(
      scan((s, currInput) => handleInput(s, currInput), INITIAL_STATE)
    )
    // Subcribes to the observable emissions to perform side effects.
    .subscribe((s: State) => {
      // Performs renderings.
      if (!s.gamePause) {
        hide(gamepause);
        render(s);
        updateText(s);
        s.gameEnd ? show(gameover) : hide(gameover);
      }
      if (s.gamePause && !s.gameEnd) {
        show(gamepause);
      }
      // Restarts the game level. 
      // s.gameRestart would be reverted when processing the immediate next state.
      if (s.gameRestart) {
        levelSubject$.next(INITIAL_LEVEL);
      }
      // Updates the game level.
      if (levelSubject$.value !== s.level) {
        levelSubject$.next(s.level);
      }
    });
}

// Runs the main function on window load.
if (typeof window !== "undefined") {
  window.onload = () => {
    main();
  };
}

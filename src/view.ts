import { Block, State, Viewport } from "./types";

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display.
 */
export const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide.
 */
export const hide = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "hidden");
}

/**
 * Creates an SVG element with specified namespace, name, and attributes.
 * @param namespace - Namespace for the SVG element.
 * @param name - Name of the SVG element.
 * @param props - Attributes to set on the SVG element.
 * @returns The created SVG element.
 */
export const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

/**
 * Creates and appends a tetromino block onto the canvas.
 * @param x - X-coordinate of the block.
 * @param y - Y-coordinate of the block.
 * @param fill - Fill colour of the block.
 * @param e - Parent SVG element to append to.
 */
export const createAndAppendRect = (x: number, y: number, fill: string, e: Element) => {
  const rect = createSvgElement(e.namespaceURI, "rect", {
    height: `${Block.HEIGHT}`,
    width: `${Block.WIDTH}`,
    x: `${Block.WIDTH * x}`,
    y: `${Block.HEIGHT * y}`,
    style: `fill: ${fill}`,
    class: "block",
  });
  e.appendChild(rect);
};

export const setCanvaAttributes = (svg: Element, preview: Element, hold: Element) => {
  svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
  svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
  preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
  preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);
  hold.setAttribute("height", `${Viewport.HOLD_HEIGHT}`);
  hold.setAttribute("width", `${Viewport.HOLD_WIDTH}`);
}

/**
 * Generates grid lines for an SVG element based on dimensions.
 * @param svg - The SVG element to add grid lines to.
 * @param x - X-coordinate for grid line generation.
 * @param y - Y-coordinate for grid line generation.
 * @param width - Width of the grid.
 * @param height - Height of the grid.
 */
export const generateGridLines = (
  svg: SVGElement,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  if (x <= width) {
    const verticalLine = createSvgElement(svg.namespaceURI, "line", {
      x1: `${x * Block.WIDTH}`,
      y1: "0",
      x2: `${x * Block.WIDTH}`,
      y2: `${Viewport.CANVAS_HEIGHT}`,
    });
    svg.appendChild(verticalLine);
    generateGridLines(svg, x + 1, y, width, height);
  } else if (y <= height) {
    const horizontalLine = createSvgElement(svg.namespaceURI, "line", {
      x1: "0",
      y1: `${y * Block.HEIGHT}`,
      x2: `${Viewport.CANVAS_WIDTH}`,
      y2: `${y * Block.HEIGHT}`,
    });
    svg.appendChild(horizontalLine);
    generateGridLines(svg, 0, y + 1, width, height);
  }
};

/***************************************
 * Render Functions
 * 
 * Below are four rendering functions,
 * to draw tetrominoes onto the canvas.
 ***************************************/

export const renderCurrentTetromino = (s: State, element: Element) => {
  s.currentTetromino.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        const blockX = s.currentTetromino.x + x;
        const blockY = s.currentTetromino.y + y;
        const colour = s.currentTetromino.colour
        createAndAppendRect(blockX, blockY, colour, element);
      }
    });
  });
};

export const renderExistingTetrominoes = (s: State, element: Element) => {
  s.grid.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        createAndAppendRect(x, y, "gray", element);
      }
    });
  });
};

export const renderNextTetromino = (s: State, element: Element) => {
  s.nextTetromino.shape.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (cell === 1) {
        const blockX = x + 4 - Math.ceil(s.nextTetromino.shape[0].length / 2);
        const blockY = y + 1;
        const colour = s.nextTetromino.colour;
        createAndAppendRect(blockX, blockY, colour, element);
      }
    });
  });
};

export const renderHoldTetromino = (s: State, element: Element) => {
  if (s.holdTetromino !== undefined) {
    s.holdTetromino.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell === 1) {
          const blockX = x + 4 - Math.ceil(s.holdTetromino!.shape[0].length / 2);
          const blockY = y + 1;
          const colour = s.holdTetromino!.colour;
          createAndAppendRect(blockX, blockY, colour, element);
        }
      });
    });
  }
};

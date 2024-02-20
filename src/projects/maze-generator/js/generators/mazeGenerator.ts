import { SteppedRunner } from "../../../../js/steppedRunner";

export enum Cell {
  Visited = 1 << 0,
  Working = 1 << 1,
  WallLeft = 1 << 2,
  WallRight = 1 << 3,
  WallTop = 1 << 4,
  WallBottom = 1 << 5,
}

export interface MazeGeneratorOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width?: number;
  height?: number;
}

export abstract class MazeGenerator extends SteppedRunner {
  maze: Uint8Array;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  done: boolean = false;
  // Without these we would need to do math on canvas dims to get these values.
  private _width: number = 0;
  private _height: number = 0;

  constructor({ canvas, ctx, width = 32, height = 32 }: MazeGeneratorOptions) {
    super();
    this.canvas = canvas;
    this.ctx = ctx;
    this.width = width;
    this.height = height;
    this.maze = new Uint8Array(width * height).fill(
      Cell.WallLeft | Cell.WallRight | Cell.WallTop | Cell.WallBottom
    );

    this.resizeCanvas();
    this.run();
  }

  set width(val) {
    this._width = val;
    this.canvas.width = 1 + val * 2;
    this.maze = new Uint8Array(val * this.height);
    this.resizeCanvas();
  }

  set height(val) {
    this._height = val;
    this.canvas.height = 1 + val * 2;
    this.maze = new Uint8Array(this.width * val);
    this.resizeCanvas();
  }

  get width() {
    return this._width;
  }

  get height() {
    return this._height;
  }

  setPos(x: number, y: number, val: number) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.maze[y * this.width + x] = val;
    }
  }

  getPos(x: number, y: number) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.maze[y * this.width + x];
    }
  }

  addFlags(x: number, y: number, flags: number) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.maze[y * this.width + x] |= flags;
    }
  }

  removeFlags(x: number, y: number, flags: number) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.maze[y * this.width + x] &= ~flags;
    }
  }

  draw() {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.getPos(x, y);
        if (cell === undefined) {
          continue;
        }
        const canvasX = x * 2;
        const canvasY = y * 2;

        if (cell & Cell.Visited) {
          // Draw cell
          if (!(cell & Cell.Working)) {
            this.ctx.fillStyle = "white";
          } else {
            this.ctx.fillStyle = "green";
          }
          this.ctx.fillRect(canvasX, canvasY, 3, 3);

          // Draw walls over cell
          this.ctx.fillStyle = "black";
          // Fill Corners
          // This should maybe actually check the diagonal or corner cells.
          this.ctx.fillRect(canvasX, canvasY, 1, 1);
          this.ctx.fillRect(canvasX + 2, canvasY, 1, 1);
          this.ctx.fillRect(canvasX, canvasY + 2, 1, 1);
          this.ctx.fillRect(canvasX + 2, canvasY + 2, 1, 1);
          // Fill Edges
          if (cell & Cell.WallLeft) {
            this.ctx.fillRect(canvasX, canvasY, 1, 3);
          }
          if (cell & Cell.WallRight) {
            this.ctx.fillRect(canvasX + 2, canvasY, 1, 3);
          }
          if (cell & Cell.WallTop) {
            this.ctx.fillRect(canvasX, canvasY, 3, 1);
          }
          if (cell & Cell.WallBottom) {
            this.ctx.fillRect(canvasX, canvasY + 2, 3, 1);
          }
        }
      }
    }
  }

  reset() {
    this.maze.fill(
      Cell.WallLeft | Cell.WallRight | Cell.WallTop | Cell.WallBottom
    );
    this.done = false;
    this.cleanUp();
    this.run();
    this.draw();
  }

  resizeCanvas() {}
}

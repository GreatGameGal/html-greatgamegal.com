import { SteppedRunner } from "../../../../js/steppedRunner";

export interface SorterOptions {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  length?: number;
  targetDims?: number;
  data?: Float64Array;
}

export interface State {
  done: 0;
}

export abstract class Sorter extends SteppedRunner {
  static defaultLength = 0;

  targetDims: number;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  data: Float64Array;
  active: number[] = [];
  done: boolean = false;

  constructor({
    canvas,
    ctx,
    length = 256,
    targetDims = 1024,
    data = new Float64Array(length),
  }: SorterOptions) {
    super();
    this.canvas = canvas;
    this.ctx = ctx;
    this.targetDims = targetDims;
    this.data = data;
    this.randomize();
    this.setInternalDims();
  }

  reset(): void {
    this.cleanUp();
    // We need to step to recreate a promise after cleanUp.
    this.step();
    this.done = false;
    this.randomize();
    this.run();
  }

  swap(i: number, j: number): void {
    const temp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = temp;
  }

  draw(): void {
    this.ctx.fillStyle = "black";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    const width = Math.floor(this.canvas.width / this.data.length);
    for (let i = 0; i < this.data.length; i++) {
      if (!this.done) {
        if (!this.active.includes(i)) {
          this.ctx.fillStyle = "white";
        } else {
          this.ctx.fillStyle = "green";
        }
      } else {
        this.ctx.fillStyle = "lime";
      }
      const height = Math.ceil(this.data[i] * this.canvas.height);
      const x = i * width;
      const y = this.canvas.height - height;
      this.ctx.fillRect(x, y, width, height);
    }
  }

  randomize(): void {
    for (let i = 0; i < this.data.length; i++) {
      this.data[i] = Math.random();
    }
  }

  protected setInternalDims(): void {
    const diff = this.targetDims / this.data.length;
    const sizeMult = Math.max(1, Math.round(diff));
    const size = sizeMult * this.data.length;
    this.canvas.width = size;
    this.canvas.height = size;
  }

  set length(val: number) {
    if (val > this.data.length) {
      try {
        const buff = (this.data.buffer as ArrayBuffer).resize(val);
        this.data = new Float64Array(buff);
      } catch (e) {
        const oldData = this.data;
        this.data = new Float64Array(val);
        this.data.set(oldData);
      }
    } else if (val < this.data.length) {
      this.data = this.data.subarray(0, val);
    }
    this.setInternalDims();
    this.reset();
  }

  get length(): number {
    return this.data.length;
  }
}

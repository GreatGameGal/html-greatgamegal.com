import { type SorterOptions, Sorter } from "./sorter";

export class BubbleSorter extends Sorter {
  static defaultLength = 128;

  i: number = 0;
  iterations: number = 0;

  constructor(options: SorterOptions) {
    super(
      Object.assign(
        Object.create(null),
        { length: BubbleSorter.defaultLength },
        options
      )
    );
  }

  step(): void {
    this.active.length = 0;
    this.active.push(this.i, this.i + 1);
    if (this.i === this.data.length - 1 - this.iterations) {
      this.i = 0;
      this.iterations++;
      if (this.iterations === this.data.length - 2) {
        this.active.length = 0;
        this.done = true;
      }
    }
    if (this.iterations === this.data.length) {
      this.reset();
    }
    if (this.data[this.i] > this.data[this.i + 1]) {
      this.swap(this.i, this.i + 1);
    }
    this.i++;
  }

  reset(): void {
    this.i = 0;
    this.iterations = 0;
    this.done = false;
    this.randomize();
  }
}

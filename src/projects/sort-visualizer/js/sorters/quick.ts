import { type SorterOptions, Sorter } from "./sorter";

export enum State {
  outloopP1,
  inloop,
  outloopP2,
  done,
}

export class QuickSorter extends Sorter {
  static defaultLength = 512;

  constructor(options: SorterOptions) {
    super(
      Object.assign(
        Object.create(null),
        { length: QuickSorter.defaultLength },
        options
      )
    );
  }

  async run(): Promise<void> {
    const stack = [0, this.data.length - 1];

    while (stack.length > 1) {
      // We know these exist because stack.length > 1
      const high = stack.pop() as number;
      const low = stack.pop() as number;
      if ((await this.waitForStep) !== 0) {
        return;
      }
      this.active.length = 0;
      this.active.push(high, low);

      const pivot = this.data[high];
      let p = low - 1;
      let j = low;
      while (j < high) {
        if ((await this.waitForStep) !== 0) {
          return;
        }
        this.active.length = 0;
        this.active.push(high, low, j, pivot);
        if (this.data[j] < pivot) {
          p++;
          [this.data[p], this.data[j]] = [this.data[j], this.data[p]];
        }
        j++;
      }
      p++;
      [this.data[p], this.data[high]] = [this.data[high], this.data[p]];

      if (p - 1 > low) {
        stack.push(low, p - 1);
      }

      if (p + 1 < high) {
        stack.push(p + 1, high);
      }
    }
    this.done = true;
  }
}

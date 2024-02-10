import { type SorterOptions, Sorter } from "./sorter";

export class BubbleSorter extends Sorter {
  static defaultLength = 128;

  constructor(options: SorterOptions) {
    super(
      Object.assign(
        Object.create(null),
        { length: BubbleSorter.defaultLength },
        options
      )
    );
  }

  async run(): Promise<void> {
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data.length - i; j++) {
        if ((await this.waitForStep) !== 0) {
          return;
        }
        this.active.length = 0;
        this.active.push(j, j + 1);

        if (this.data[j] > this.data[j + 1]) {
          this.swap(j, j + 1);
        }
      }
    }
    this.done = true;
  }
}

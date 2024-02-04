import { type SorterOptions, Sorter } from "./sorter";

export enum State {
  outloopP1,
  inloop,
  outloopP2,
  done,
}

export class QuickSorter extends Sorter {
  static defaultLength = 512;
  low = 0;
  high = this.data.length - 1;
  stack: number[] = [];
  pivot: number = 0;
  p: number = 0;
  j: number = 0;
  state: State = State.outloopP1;

  constructor(options: SorterOptions) {
    super(
      Object.assign(
        Object.create(null),
        { length: QuickSorter.defaultLength },
        options
      )
    );
  }

  step(): void {
    this.active.length = 0;

    switch (this.state) {
      case State.outloopP1:
        {
          this.active.push(this.high, this.low, this.pivot);
          this.pivot = this.data[this.high];
          this.p = this.low - 1;
          this.j = this.low;
          this.state = State.inloop;
        }
        break;

      case State.inloop:
        {
          this.active.push(this.p, this.j);
          if (this.data[this.j] < this.pivot) {
            this.p++;
            this.swap(this.j, this.p);
          }
          this.j++;
          if (this.j === this.high) {
            this.state = State.outloopP2;
          }
        }
        break;

      case State.outloopP2:
        {
          this.active.push(this.p, this.high, this.low);
          this.p++;
          this.swap(this.p, this.high);

          if (this.p - 1 > this.low) {
            this.stack.push(this.low, this.p - 1);
          }
          if (this.p + 1 < this.high) {
            this.stack.push(this.p + 1, this.high);
          }
          if (this.stack.length == 0) {
            this.state = State.done;
            console.log(this.stack.length);
          } else {
            this.high = this.stack.pop() as number;
            this.low = this.stack.pop() as number;
            this.state = State.outloopP1;
          }
        }
        break;

      case State.done: {
        this.active.length = 0;
        this.done = true;
      }
    }
  }

  reset(): void {
    this.low = 0;
    this.high = this.data.length - 1;
    this.stack = [];
    this.pivot = 0;
    this.p = 0;
    this.j = 0;
    this.state = State.outloopP1;
    this.done = false;
    this.randomize();
  }
}

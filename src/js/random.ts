class Random {
  private state: number;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
    this.state = this.seed;
  }

  next() {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  }

  random() {
    return this.next() / 4294967296;
  }

  setSeed(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  getSeed() {
    return this.seed;
  }
}

export { Random };

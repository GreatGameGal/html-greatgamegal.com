class Random {
  private localSeed: number;
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 2147483647);
    this.localSeed = this.seed;
  }

  random() {
    this.localSeed |= 0;
    this.localSeed = (this.localSeed + 0x6d2b79f5) | 0;
    let t = Math.imul(
      this.localSeed ^ (this.localSeed >>> 15),
      1 | this.localSeed
    );
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  setSeed(seed: number) {
    this.seed = seed;
    this.localSeed = seed;
  }

  getSeed() {
    return this.seed;
  }
}

export { Random };

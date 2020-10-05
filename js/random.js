class Random {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random()*2147483647);
  }

  random() {
    this.localSeed |= 0;
    this.localSeed = this.localSeed + 0x6D2B79F5 | 0;
    let t = Math.imul(this.localSeed ^ this.localSeed >>> 15, 1 | this.localSeed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t^t >>> 14) >>> 0) / 4294967296;
  }

  setSeed(seed) {
    this.seed = seed;
  }

  set seed (val) {
    this.seed_ = val;
    this.localSeed = val;
  }

  get seed () {
    return this.seed_;
  }
}

export { Random };

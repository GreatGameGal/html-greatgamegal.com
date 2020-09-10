class Random {
  constructor(seed) {
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

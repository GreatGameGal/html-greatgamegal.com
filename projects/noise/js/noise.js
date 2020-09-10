const permutation = [];

class Noise {
  constructor(seed) {
    this.seed = seed;
  }

  static createPermutation (size=256) {
    let perm = Array(size);
    for (let i=0;i<size;i++) {
      let val = Math.floor(Math.random() * 256);
      while(perm.includes(val)) {
        val = Math.floor(Math.random() * 256);
      }
      perm[i] = val;
    }
    return perm;
  }
}

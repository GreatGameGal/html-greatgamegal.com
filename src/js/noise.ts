import { Random } from "./random.js";

class Noise {
  private random: Random;
  permutation: Int8Array;

  constructor(seed = 0) {
    this.random = new Random(seed) || Math.random;
    this.setSeed(seed);
    this.permutation = Noise.createPermutation(256, this.random);
  }

  setSeed(seed: number) {
    this.random.setSeed(seed);
  }

  getSeed() {
    return this.random.getSeed();
  }

  perlinOctave(
    x: number,
    y: number,
    z: number,
    octaves: number,
    persistence: number
  ) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total +=
        this.perlin(x * frequency, y * frequency, z * frequency) * amplitude;

      maxVal += amplitude;

      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxVal;
  }

  perlin(x = 0, y = 0, z = 0) {
    const xi = Math.floor(x) & 255,
      yi = Math.floor(y) & 255,
      zi = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x),
      v = this.fade(y),
      w = this.fade(z);

    const p = this.permutation;
    const aaa = p[p[p[xi] + yi] + zi],
      aba = p[p[p[xi] + yi + 1] + zi],
      aab = p[p[p[xi] + yi] + zi + 1],
      abb = p[p[p[xi] + yi + 1] + zi + 1],
      baa = p[p[p[xi + 1] + yi] + zi],
      bba = p[p[p[xi + 1] + yi + 1] + zi],
      bab = p[p[p[xi + 1] + yi] + zi + 1],
      bbb = p[p[p[xi + 1] + yi + 1] + zi + 1];

    let x1 = this.lerp(this.grad(aaa, x, y, z), this.grad(baa, x - 1, y, z), u);
    let x2 = this.lerp(
      this.grad(aba, x, y - 1, z),
      this.grad(bba, x - 1, y - 1, z),
      u
    );
    const y1 = this.lerp(x1, x2, v);

    x1 = this.lerp(
      this.grad(aab, x, y, z - 1),
      this.grad(bab, x - 1, y, z - 1),
      u
    );
    x2 = this.lerp(
      this.grad(abb, x, y - 1, z - 1),
      this.grad(bbb, x - 1, y - 1, z - 1),
      u
    );
    const y2 = this.lerp(x1, x2, v);

    return (this.lerp(y1, y2, w) + 1) / 2;
  }

  lerp(a: number, b: number, x: number) {
    return a + x * (b - a);
  }

  grad(hash: number, x: number, y: number, z: number) {
    switch (hash & 0xf) {
      case 0x0:
        return x + y;
      case 0x1:
        return -x + y;
      case 0x2:
        return x - y;
      case 0x3:
        return -x - y;
      case 0x4:
        return x + z;
      case 0x5:
        return -x + z;
      case 0x6:
        return x - z;
      case 0x7:
        return -x - z;
      case 0x8:
        return y + z;
      case 0x9:
        return -y + z;
      case 0xa:
        return y - z;
      case 0xb:
        return -y - z;
      case 0xc:
        return y + x;
      case 0xd:
        return -y + z;
      case 0xe:
        return y - x;
      case 0xf:
        return -y - z;
      default:
        return 0; // never happens
    }
  }

  fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  static createPermutation(size = 256, randomBase: Math | Random = Math) {
    const perm = new Int8Array(size * 2);
    for (let i = 0; i < size; i++) {
      perm[i] = i;
    }
    // Shuffle
    for (let i = size; i > 0; i--) {
      const j = Math.floor(randomBase.random() * i);
      [[perm[i]], [perm[j]]] = [[perm[j]], [perm[i]]];
    }
    for (let i = size; i >= 0; i--) {
      perm[i + size] = perm[i];
    }
    return perm;
  }
}

export { Noise };

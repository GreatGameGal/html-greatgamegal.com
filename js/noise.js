import {Random} from "/js/random.js";


class Noise {
  constructor(seed = 0) {
    this.random = new Random(seed) || Math.random;
    this.seed_ = seed;
    this.permutation= Noise.createPermutation(256, this.random)
  }

  set seed (val) {
    this.random.seed = val;
  }

  get seed () {
    return this.random.seed;
  }

  perlinOctave(x, y, z, octaves, persistence) {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxVal = 0;
    for (let i = 0; i < octaves; i++) {
      total += 
        this.perlin(x * frequency, y * frequency, z * frequency) * amplitude
      ;

      maxVal += amplitude;

      amplitude *= persistence;
      frequency *= 2;
    }

    return total / maxVal;
  }

  perlin(x = 0, y = 0, z = 0) {
    let xi, yi, zi;
    xi = Math.floor(x) & 255;
    yi = Math.floor(y) & 255;
    zi = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    let u, v, w;
    u = this.fade(x);
    v = this.fade(y);
    w = this.fade(z);

    let p = this.permutation;
    let aaa, aba, aab, abb, baa, bba, bab, bbb;
    aaa = p[p[p[xi] + yi] + zi];
    aba = p[p[p[xi] + yi+1] + zi];
    aab = p[p[p[xi] + yi] + zi+1];
    abb = p[p[p[xi] + yi+1] + zi+1];
    baa = p[p[p[xi+1] + yi] + zi];
    bba = p[p[p[xi+1] + yi+1] + zi];
    bab = p[p[p[xi+1] + yi] + zi+1];
    bbb = p[p[p[xi+1] + yi+1] + zi+1];

    let x1, x2, y1, y2;
    x1 = this.lerp(this.grad(aaa, x, y, z), this.grad(baa, x - 1, y, z), u);
    x2 = this.lerp(
      this.grad(aba, x, y - 1, z),
      this.grad(bba, x - 1, y - 1, z),
      u
    );
    y1 = this.lerp(x1, x2, v);

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
    y2 = this.lerp(x1, x2, v);

    return (this.lerp(y1, y2, w) + 1) / 2;
  }

  lerp(a, b, x) {
    return a + x * (b - a);
  }

  grad(hash, x, y, z) {
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

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  static createPermutation(size = 256, randomBase=Math) {
    let perm = Array(size);
    for (let i = 0; i < size; i++) {
      let val = Math.floor(randomBase.random() * 256);
      while (perm.includes(val)) {
        val = Math.floor(randomBase.random() * 256);
      }
      perm[i] = val;
    }
    for (let i = perm.length; i >= 0; i--) {
      perm[i + 256] = perm[i];
    }
    return perm;
  }
}

export { Noise };

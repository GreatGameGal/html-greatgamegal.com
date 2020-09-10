import {Random} from "/js/random.js";

const Permutation = [
  151,
  160,
  137,
  91,
  90,
  15,
  131,
  13,
  201,
  95,
  96,
  53,
  194,
  233,
  7,
  225,
  140,
  36,
  103,
  30,
  69,
  142,
  8,
  99,
  37,
  240,
  21,
  10,
  23,
  190,
  6,
  148,
  247,
  120,
  234,
  75,
  0,
  26,
  197,
  62,
  94,
  252,
  219,
  203,
  117,
  35,
  11,
  32,
  57,
  177,
  33,
  88,
  237,
  149,
  56,
  87,
  174,
  20,
  125,
  136,
  171,
  168,
  68,
  175,
  74,
  165,
  71,
  134,
  139,
  48,
  27,
  166,
  77,
  146,
  158,
  231,
  83,
  111,
  229,
  122,
  60,
  211,
  133,
  230,
  220,
  105,
  92,
  41,
  55,
  46,
  245,
  40,
  244,
  102,
  143,
  54,
  65,
  25,
  63,
  161,
  1,
  216,
  80,
  73,
  209,
  76,
  132,
  187,
  208,
  89,
  18,
  169,
  200,
  196,
  135,
  130,
  116,
  188,
  159,
  86,
  164,
  100,
  109,
  198,
  173,
  186,
  3,
  64,
  52,
  217,
  226,
  250,
  124,
  123,
  5,
  202,
  38,
  147,
  118,
  126,
  255,
  82,
  85,
  212,
  207,
  206,
  59,
  227,
  47,
  16,
  58,
  17,
  182,
  189,
  28,
  42,
  223,
  183,
  170,
  213,
  119,
  248,
  152,
  2,
  44,
  154,
  163,
  70,
  221,
  153,
  101,
  155,
  167,
  43,
  172,
  9,
  129,
  22,
  39,
  253,
  19,
  98,
  108,
  110,
  79,
  113,
  224,
  232,
  178,
  185,
  112,
  104,
  218,
  246,
  97,
  228,
  251,
  34,
  242,
  193,
  238,
  210,
  144,
  12,
  191,
  179,
  162,
  241,
  81,
  51,
  145,
  235,
  249,
  14,
  239,
  107,
  49,
  192,
  214,
  31,
  181,
  199,
  106,
  157,
  184,
  84,
  204,
  176,
  115,
  121,
  50,
  45,
  127,
  4,
  150,
  254,
  138,
  236,
  205,
  93,
  222,
  114,
  67,
  29,
  24,
  72,
  243,
  141,
  128,
  195,
  78,
  66,
  215,
  61,
  156,
  180,
];
for (let i = Permutation.length; i >= 0; i--) {
  Permutation[i + 256] = Permutation[i];
}

class Noise {
  constructor(seed = 0) {
    this.random = new Random(seed);
    this.seed_ = seed
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

    let p = Permutation;
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

  static createPermutation(size = 256) {
    let perm = Array(size);
    for (let i = 0; i < size; i++) {
      let val = Math.floor(Math.random() * 256);
      while (perm.includes(val)) {
        val = Math.floor(Math.random() * 256);
      }
      perm[i] = val;
    }
    return perm;
  }
}

export { Noise };

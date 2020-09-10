import { Random } from "/js/random.js";
import { Noise } from "/js/noise.js";
import { map } from "/js/functions.js";

const contentDiv = document.getElementById("mainContent");
const canvas = document.getElementById("contentCanvas");
const ctx = canvas.getContext("2d");
const xValEl = document.getElementById("xVal");
const yValEl = document.getElementById("yVal");
const zValEl = document.getElementById("zVal");
const seedValEl = document.getElementById("seedVal");

class noiseRender {
  constructor(seed) {
    this.x_ = 0;
    this.y_ = 0;
    this.z_ = 1;
    this.seed_ = seed;
    this.noiseGen = new Noise(seed);
    this.redraw();
  }

  redraw() {
    if (this.redrawTimeout) {
      clearTimeout(this.redrawTimeout);
    }
    this.redrawTimeout = setTimeout(() => {
      const width = contentDiv.offsetWidth - 16;
      const height = contentDiv.offsetHeight * 0.85 - 16;
      const dim = width > height ? height : width;
      if (canvas.width != dim) {
        canvas.width = dim;
        canvas.height = dim;
      }
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let x = 0; x < dim; x++) {
        for (let y = 0; y < dim; y++) {
          let val = this.noiseGen.perlin(
            (x - dim / 2) / dim / this.z + this.x,
            (y - dim / 2) / dim / this.z + this.y,
            0
          );

          const index = (y * canvas.width + x) * 4;
          data[index] = val * 255;
          data[index + 1] = val * 255;
          data[index + 2] = val * 255;
          data[index + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }, 10);
  }

  set seed(val) {
    this.seed_ = val;
    seedValEl.value = val;
    this.noiseGen = new Noise(val);
    this.redraw();
  }
  set x(val) {
    this.x_ = val;
    xValEl.value = val;
    this.redraw();
  }
  set y(val) {
    this.y_ = val;
    yValEl.value = val;
    this.redraw();
  }
  set z(val) {
    this.z_ = val;
    zValEl.value = val;
    this.redraw();
  }

  get seed() {
    return this.seed_;
  }
  get x() {
    return this.x_;
  }
  get y() {
    return this.y_;
  }
  get z() {
    return this.z_;
  }
}

window.addEventListener("load", () => {
  window.renderer = new noiseRender();

  xValEl.addEventListener("change", () => {
    renderer.x = parseFloat(xValEl.value) || 0;
  });

  yValEl.addEventListener("change", () => {
    renderer.y = parseFloat(yValEl.value) || 0;
  });

  zValEl.addEventListener("change", () => {
    renderer.z = parseFloat(zValEl.value) || 1;
  });

  seedValEl.addEventListener("change", () => {
    renderer.seed = parseFloat(seedValEl.value) || 0;
  });

  canvas.addEventListener("mousedown", (downEvent) => {
    const rect = downEvent.target.getBoundingClientRect();
    let lastX = downEvent.pageX - rect.left;
    let lastY = downEvent.pageY - rect.top;
    const mouseUpdate = (moveEvent) => {
      const relX = moveEvent.pageX - rect.left;
      const relY = moveEvent.pageY - rect.top;

      renderer.x +=
        map(lastX - relX, -canvas.width, canvas.width, -1, 1) / renderer.z;
      renderer.y +=
        map(lastY - relY, -canvas.height, canvas.height, -1, 1) / renderer.z;

      xValEl.value = renderer.x;
      yValEl.value = renderer.y;

      lastX = relX;
      lastY = relY;
    };
    downEvent.target.addEventListener("mousemove", mouseUpdate);
    addEventListener(
      "mouseup",
      (e) => {
        downEvent.target.removeEventListener("mousemove", mouseUpdate);
      },
      { once: true }
    );
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      renderer.z += renderer.z * 0.25;
    } else if (e.deltaY > 0) {
      renderer.z -= renderer.z * 0.25;
    }

    if (renderer.z == 0) renderer.z = 1;
  });

  window.addEventListener("resize", () => {
    renderer.redraw();
  });
});

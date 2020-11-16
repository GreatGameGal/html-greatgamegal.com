import { map } from "/js/functions.js";

const contentDiv = document.getElementById("mainContent");
const canvas = document.getElementById("mandelbrotCanvas");
const xValEl = document.getElementById("xVal");
const yValEl = document.getElementById("yVal");
const zoomValEl = document.getElementById("zoomVal");
const iterationsValEl = document.getElementById("iterationsVal");
const limitValEl = document.getElementById("limitVal");
const resetButtonEl = document.getElementById("reset");

const ctx = canvas.getContext("2d", { alpha: false });

const settingSaving =
  localStorage.prefs &&
  JSON.parse(localStorage.prefs)["storage"]["mandelbrotStorage"];

const defaults = {
  iterations: 200,
  x: 0,
  y: 0,
  z: 1,
  limit: 2,
};

class Mandelbrot {
  constructor(defaultScale = 3) {
    if (settingSaving && localStorage.mandelbrotStorage) {
      let data = JSON.parse(localStorage.mandelbrotStorage);
      this.iterations_ = data.iterations || defaults.iterations;
      iterationsValEl.value = this.iterations;
      this.limit_ = data.limit || defaults.limit;
      limitValEl.value = this.limit;
      this.z_ = data.zoom || defaults.z;
      zoomValEl.value = this.z;
      this.x_ = data.x || defaults.x;
      xValEl.value = this.x;
      this.y_ = data.y || defaults.y;
      yValEl.value = this.y;
    } else {
      this.iterations_ = defaults.iterations;
      this.limit_ = defaults.limit;
      this.z_ = defaults.z;
      this.x_ = defaults.x;
      this.y_ = defaults.y;
    }
    if (settingSaving) {
      setInterval(() => {
        localStorage.setItem(
          "mandelbrotStorage",
          JSON.stringify({
            iterations: this.iterations,
            limit: this.limit,
            zoom: this.z,
            x: this.x,
            y: this.y,
          })
        );
      }, 1000);
    }
    this.defaultScale = defaultScale;
  }

  mandelbrotCalc(x0, y0) {
    let y1 = 0;
    let x1 = 0;
    let x2 = 0;
    let y2 = 0;
    let w = 0;
    for (let i = 0; i < this.iterations + 1; i++) {
      x1 = x2 - y2 + x0;
      y1 = w - x2 - y2 + y0;
      x2 = x1 * x1;
      y2 = y1 * y1;
      w = (x1 + y1) * (x1 + y1);
      if (Math.abs(x1 + y1) > this.limit) return i - 1;
    }
    return this.iterations;
  }

  reset() {
    this.iterations_ = defaults.iterations;
    iterationsValEl.value = this.iterations_;
    this.limit_ = defaults.limit;
    limitValEl.value = this.limit_;
    this.z_ = defaults.z;
    zoomValEl.value = this.z_;
    this.x_ = defaults.x;
    xValEl.value = this.x_;
    this.y_ = defaults.y;
    yValEl.value = this.y_;
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

      for (let x = 0; x < canvas.width; x++) {
        for (let y = 0; y < canvas.height; y++) {
          const a =
            map(
              x,
              0,
              canvas.width,
              -this.defaultScale / this.z,
              this.defaultScale / this.z
            ) + this.x;
          const b =
            map(
              y,
              0,
              canvas.width,
              -this.defaultScale / this.z,
              this.defaultScale / this.z
            ) + this.y;
          const mandelbrotVal = this.mandelbrotCalc(a, b);
          const mappedMandelVal = map(
            mandelbrotVal,
            0,
            this.iterations,
            0,
            255
          );
          const index = (y * canvas.width + x) * 4;

          data[index] = mappedMandelVal % 255;
          data[index + 1] = mappedMandelVal % 255;
          data[index + 2] = mappedMandelVal % 255;
          data[index + 3] = 255;
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }, 10);
  }

  set limit(val) {
    this.limit_ = val;
    this.redraw();
  }

  get limit() {
    return this.limit_;
  }

  set iterations(val) {
    this.iterations_ = val;
    this.redraw();
  }

  get iterations() {
    return this.iterations_;
  }

  set x(val) {
    this.x_ = val;
    this.redraw();
  }

  set y(val) {
    this.y_ = val;
    this.redraw();
  }

  set z(val) {
    this.z_ = val;
    this.redraw();
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
  if (!settingSaving) resetButtonEl.style.display = "none";

  window.renderer = new Mandelbrot();

  resetButtonEl.addEventListener("click", (e) => {
    renderer.reset();
  });
  xValEl.addEventListener("change", () => {
    renderer.x = parseFloat(xValEl.value) || defaults.x;
  });

  yValEl.addEventListener("change", () => {
    renderer.y = parseFloat(yValEl.value) || defaults.y;
  });

  zoomValEl.addEventListener("change", () => {
    renderer.z = parseFloat(zoomValEl.value) || defaults.z;
  });

  iterationsValEl.addEventListener("change", () => {
    renderer.iterations =
      parseFloat(iterationsValEl.value) || defaults.iterations;
  });

  limitValEl.addEventListener("change", () => {
    renderer.limit = parseFloat(limitValEl.value) || defaults.limit;
  });

  window.addEventListener("mousemove", (e) => {
    window.mouseX = e.pageX;
    window.mouseY = e.pageY;
  });

  canvas.addEventListener("mousedown", (downEvent) => {
    const rect = downEvent.target.getBoundingClientRect();
    let lastX = downEvent.offsetX;
    let lastY = downEvent.offsetY;
    const mouseUpdate = (moveEvent) => {
      renderer.x +=
        map(
          lastX - moveEvent.offsetX,
          -canvas.width,
          canvas.width,
          -renderer.defaultScale,
          renderer.defaultScale
        ) / renderer.z;
      renderer.y +=
        map(
          lastY - moveEvent.offsetY,
          -canvas.height,
          canvas.height,
          -renderer.defaultScale,
          renderer.defaultScale
        ) / renderer.z;

      xValEl.value = renderer.x;
      yValEl.value = renderer.y;

      lastX = moveEvent.offsetX;
      lastY = moveEvent.offsetY;
    };
    downEvent.target.addEventListener("mousemove", mouseUpdate);
    document.addEventListener(
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
      if (renderer.z >= 1) {
        renderer.x +=
          (((e.offsetX - canvas.width / 2) / canvas.width) * 2) / renderer.z ||
          0;
        renderer.y +=
          (((e.offsetY - canvas.height / 2) / canvas.height) * 2) /
            renderer.z || 0;

        xValEl.value = renderer.x;
        yValEl.value = renderer.y;
      }

      renderer.z += renderer.z * 0.25;
    } else if (e.deltaY > 0) {
      renderer.z -= renderer.z * 0.25;
    }

    if (renderer.z == 0) renderer.z = 1;
    zoomValEl.value = renderer.z;
  });

  window.addEventListener("resize", () => {
    renderer.redraw();
  });

  renderer.redraw();
});

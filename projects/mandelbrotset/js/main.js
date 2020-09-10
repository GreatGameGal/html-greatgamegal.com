import { map } from "/js/functions.js";

const contentDiv = document.getElementById("mainContent");
const canvas = document.getElementById("mandelbrotCanvas");
const xValEl = document.getElementById("xVal");
const yValEl = document.getElementById("yVal");
const zoomValEl = document.getElementById("zoomVal");
const iterationsValEl = document.getElementById("iterationsVal");
const limitValEl = document.getElementById("limitVal");
const resetButtonEl = document.getElementById("reset");

const ctx = canvas.getContext("2d");

const settingSaving = localStorage.prefs && JSON.parse(localStorage.prefs)["storage"][
  "mandelbrotStorage"
];

class Mandelbrot {
  constructor(defaultScale = 3) {
    if (settingSaving && localStorage.mandelbrotStorage) {
      let data = JSON.parse(localStorage.mandelbrotStorage);
      this.iterations_ = data.iterations || 100;
      iterationsValEl.value = this.iterations;
      this.limit_ = data.limit || 8;
      limitValEl.value = this.limit;
      this.zoomVal_ = data.zoom || 1;
      zoomValEl.value = this.zoomVal;
      this.xVal_ = data.x || 0;
      xValEl.value = this.xVal;
      this.yVal_ = data.y || 0;
      yValEl.value = this.yVal;
    } else {
      this.iterations_ = 100;
      this.limit_ = 8;
      this.zoomVal_ = 1;
      this.xVal_ = 0;
      this.yVal_ = 0;
    }
    if (settingSaving) {
      setInterval(() => {
        localStorage.setItem(
          "mandelbrotStorage",
          JSON.stringify({
            iterations: this.iterations,
            limit: this.limit,
            zoom: this.zoomVal,
            x: this.xVal,
            y: this.yVal,
          })
        );
      }, 1000);
    }
    this.defaultScale = defaultScale;
  }

  mandelbrotCalc(ca, cb) {
    let a = ca;
    let b = cb;
    for (let i = 0; i < this.iterations; i++) {
      const tempA = a * a - b * b + ca;
      b = 2 * a * b + cb;
      a = tempA;
      if (Math.abs(a + b) > this.limit) return i;
    }
    return this.iterations;
  }

  reset() {
    this.iterations_ = 100;
    this.limit_ = 8;
    this.zoomVal_ = 1;
    this.xVal_ = 0;
    this.yVal_ = 0;
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
              -this.defaultScale / this.zoomVal,
              this.defaultScale / this.zoomVal
            ) + this.xVal;
          const b =
            map(
              y,
              0,
              canvas.width,
              -this.defaultScale / this.zoomVal,
              this.defaultScale / this.zoomVal
            ) + this.yVal;
          const mandelbrotVal = this.mandelbrotCalc(a, b);
          const mappedMandelVal = map(
            mandelbrotVal,
            0,
            this.iterations,
            0,
            255
          );
          const index = (y * canvas.width + x) * 4;

          data[index] = mappedMandelVal;
          data[index + 1] = mappedMandelVal;
          data[index + 2] = mappedMandelVal;
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

  set xVal(val) {
    this.xVal_ = val;
    this.redraw();
  }

  set yVal(val) {
    this.yVal_ = val;
    this.redraw();
  }

  set zoomVal(val) {
    this.zoomVal_ = val;
    this.redraw();
  }

  get xVal() {
    return this.xVal_;
  }

  get yVal() {
    return this.yVal_;
  }

  get zoomVal() {
    return this.zoomVal_;
  }
}

window.addEventListener("load", () => {
  if (!settingSaving) resetButtonEl.style.display = "none";

  window.renderer = new Mandelbrot();

  resetButtonEl.addEventListener("click", (e) => {
    renderer.reset();
  });
  xValEl.addEventListener("change", () => {
    renderer.xVal = parseFloat(xValEl.value) || 0;
  });

  yValEl.addEventListener("change", () => {
    renderer.yVal = parseFloat(yValEl.value) || 0;
  });

  zoomValEl.addEventListener("change", () => {
    renderer.zoomVal = parseFloat(zoomValEl.value) || 1;
  });

  iterationsValEl.addEventListener("change", () => {
    renderer.iterations = parseFloat(iterationsValEl.value) || 100;
  });

  limitValEl.addEventListener("change", () => {
    renderer.limit = parseFloat(limitValEl.value) || 16;
  });

  window.addEventListener("mousemove", (e) => {
    window.mouseX = e.pageX;
    window.mouseY = e.pageY;
  });

  canvas.addEventListener("mousedown", (downEvent) => {
    const rect = downEvent.target.getBoundingClientRect();
    let lastX = downEvent.pageX - rect.left;
    let lastY = downEvent.pageY - rect.top;
    const mouseUpdate = (moveEvent) => {
      const relX = moveEvent.pageX - rect.left;
      const relY = moveEvent.pageY - rect.top;

      renderer.xVal +=
        map(
          lastX - relX,
          -canvas.width,
          canvas.width,
          -renderer.defaultScale,
          renderer.defaultScale
        ) / renderer.zoomVal;
      renderer.yVal +=
        map(
          lastY - relY,
          -canvas.height,
          canvas.height,
          -renderer.defaultScale,
          renderer.defaultScale
        ) / renderer.zoomVal;

      xValEl.value = renderer.xVal;
      yValEl.value = renderer.yVal;

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
    const rect = e.target.getBoundingClientRect();
    const relX = mouseX - rect.left;
    const relY = mouseY - rect.top;

    if (e.deltaY < 0) {
      if (renderer.zoomVal >= 1) {
        renderer.xVal +=
          (((relX - canvas.width / 2) / canvas.width) * 2) /
            renderer.zoomVal || 0;
        renderer.yVal +=
          (((relY - canvas.height / 2) / canvas.height) * 2) /
            renderer.zoomVal || 0;

        xValEl.value = renderer.xVal;
        yValEl.value = renderer.yVal;
      }

      renderer.zoomVal += renderer.zoomVal * 0.25;
    } else if (e.deltaY > 0) {
      renderer.zoomVal -= renderer.zoomVal * 0.25;
    }

    if (renderer.zoomVal == 0) renderer.zoomVal = 1;
    zoomValEl.value = renderer.zoomVal;
  });

  window.addEventListener("resize", () => {
    renderer.redraw();
  });

  renderer.redraw();
});

import { map } from "../../../js/functions.js";

const canvas = <HTMLCanvasElement>document.getElementById("mandelbrotCanvas");
const xValEl = <HTMLInputElement>document.getElementById("xVal");
const yValEl = <HTMLInputElement>document.getElementById("yVal");
const zoomValEl = <HTMLInputElement>document.getElementById("zoomVal");
const iterationsValEl = <HTMLInputElement>(
  document.getElementById("iterationsVal")
);
const limitValEl = <HTMLInputElement>document.getElementById("limitVal");
const resetButtonEl = <HTMLButtonElement>document.getElementById("reset");

const ctx = <CanvasRenderingContext2D>canvas.getContext("2d", { alpha: false });

const settingSaving =
  localStorage.prefs !== undefined &&
  JSON.parse(localStorage.prefs)["storage"]["mandelbrotStorage"];

const defaults = {
  iterations: 200,
  x: 0,
  y: 0,
  z: 1,
  limit: 2,
};

if (
  canvas != null &&
  xValEl != null &&
  yValEl != null &&
  zoomValEl != null &&
  iterationsValEl != null &&
  limitValEl != null &&
  resetButtonEl != null &&
  ctx != null
) {
  class Mandelbrot {
    data: Float64Array;
    defaultScale: number;
    redrawTimeout: number | null;

    constructor(defaultScale = 3) {
      this.data = new Float64Array(5);
      this.redrawTimeout = null;

      if (settingSaving && localStorage.mandelbrotStorage !== undefined) {
        const data = JSON.parse(localStorage.mandelbrotStorage);
        this.data[0] = data.iterations || defaults.iterations;
        iterationsValEl.value = this.getIterations().toString();
        this.data[1] = data.limit || defaults.limit;
        limitValEl.value = this.getLimit().toString();
        this.data[2] = data.x || defaults.x;
        xValEl.value = this.getX().toString();
        this.data[3] = data.y || defaults.y;
        yValEl.value = this.getY().toString();
        this.data[4] = data.zoom || defaults.z;
        zoomValEl.value = this.getZ().toString();
      } else {
        this.data[0] = defaults.iterations;
        this.data[1] = defaults.limit;
        this.data[2] = defaults.x;
        this.data[3] = defaults.y;
        this.data[4] = defaults.z;
      }
      if (settingSaving) {
        setInterval(() => {
          localStorage.setItem(
            "mandelbrotStorage",
            JSON.stringify({
              iterations: this.getIterations(),
              limit: this.getLimit(),
              x: this.getX(),
              y: this.getY(),
              zoom: this.getZ(),
            })
          );
        }, 1000);
      }
      this.defaultScale = defaultScale;
    }

    mandelbrotCalc(x0: number, y0: number) {
      let y1 = 0;
      let x1 = 0;
      let x2 = 0;
      let y2 = 0;
      let w = 0;
      for (let i = 0; i < this.getIterations() + 1; i++) {
        x1 = x2 - y2 + x0;
        y1 = w - x2 - y2 + y0;
        x2 = x1 * x1;
        y2 = y1 * y1;
        w = (x1 + y1) * (x1 + y1);
        if (Math.abs(x1 + y1) > this.getLimit()) return i - 1;
      }
      return this.getIterations();
    }

    reset() {
      // Sets iterations
      this.data[0] = defaults.iterations;
      iterationsValEl.value = this.getIterations().toString();

      // Sets limit
      this.data[1] = defaults.limit;
      limitValEl.value = this.getLimit().toString();

      // Sets x
      this.data[2] = defaults.x;
      xValEl.value = this.getX().toString();

      // Sets y
      this.data[3] = defaults.y;
      yValEl.value = this.getY().toString();

      // Sets z
      this.data[4] = defaults.z;
      zoomValEl.value = this.getZ().toString();

      this.redraw();
    }

    redraw() {
      if (this.redrawTimeout != null) {
        clearTimeout(this.redrawTimeout);
      }
      this.redrawTimeout = setTimeout(() => {
        const parentNode = <HTMLDivElement>canvas.parentNode;
        if (parentNode == null) return;
        const width = parentNode.offsetWidth - 16;
        const height = parentNode.offsetHeight * 0.85 - 16;
        const dim = width > height ? height : width;
        if (canvas.width != dim) {
          canvas.width = dim;
          canvas.height = dim;
        }
        if (ctx == null) return;
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let x = 0; x < canvas.width; x++) {
          for (let y = 0; y < canvas.height; y++) {
            const a =
              map(
                x,
                0,
                canvas.width,
                -this.defaultScale / this.getZ(),
                this.defaultScale / this.getZ()
              ) + this.getX();
            const b =
              map(
                y,
                0,
                canvas.width,
                -this.defaultScale / this.getZ(),
                this.defaultScale / this.getZ()
              ) + this.getY();
            const mandelbrotVal = this.mandelbrotCalc(a, b);
            const mappedMandelVal = map(
              mandelbrotVal,
              0,
              this.getIterations(),
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
        this.redrawTimeout = null;
      }, 10);
    }

    setIterations(iterations: number) {
      this.data[0] = iterations;
      this.redraw();
    }

    getIterations() {
      return this.data[0];
    }

    setLimit(limit: number) {
      this.data[1] = limit;
      this.redraw();
    }

    getLimit() {
      return this.data[1];
    }

    setX(x: number) {
      this.data[2] = x;
      this.redraw();
    }

    getX() {
      return this.data[2];
    }

    setY(y: number) {
      this.data[3] = y;
      this.redraw();
    }

    getY() {
      return this.data[3];
    }

    setZ(z: number) {
      this.data[4] = z;
      this.redraw();
    }

    getZ() {
      return this.data[4];
    }
  }

  window.addEventListener("load", () => {
    if (!settingSaving) resetButtonEl.style.display = "none";

    const renderer = new Mandelbrot();

    resetButtonEl.addEventListener("click", () => {
      renderer.reset();
    });
    xValEl.addEventListener("change", () => {
      renderer.setX(parseFloat(xValEl.value) || defaults.x);
    });

    yValEl.addEventListener("change", () => {
      renderer.setY(parseFloat(yValEl.value) || defaults.y);
    });

    zoomValEl.addEventListener("change", () => {
      renderer.setZ(parseFloat(zoomValEl.value) || defaults.z);
    });

    iterationsValEl.addEventListener("change", () => {
      renderer.setIterations(
        parseFloat(iterationsValEl.value) || defaults.iterations
      );
    });

    limitValEl.addEventListener("change", () => {
      renderer.setLimit(parseFloat(limitValEl.value) || defaults.limit);
    });

    canvas.addEventListener("mousedown", (downEvent: MouseEvent) => {
      if (downEvent.button != 1) return;
      const downEventTarget = downEvent.target;
      if (downEventTarget == null) return;
      let lastX = downEvent.offsetX;
      let lastY = downEvent.offsetY;
      const mouseUpdate = (moveEvent: MouseEvent) => {
        renderer.setX(
          renderer.getX() +
            map(
              lastX - moveEvent.offsetX,
              -canvas.width,
              canvas.width,
              -renderer.defaultScale,
              renderer.defaultScale
            ) /
              renderer.getZ()
        );
        renderer.setY(
          renderer.getY() +
            map(
              lastY - moveEvent.offsetY,
              -canvas.height,
              canvas.height,
              -renderer.defaultScale,
              renderer.defaultScale
            ) /
              renderer.getZ()
        );

        xValEl.value = renderer.getX().toString();
        yValEl.value = renderer.getY().toString();

        lastX = moveEvent.offsetX;
        lastY = moveEvent.offsetY;
      };
      downEventTarget.addEventListener("mousemove", <EventListener>mouseUpdate);
      document.addEventListener(
        "mouseup",
        () => {
          downEventTarget.removeEventListener(
            "mousemove",
            <EventListener>mouseUpdate
          );
        },
        { once: true }
      );
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        if (renderer.getZ() >= 1) {
          renderer.setX(
            renderer.getX() +
              (((e.offsetX - canvas.width / 2) / canvas.width) * 2) /
                renderer.getZ() || 0
          );
          renderer.setY(
            renderer.getY() +
              (((e.offsetY - canvas.height / 2) / canvas.height) * 2) /
                renderer.getZ() || 0
          );

          xValEl.value = renderer.getX().toString();
          yValEl.value = renderer.getY().toString();
        }

        renderer.setZ(renderer.getZ() * 1.25);
      } else if (e.deltaY > 0) {
        renderer.setZ(renderer.getZ() * 0.75);
      }

      if (renderer.getZ() === 0) renderer.setZ(1);
      zoomValEl.value = renderer.getZ().toString();
    });

    window.addEventListener("resize", () => {
      renderer.redraw();
    });

    renderer.redraw();
  });
}

import { map } from "../../../js/functions.js";

const settingSaving =
  localStorage.prefs !== undefined &&
  JSON.parse(localStorage.prefs)["storage"]["mandelbrotStorage"];

const defaults = {
  iterations: 200,
  x: -0.5,
  y: 0,
  z: 1,
  limit: 2,
};

const DEFAULT_SCALE = 3;
const RESOLUTION = 512;

const imageData = new ImageData(RESOLUTION, RESOLUTION);

const resize = (canvas: HTMLCanvasElement) => {
  const parentNode = canvas.parentElement;
  if (!parentNode) {
    return;
  }
  const width = parentNode.offsetWidth - 16;
  const height = parentNode.offsetHeight * 0.85 - 16;
  const dim = Math.floor(Math.min(width, height));
  console.log(width, height, dim);
  canvas.style.width = `${dim}px`;
  canvas.style.height = `${dim}px`;

};

class Mandelbrot {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  xEl?: HTMLInputElement;
  yEl?: HTMLInputElement;
  zoomEl?: HTMLInputElement;
  iterationsEl?: HTMLInputElement;
  limitEl?: HTMLInputElement;
  resetEl?: HTMLButtonElement;
  data: Float64Array;
  redrawTimeout: number | null;

  constructor ({
    ctx, xEl, yEl, zoomEl, iterationsEl, limitEl, resetEl,
  }: {
      ctx?: CanvasRenderingContext2D,
      xEl?: HTMLInputElement,
      yEl?: HTMLInputElement,
      zoomEl?: HTMLInputElement,
      iterationsEl?: HTMLInputElement,
      limitEl?: HTMLInputElement,
      resetEl?: HTMLButtonElement,
    }) {
    if (!ctx) {
      throw new Error("Context not provided. HTML5 Canvas may not be supported.");
    }
    this.canvas = ctx.canvas;
    this.ctx = ctx;
    this.xEl = xEl;
    this.yEl = yEl;
    this.zoomEl = zoomEl;
    this.iterationsEl = iterationsEl;
    this.limitEl = limitEl;
    this.resetEl = resetEl;

    this.canvas.width = RESOLUTION;
    this.canvas.height = RESOLUTION;
    resize(this.canvas);

    this.data = new Float64Array(5);
    this.redrawTimeout = null;


    if (settingSaving && localStorage.mandelbrotStorage !== undefined) {
      const data = JSON.parse(localStorage.mandelbrotStorage);
      this.data[0] = data.iterations || defaults.iterations;
      if (this.iterationsEl) {
        this.iterationsEl.value = this.getIterations().toString();
      }
      this.data[1] = data.limit || defaults.limit;
      if (this.limitEl) {
        this.limitEl.value = this.getLimit().toString();
      }
      this.data[2] = data.x || defaults.x;
      if (this.xEl) {
        this.xEl.value = this.getX().toString();
      }
      this.data[3] = data.y || defaults.y;
      if (this.yEl) {
        this.yEl.value = this.getY().toString();
      }
      this.data[4] = data.zoom || defaults.z;
      if (this.zoomEl) {
        this.zoomEl.value = this.getZ().toString();
      }
    } else {
      this.data[0] = defaults.iterations;
      this.data[1] = defaults.limit;
      this.data[2] = defaults.x;
      this.data[3] = defaults.y;
      this.data[4] = defaults.z;
    }

    // TODO: THIS IS DUMB, JUST WATCH FOR CHANGES LIKE I DO ELSEWHERE.
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

    this.setupDomListeners();
    this.redraw();
  }

  mandelbrotCalc (x0: number, y0: number) {
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
      if (Math.abs(x1 + y1) > this.getLimit()) {
        return i - 1;
      }
    }
    return this.getIterations();
  }

  reset () {
    // Sets iterations
    this.data[0] = defaults.iterations;
    if (this.iterationsEl) {
      this.iterationsEl.value = "";
    }

    // Sets limit
    this.data[1] = defaults.limit;
    if (this.limitEl) {
      this.limitEl.value = "";
    }

    // Sets x
    this.data[2] = defaults.x;
    if (this.xEl) {
      this.xEl.value = "";
    }

    // Sets y
    this.data[3] = defaults.y;
    if (this.yEl) {
      this.yEl.value = "";
    }

    // Sets z
    this.data[4] = defaults.z;
    if (this.zoomEl) {
      this.zoomEl.value = "";
    }

    this.redraw();
  }

  redraw () {
    if (this.redrawTimeout != null) {
      return;
    }

    this.redrawTimeout = window.setTimeout(() => {
      const data = imageData.data;

      for (let x = 0; x < RESOLUTION; x++) {
        for (let y = 0; y < RESOLUTION; y++) {
          const a =
              map(
                x,
                0,
                RESOLUTION,
                -DEFAULT_SCALE / this.getZ(),
                DEFAULT_SCALE / this.getZ()
              ) + this.getX();
          const b =
              map(
                y,
                0,
                RESOLUTION,
                -DEFAULT_SCALE / this.getZ(),
                DEFAULT_SCALE / this.getZ()
              ) + this.getY();
          const mandelbrotVal = this.mandelbrotCalc(a, b);
          const mappedMandelVal = map(
            mandelbrotVal,
            0,
            this.getIterations(),
            0,
            255
          );
          const index = (y * RESOLUTION + x) * 4;

          data[index] = mappedMandelVal % 255;
          data[index + 1] = mappedMandelVal % 255;
          data[index + 2] = mappedMandelVal % 255;
          data[index + 3] = 255;
        }
      }
      this.ctx.putImageData(imageData, 0, 0);
      this.redrawTimeout = null;
    }, 5);
  }

  setIterations (iterations: number) {
    this.data[0] = iterations;
    this.redraw();
  }

  getIterations () {
    return this.data[0];
  }

  setLimit (limit: number) {
    this.data[1] = limit;
    this.redraw();
  }

  getLimit () {
    return this.data[1];
  }

  setX (x: number) {
    this.data[2] = x;
    this.redraw();
  }

  getX () {
    return this.data[2];
  }

  setY (y: number) {
    this.data[3] = y;
    this.redraw();
  }

  getY () {
    return this.data[3];
  }

  setZ (z: number) {
    this.data[4] = z;
    this.redraw();
  }

  getZ () {
    return this.data[4];
  }


  setupDomListeners () {
    // This is being done to reduce needing to check whether or not certain things are null more.
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const renderer = this;

    if (this.resetEl != null) {
      this.resetEl.addEventListener("click", () => this.reset());
    }

    if (this.xEl != null) {
      this.xEl.addEventListener("change", function () {
        renderer.setX(parseFloat(this.value) || defaults.x);
      });
    }

    if (this.yEl != null) {
      this.yEl.addEventListener("change", function () {
        renderer.setY(parseFloat(this.value) || defaults.y);
      });
    }

    if (this.zoomEl != null) {
      this.zoomEl.addEventListener("change", function () {
        renderer.setZ(parseFloat(this.value) || defaults.z);
      });
    }

    if (this.iterationsEl != null) {
      this.iterationsEl.addEventListener("change", function () {
        renderer.setIterations(parseFloat(this.value) || defaults.iterations);
      });
    }

    if (this.limitEl != null) {
      this.limitEl.addEventListener("change", function () {
        renderer.setLimit(parseFloat(this.value) || defaults.limit);
      });
    }

    window.addEventListener("resize", () => {
      resize(this.canvas);
      this.redraw();
    });

    this.canvas.addEventListener("mousedown", (downEvent: MouseEvent) => {
      if (downEvent.button != 0) {
        return;
      }
      const downEventTarget = downEvent.target;
      if (downEventTarget == null) {
        return;
      }
      let lastX = downEvent.offsetX;
      let lastY = downEvent.offsetY;
      const mouseUpdate = (moveEvent: MouseEvent) => {
        const boundingCanvas = this.canvas.getBoundingClientRect();
        this.setX(this.getX() +
              map(
                lastX - moveEvent.offsetX,
                -boundingCanvas.width,
                boundingCanvas.width,
                -DEFAULT_SCALE,
                DEFAULT_SCALE
              ) /
                this.getZ());
        this.setY(this.getY() +
              map(
                lastY - moveEvent.offsetY,
                -boundingCanvas.height,
                boundingCanvas.height,
                -DEFAULT_SCALE,
                DEFAULT_SCALE
              ) /
                this.getZ());

        if (this.xEl != null) {
          this.xEl.value = this.getX().toString();
        }
        if (this.yEl != null) {
          this.yEl.value = this.getY().toString();
        }

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

    this.canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      const boundingCanvas = this.canvas.getBoundingClientRect();
      if (e.deltaY < 0) {
        if (renderer.getZ() >= 1) {
          renderer.setX(renderer.getX() +
                (e.offsetX - boundingCanvas.width / 2) / boundingCanvas.width * 2 /
                  renderer.getZ() || 0);
          renderer.setY(renderer.getY() +
                (e.offsetY - boundingCanvas.height / 2) / boundingCanvas.height * 2 /
                  renderer.getZ() || 0);

          if (this.xEl != null) {
            this.xEl.value = renderer.getX().toString();
          }
          if (this.yEl != null) {
            this.yEl.value = renderer.getY().toString();
          }
        }

        renderer.setZ(renderer.getZ() * 1.25);
      } else if (e.deltaY > 0) {
        renderer.setZ(renderer.getZ() * 0.75);
      }


      if (renderer.getZ() === 0) {
        renderer.setZ(1);
      }
      if (this.zoomEl != null) {
        this.zoomEl.value = renderer.getZ().toString();
      }
    });


  }
}

window.addEventListener("load", () => {
  const canvas = <HTMLCanvasElement>document.getElementById("mandelbrotCanvas");

  new Mandelbrot({
    ctx: <CanvasRenderingContext2D>canvas.getContext("2d"),
    xEl: <HTMLInputElement>document.getElementById("xVal"),
    yEl: <HTMLInputElement>document.getElementById("yVal"),
    zoomEl: <HTMLInputElement>document.getElementById("zoomVal"),
    iterationsEl: <HTMLInputElement>(document.getElementById("iterationsVal")),
    limitEl: <HTMLInputElement>document.getElementById("limitVal"),
    resetEl: <HTMLButtonElement>document.getElementById("reset"),
  });
});

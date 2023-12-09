import { map } from "../../../js/functions.js";

const settingSaving =
  localStorage.prefs !== undefined &&
  JSON.parse(localStorage.prefs)["storage"]["mandelbrotStorage"];

  enum Engine {
    JS = "js",
    Zig = "zig",
  }

const defaults = {
  iterations: 512,
  x: -0.5,
  y: 0,
  z: 1,
  limit: 3,
  engine: Engine.JS,
};

const DEFAULT_SCALE = 3;
const JS_RESOLUTION = 512;


const resize = (canvas: HTMLCanvasElement) => {
  const parentNode = canvas.parentElement;
  if (!parentNode) {
    return;
  }
  const width = parentNode.offsetWidth - 16;
  const height = parentNode.offsetHeight * 0.80 - 16;
  const dim = Math.floor(Math.min(width, height));
  canvas.style.width = `${dim}px`;
  canvas.style.height = `${dim}px`;

};

class Mandelbrot {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  instance?: WebAssembly.Instance;
  engine: Engine;
  engineEl?: HTMLSelectElement;
  xEl?: HTMLInputElement;
  yEl?: HTMLInputElement;
  zoomEl?: HTMLInputElement;
  iterationsEl?: HTMLInputElement;
  limitEl?: HTMLInputElement;
  resetEl?: HTMLButtonElement;

  _limit: Float64Array;
  _pos: Float64Array;
  _iter: Float64Array;
  image: ImageData;
  mem?: ArrayBuffer;
  memOffset?: number;
  animationFrame: number | null;


  constructor ({
    ctx, instance, engineEl, xEl, yEl, zoomEl, iterationsEl, limitEl, resetEl,
  }: {
      ctx?: CanvasRenderingContext2D,
      instance?: WebAssembly.Instance;
      engineEl?: HTMLSelectElement;
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
    this.instance = instance;
    this.engineEl = engineEl;
    this.xEl = xEl;
    this.yEl = yEl;
    this.zoomEl = zoomEl;
    this.iterationsEl = iterationsEl;
    this.limitEl = limitEl;
    this.resetEl = resetEl;

    if (instance != null) {
      this.mem = (<WebAssembly.Memory>instance.exports.memory).buffer;
      this.memOffset = (<WebAssembly.Global>instance.exports.mandelbrot).value;
      if (this.memOffset != null) {
        this._limit = new Float64Array(this.mem, this.memOffset, 1);
        this._pos = new Float64Array(this.mem, this.memOffset + 8, 3);
        this._iter = new Float64Array(this.mem, this.memOffset + 32, 1);
      }
    }
    this._limit ??= new Float64Array(1);
    this._pos ??= new Float64Array(3);
    this._iter ??= new Float64Array(1);

    resize(this.canvas);

    if (this.instance == null && this.engineEl != null) {
      this.engineEl.style.display = "none";
    }

    this.animationFrame = null;


    if (settingSaving && localStorage.mandelbrotStorage !== undefined) {
      const data = JSON.parse(localStorage.mandelbrotStorage);
      this.iterations = data.iterations || defaults.iterations;
      if (this.iterationsEl) {
        this.iterationsEl.value = this.iterations.toString();
      }
      this.limit = data.limit || defaults.limit;
      if (this.limitEl) {
        this.limitEl.value = this.limit.toString();
      }
      this.x = data.x || defaults.x;
      if (this.xEl) {
        this.xEl.value = this.x.toString();
      }
      this.y = data.y || defaults.y;
      if (this.yEl) {
        this.yEl.value = this.y.toString();
      }
      this.z = data.zoom || defaults.z;
      if (this.zoomEl) {
        this.zoomEl.value = this.z.toString();
      }
      this.engine = data.engine || defaults.engine;
      if (this.zoomEl) {
        this.zoomEl.value = this.z.toString();
      }
    } else {
      this.iterations = defaults.iterations;
      this.limit = defaults.limit;
      this.x = defaults.x;
      this.y = defaults.y;
      this.z = defaults.z;
      this.engine = defaults.engine;
    }

    if (this.engine == Engine.Zig && this.mem != null && this.instance != null && this.memOffset != null) {
      [ this.canvas.width, this.canvas.height ] = new Uint32Array(this.mem, (<WebAssembly.Global>this.instance.exports.DIMS).value, 2);
      this.image = new ImageData(new Uint8ClampedArray(this.mem, this.memOffset + 40, this.canvas.width * this.canvas.height * 4), this.canvas.width, this.canvas.height);
    } else if (this.engine == Engine.JS) {
      this.canvas.width = JS_RESOLUTION;
      this.canvas.height = JS_RESOLUTION;
      this.image = new ImageData(this.canvas.width, this.canvas.height);
      this.image.data.fill(255);
    }
    this.image ??= new ImageData(this.canvas.width, this.canvas.height);

    // TODO: THIS IS DUMB, JUST WATCH FOR CHANGES LIKE I DO ELSEWHERE.
    if (settingSaving) {
      setInterval(() => {
        localStorage.setItem(
          "mandelbrotStorage",
          JSON.stringify({
            iterations: this.iterations,
            limit: this.limit,
            x: this.x,
            y: this.y,
            zoom: this.z,
            eninge: this.engine,
          })
        );
      }, 1000);
    }

    this.setupDomListeners();
    this.redraw();
  }

  get limit () {
    return this._limit[0];
  }

  private set limit (val) {
    this._limit[0] = val;
  }

  get iterations () {
    return this._iter[0];
  }

  private set iterations (val) {
    this._iter[0] = val;
  }

  get x () {
    return this._pos[0];
  }

  private set x (val) {
    this._pos[0] = val;
  }

  get y () {
    return this._pos[1];
  }

  private set y (val) {
    this._pos[1] = val;
  }

  get z () {
    return this._pos[2];
  }

  private set z (val) {
    this._pos[2] = val;
  }

  mandelbrotCalc (x0: number, y0: number) {
    let x1 = x0;
    let y1 = y0;
    let x2 = x1 * x1;
    let y2 = y1 * y1;
    let x1y1 = x1 + y1;
    let w = x1y1 * x1y1;
    for (let i = 0; i < this.iterations; i++) {
      x1 = x2 - y2 + x0;
      y1 = w - x2 - y2 + y0;
      x2 = x1 * x1;
      y2 = y1 * y1;
      x1y1 = x1 + y1;
      w = x1y1 * x1y1;
      if (Math.abs(x1y1) > this.limit) {
        return i;
      }
    }
    return this.iterations;
  }

  reset () {
    // Sets iterations
    this.iterations = defaults.iterations;
    if (this.iterationsEl) {
      this.iterationsEl.value = "";
    }

    // Sets limit
    this.limit = defaults.limit;
    if (this.limitEl) {
      this.limitEl.value = "";
    }

    // Sets x
    this.x = defaults.x;
    if (this.xEl) {
      this.xEl.value = "";
    }

    // Sets y
    this.y = defaults.y;
    if (this.yEl) {
      this.yEl.value = "";
    }

    // Sets z
    this.z = defaults.z;
    if (this.zoomEl) {
      this.zoomEl.value = "";
    }

    this.redraw();
  }

  private drawImmediate () {
    const data = this.image.data;

    switch (this.engine) {


      case Engine.Zig: {
        if (this.instance != null && this.memOffset != null) {
          (<(self: number) => void> this.instance?.exports.render)(this.memOffset);
        }
      } break;

      case Engine.JS:
      default: {
        const zoom = DEFAULT_SCALE / this.z;
        const twoZoom = zoom * 2;
        for (let x = 0; x < this.canvas.width; x++) {
          for (let y = 0; y < this.canvas.height; y++) {
            const a = x / this.canvas.width * twoZoom - zoom + this.x;
            const b = y / this.canvas.height * twoZoom - zoom + this.y;
            const mandelbrotVal = this.mandelbrotCalc(a, b);
            const mappedMandelVal = mandelbrotVal / this.iterations * 255;
            const index = (y * this.canvas.width + x) * 4;

            data[index] = mappedMandelVal;
            data[index + 1] = mappedMandelVal;
            data[index + 2] = mappedMandelVal;
          }
        }
        this.ctx.putImageData(this.image, 0, 0);
      } break;
    }
    this.animationFrame = null;
  }

  redraw () {
    if (this.animationFrame != null) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => this.drawImmediate());
  }

  setIterations (iterations: number) {
    this.iterations = iterations;
    this.redraw();
  }

  setLimit (limit: number) {
    this.limit = limit;
    this.redraw();
  }

  setX (x: number) {
    this.x = x;
    this.redraw();
  }

  setY (y: number) {
    this.y = y;
    this.redraw();
  }

  setZ (z: number) {
    this.z = z;
    this.redraw();
  }

  setupDomListeners () {
    // This is being done to reduce needing to check whether or not certain things are null more.
    /* eslint-disable-next-line @typescript-eslint/no-this-alias */
    const renderer = this;


    if (this.resetEl != null) {
      this.resetEl.addEventListener("click", () => this.reset());
    }

    this.engineEl?.addEventListener("change", function () {
      switch (this.value) {
        case "zig": {
          renderer.engine = Engine.Zig;
          if (renderer.mem != null && renderer.instance != null && renderer.memOffset != null) {
            [ renderer.canvas.width, renderer.canvas.height ] = new Uint32Array(renderer.mem, (<WebAssembly.Global>renderer.instance.exports.DIMS).value, 2);
            renderer.image = new ImageData(new Uint8ClampedArray(renderer.mem, renderer.memOffset + 36, renderer.canvas.width * renderer.canvas.height * 4), renderer.canvas.width, renderer.canvas.height);
          }
        } break;

        case "js": {
          renderer.engine = Engine.JS;
          renderer.canvas.width = JS_RESOLUTION;
          renderer.canvas.height = JS_RESOLUTION;
          renderer.image = new ImageData(renderer.canvas.width, renderer.canvas.height);
          renderer.image.data.fill(255);
          resize(renderer.canvas);
        }
      }
      renderer.redraw();
    });

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
        this.setX(this.x +
              map(
                lastX - moveEvent.offsetX,
                -boundingCanvas.width,
                boundingCanvas.width,
                -DEFAULT_SCALE,
                DEFAULT_SCALE
              ) /
                this.z);
        this.setY(this.y +
              map(
                lastY - moveEvent.offsetY,
                -boundingCanvas.height,
                boundingCanvas.height,
                -DEFAULT_SCALE,
                DEFAULT_SCALE
              ) /
                this.z);

        if (this.xEl != null) {
          this.xEl.value = this.x.toString();
        }
        if (this.yEl != null) {
          this.yEl.value = this.y.toString();
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
        if (renderer.z >= 1) {
          renderer.setX(renderer.x +
                (e.offsetX - boundingCanvas.width / 2) / boundingCanvas.width * 2 /
                  renderer.z || 0);
          renderer.setY(renderer.y +
                (e.offsetY - boundingCanvas.height / 2) / boundingCanvas.height * 2 /
                  renderer.z || 0);

          if (this.xEl != null) {
            this.xEl.value = renderer.x.toString();
          }
          if (this.yEl != null) {
            this.yEl.value = renderer.y.toString();
          }
        }

        renderer.setZ(renderer.z * 1.25);
      } else if (e.deltaY > 0) {
        renderer.setZ(renderer.z * 0.75);
      }


      if (renderer.z === 0) {
        renderer.setZ(1);
      }
      if (this.zoomEl != null) {
        this.zoomEl.value = renderer.z.toString();
      }
    });


  }
}

window.addEventListener("load", async () => {
  const canvas = <HTMLCanvasElement>document.getElementById("mandelbrotCanvas");
  let instance;
  let renderer: Mandelbrot;
  try {
    instance = (await WebAssembly.instantiateStreaming(fetch("./wasm-mandelbrot.wasm"), {
      env: {
        draw: () => {
          renderer.ctx.putImageData(renderer.image, 0, 0);
        },
      },
    })).instance;
  } catch (err) {
    console.error(err);
  } finally {
    renderer = new Mandelbrot({
      ctx: <CanvasRenderingContext2D>canvas.getContext("2d"),
      instance,
      engineEl: <HTMLSelectElement>document.getElementById("engineEl"),
      xEl: <HTMLInputElement>document.getElementById("xVal"),
      yEl: <HTMLInputElement>document.getElementById("yVal"),
      zoomEl: <HTMLInputElement>document.getElementById("zoomVal"),
      iterationsEl: <HTMLInputElement>(document.getElementById("iterationsVal")),
      limitEl: <HTMLInputElement>document.getElementById("limitVal"),
      resetEl: <HTMLButtonElement>document.getElementById("reset"),
    });
  }

});

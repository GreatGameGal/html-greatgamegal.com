import { map } from "../../../js/functions.js";

const settingSaving =
  localStorage.prefs !== undefined &&
  JSON.parse(localStorage.prefs)["storage"]["mandelbrotStorage"];

enum Engine {
  JS = "js",
  Zig = "zig",
}

const zig_wasm_module = WebAssembly.compileStreaming(fetch("./wasm-mandelbrot.wasm"));

interface Settings {
  iterations: number;
  limit: number;
  x: number;
  y: number;
  z: number;
  engine: Engine;
}

interface MandelbrotBaseOptions extends Partial<Settings> {
  canvas: HTMLCanvasElement;
  ctx?: CanvasRenderingContext2D;
  engineEl?: HTMLSelectElement;
  xEl?: HTMLInputElement;
  yEl?: HTMLInputElement;
  zoomEl?: HTMLInputElement;
  iterationsEl?: HTMLInputElement;
  limitEl?: HTMLInputElement;
  resetEl?: HTMLButtonElement;
  x?: number;
  y?: number;
  z?: number;
  limit?: number;
  iterations?: number;
}

interface MandelbrotZigOptions extends MandelbrotBaseOptions {
  instance: WebAssembly.Instance;
}

const DEFAULT_SCALE = 3;
const JS_RESOLUTION = 512;

const defaults: Settings = {
  iterations: 512,
  x: -0.5,
  y: 0,
  z: 1,
  limit: 3,
  engine: Engine.JS,
};

const resize = (canvas: HTMLCanvasElement) => {
  const parentNode = canvas.parentElement;
  if (!parentNode) {
    return;
  }
  const width = parentNode.offsetWidth - 16;
  const height = parentNode.offsetHeight * 0.7 - 16;
  const dim = Math.floor(Math.min(width, height));
  canvas.style.width = `${dim}px`;
  canvas.style.height = `${dim}px`;
};

abstract class Mandelbrot {
  abstract engine: Engine;

  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
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
  animationFrame: number | null;

  constructor ({
    canvas,
    ctx,
    xEl,
    yEl,
    zoomEl,
    iterationsEl,
    limitEl,
    resetEl,
    x,
    y,
    z,
    limit,
    iterations,
  }: MandelbrotBaseOptions) {
    if (!ctx) {
      throw new Error("Context not provided. HTML5 Canvas may not be supported.");
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.xEl = xEl;
    this.yEl = yEl;
    this.zoomEl = zoomEl;
    this.iterationsEl = iterationsEl;
    this.limitEl = limitEl;
    this.resetEl = resetEl;

    this._limit ??= new Float64Array(1);
    this._pos ??= new Float64Array(3);
    this._iter ??= new Float64Array(1);

    this.x = x ?? defaults.x;
    this.y = y ?? defaults.y;
    this.z = z ?? defaults.z;
    this.limit = limit ?? defaults.limit;
    this.iterations = iterations ?? defaults.iterations;

    resize(this.canvas);

    this.animationFrame = null;

    if (this.iterationsEl && this.iterations != defaults.iterations) {
      this.iterationsEl.value = this.iterations.toString();
    }
    if (this.limitEl && this.limit != defaults.limit) {
      this.limitEl.value = this.limit.toString();
    }
    if (this.xEl && this.x != defaults.x) {
      this.xEl.value = this.x.toString();
    }
    if (this.yEl && this.y != defaults.y) {
      this.yEl.value = this.y.toString();
    }
    if (this.zoomEl && this.z != defaults.z) {
      this.zoomEl.value = this.z.toString();
    }

    this.canvas.width = JS_RESOLUTION;
    this.canvas.height = JS_RESOLUTION;
    this.image = new ImageData(this.canvas.width, this.canvas.height);
    this.image.data.fill(255);
    this.image ??= new ImageData(this.canvas.width, this.canvas.height);

    // TODO: THIS IS DUMB, JUST WATCH FOR CHANGES LIKE I DO ELSEWHERE.
    if (settingSaving) {
      setInterval(() => {
        const settings: Settings = {
          iterations: this.iterations,
          limit: this.limit,
          x: this.x,
          y: this.y,
          z: this.z,
          engine: this.engine,
        };

        localStorage.setItem("mandelbrotStorage", JSON.stringify(settings));
      }, 1000);
    }

    this.redraw();
  }

  abstract mandelbrotCalc(x0: number, y0: number): number;

  protected drawImmediate (): void {
    const data = this.image.data;

    const zoom = DEFAULT_SCALE / this.z;
    const twoZoom = zoom * 2;
    for (let x = 0; x < this.canvas.width; x++) {
      for (let y = 0; y < this.canvas.height; y++) {
        const a = x / this.canvas.width * twoZoom - zoom + this.x;
        const b = y / this.canvas.height * twoZoom - zoom + this.y;
        const mandelbrotVal = this.mandelbrotCalc(a, b);
        const mappedMandelVal = mandelbrotVal / this.iterations * 255 % 255;
        const index = (y * this.canvas.width + x) * 4;

        data[index] = mappedMandelVal;
        data[index + 1] = mappedMandelVal;
        data[index + 2] = mappedMandelVal;
      }
    }
    this.ctx.putImageData(this.image, 0, 0);
  }

  get limit () {
    return this._limit[0];
  }

  protected set limit (val) {
    this._limit[0] = val;
  }

  get iterations () {
    return this._iter[0];
  }

  protected set iterations (val) {
    this._iter[0] = val;
  }

  get x () {
    return this._pos[0];
  }

  protected set x (val) {
    this._pos[0] = val;
  }

  get y () {
    return this._pos[1];
  }

  protected set y (val) {
    this._pos[1] = val;
  }

  get z (): number {
    return this._pos[2];
  }

  protected set z (val) {
    this._pos[2] = val;
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

  redraw () {
    if (this.animationFrame != null) {
      return;
    }

    this.animationFrame = requestAnimationFrame(() => {
      this.drawImmediate();
      this.animationFrame = null;
    });
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
}

class MandelbrotJS extends Mandelbrot {
  engine = Engine.JS;

  constructor (options: MandelbrotBaseOptions) {
    super(Object.assign({}, options, { ctx: options.canvas.getContext("2d") }));
  }

  mandelbrotCalc (x0: number, y0: number): number {
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
}

class MandelbrotZig extends Mandelbrot {
  engine = Engine.Zig;

  instance: WebAssembly.Instance;
  mem: ArrayBuffer;
  memOffset: number;

  constructor (options: MandelbrotZigOptions) {
    super(Object.assign({}, options, { ctx: options.canvas.getContext("2d") }));
    this.instance = options.instance;
    this.mem = (<WebAssembly.Memory>this.instance.exports.memory).buffer;
    this.memOffset = (<WebAssembly.Global>(
      this.instance.exports.mandelbrot
    )).value;
    const x = this.x;
    const y = this.y;
    const z = this.z;
    const limit = this.limit;
    const iterations = this.iterations;

    this._limit = new Float64Array(this.mem, this.memOffset, 1);
    this._pos = new Float64Array(this.mem, this.memOffset + 8, 3);
    this._iter = new Float64Array(this.mem, this.memOffset + 32, 1);

    this.x = x;
    this.y = y;
    this.z = z;
    this.limit = limit;
    this.iterations = iterations;

    [ this.canvas.width, this.canvas.height ] = new Uint32Array(
      this.mem,
      (<WebAssembly.Global>this.instance.exports.DIMS).value,
      2
    );
    this.image = new ImageData(
      new Uint8ClampedArray(
        this.mem,
        this.memOffset + 40,
        this.canvas.width * this.canvas.height * 4
      ),
      this.canvas.width,
      this.canvas.height
    );
  }

  mandelbrotCalc (x0: number, y0: number): number {
    return (<(x: number, y: number) => number>(
      this.instance.exports.mandelbrot_calc
    ))(x0, y0);
  }

  protected drawImmediate (): void {
    (<(self: number) => void>this.instance.exports.render)(this.memOffset);
  }
}

async function newEngine (
  engine: Engine,
  options: MandelbrotBaseOptions
): Promise<Mandelbrot> {
  switch (engine) {
    case Engine.Zig: {
      let renderer: MandelbrotZig;
      const opts = Object.assign(Object.create(null), options, {
        instance: await WebAssembly.instantiate(await zig_wasm_module, {
          env: {
            draw: () => {
              renderer.ctx.putImageData(renderer.image, 0, 0);
            },
          },
        }),
      });
      renderer = new MandelbrotZig(opts);
      return renderer;
    }

    case Engine.JS:
    default: {
      return new MandelbrotJS(options);
    }
  }
}

window.addEventListener("load", async () => {
  const canvas = <HTMLCanvasElement>document.getElementById("mandelbrotCanvas");
  const engineEl = <HTMLSelectElement>document.getElementById("engineEl");
  const xEl = <HTMLInputElement>document.getElementById("xVal");
  const yEl = <HTMLInputElement>document.getElementById("yVal");
  const zoomEl = <HTMLInputElement>document.getElementById("zoomVal");
  const iterationsEl = <HTMLInputElement>(
    document.getElementById("iterationsVal")
  );
  const limitEl = <HTMLInputElement>document.getElementById("limitVal");
  const resetEl = <HTMLButtonElement>document.getElementById("reset");

  const settings: Settings = Object.assign({}, defaults);
  if (settingSaving && localStorage.mandelbrotStorage !== undefined) {
    Object.assign(settings, JSON.parse(localStorage.mandelbrotStorage));
  }

  const options: MandelbrotBaseOptions = {
    canvas,
    engineEl,
    xEl,
    yEl,
    zoomEl,
    iterationsEl,
    limitEl,
    x: settings.x ?? defaults.x,
    y: settings.y ?? defaults.y,
    z: settings.z ?? defaults.z,
    limit: settings.limit ?? defaults.limit,
    iterations: settings.iterations ?? defaults.iterations,
  };

  let renderer: Mandelbrot;
  renderer = await newEngine(settings.engine ?? Engine.JS, options);

  resetEl.addEventListener("click", () => renderer.reset());

  xEl.addEventListener("change", function () {
    renderer.setX(parseFloat(this.value) || defaults.x);
  });

  yEl.addEventListener("change", function () {
    renderer.setY(parseFloat(this.value) || defaults.y);
  });

  zoomEl.addEventListener("change", function () {
    renderer.setZ(parseFloat(this.value) || defaults.z);
  });

  iterationsEl.addEventListener("change", function () {
    renderer.setIterations(parseFloat(this.value) || defaults.iterations);
  });

  limitEl.addEventListener("change", function () {
    renderer.setLimit(parseFloat(this.value) || defaults.limit);
  });

  window.addEventListener("resize", () => {
    resize(renderer.canvas);
    renderer.redraw();
  });

  canvas.addEventListener("mousedown", (downEvent: MouseEvent) => {
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
      const boundingCanvas = canvas.getBoundingClientRect();
      renderer.setX(renderer.x +
          map(
            lastX - moveEvent.offsetX,
            -boundingCanvas.width,
            boundingCanvas.width,
            -DEFAULT_SCALE,
            DEFAULT_SCALE
          ) /
            renderer.z);
      renderer.setY(renderer.y +
          map(
            lastY - moveEvent.offsetY,
            -boundingCanvas.height,
            boundingCanvas.height,
            -DEFAULT_SCALE,
            DEFAULT_SCALE
          ) /
            renderer.z);

      if (renderer.xEl != null) {
        renderer.xEl.value = renderer.x.toString();
      }
      if (renderer.yEl != null) {
        renderer.yEl.value = renderer.y.toString();
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

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const boundingCanvas = renderer.canvas.getBoundingClientRect();
    if (e.deltaY < 0) {
      if (renderer.z >= 1) {
        renderer.setX(renderer.x +
            (e.offsetX - boundingCanvas.width / 2) / boundingCanvas.width *
              2 /
              renderer.z || 0);
        renderer.setY(renderer.y +
            (e.offsetY - boundingCanvas.height / 2) / boundingCanvas.height *
              2 /
              renderer.z || 0);

        if (renderer.xEl != null) {
          renderer.xEl.value = renderer.x.toString();
        }
        if (renderer.yEl != null) {
          renderer.yEl.value = renderer.y.toString();
        }
      }

      renderer.setZ(renderer.z * 1.25);
    } else if (e.deltaY > 0) {
      renderer.setZ(renderer.z * 0.75);
    }

    if (renderer.z === 0) {
      renderer.setZ(1);
    }
    if (renderer.zoomEl != null) {
      renderer.zoomEl.value = renderer.z.toString();
    }
  });

  engineEl.addEventListener("change", async function () {
    options.x = renderer.x;
    options.y = renderer.y;
    options.z = renderer.z;
    options.limit = renderer.limit;
    options.iterations = renderer.iterations;
    switch (this.value) {
      case "zig":
        {
          renderer = await newEngine(Engine.Zig, options);
        }
        break;

      case "js":
        {
          renderer = await newEngine(Engine.JS, options);
        }
        break;
    }
    resize(renderer.canvas);
    renderer.redraw();
  });
});

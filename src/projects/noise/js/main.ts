import { Noise } from "../../../js/noise.js";
import { map } from "../../../js/functions.js";

const canvas = <HTMLCanvasElement>document.getElementById("contentCanvas");
const ctx = <CanvasRenderingContext2D>canvas.getContext("2d");
const xValEl = <HTMLInputElement>document.getElementById("xVal");
const yValEl = <HTMLInputElement>document.getElementById("yVal");
const zValEl = <HTMLInputElement>document.getElementById("zVal");
const seedValEl = <HTMLInputElement>document.getElementById("seedVal");

if (
  canvas != null &&
  ctx != null &&
  xValEl != null &&
  yValEl != null &&
  zValEl != null &&
  seedValEl != null
) {
  class NoiseRender {
    private x: number;
    private y: number;
    private z: number;
    private seed: number;
    noiseGen: Noise;
    redrawTimeout: number | null;

    constructor (seed?: number) {
      this.redrawTimeout = null;
      this.x = 0;
      this.y = 0;
      this.z = 1;
      this.noiseGen = new Noise(seed);
      this.seed = this.noiseGen.getSeed();
      this.redraw();
    }

    redraw () {
      if (this.redrawTimeout) {
        clearTimeout(this.redrawTimeout);
      }

      this.redrawTimeout = setTimeout(() => {
        const parentNode = <HTMLDivElement>canvas.parentNode;
        if (parentNode == null) {
          return;
        }
        const width = parentNode.offsetWidth - 16;
        const height = parentNode.offsetHeight * 0.85 - 16;
        const dim = width > height ? height : width;
        if (canvas.width != dim) {
          canvas.width = dim;
          canvas.height = dim;
        }
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        const xOff = this.getX(),
          yOff = this.getY(),
          zoom = this.getZ();

        for (let x = 0; x < dim; x++) {
          for (let y = 0; y < dim; y++) {
            const val = this.noiseGen.perlin(
              (x - dim / 2) / dim / zoom + xOff,
              (y - dim / 2) / dim / zoom + yOff,
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
        this.redrawTimeout = null;
      }, 10);
    }

    setSeed (seed: number) {
      this.seed = seed;
      seedValEl.value = seed.toString();
      this.noiseGen = new Noise(seed);
      this.redraw();
    }
    setX (x: number) {
      this.x = x;
      xValEl.value = x.toString();
      this.redraw();
    }
    setY (y: number) {
      this.y = y;
      yValEl.value = y.toString();
      this.redraw();
    }
    setZ (z: number) {
      this.z = z;
      zValEl.value = z.toString();
      this.redraw();
    }

    getSeed () {
      return this.seed;
    }
    getX () {
      return this.x;
    }
    getY () {
      return this.y;
    }
    getZ () {
      return this.z;
    }
  }

  window.addEventListener("load", () => {
    const renderer = new NoiseRender();

    xValEl.addEventListener("change", () => {
      renderer.setX(parseFloat(xValEl.value) || 0);
    });

    yValEl.addEventListener("change", () => {
      renderer.setY(parseFloat(yValEl.value) || 0);
    });

    zValEl.addEventListener("change", () => {
      renderer.setZ(parseFloat(zValEl.value) || 1);
    });

    seedValEl.addEventListener("change", () => {
      renderer.setSeed(parseFloat(seedValEl.value) || 0);
    });

    canvas.addEventListener("mousedown", (downEvent: MouseEvent) => {
      const downTarget = <HTMLElement>downEvent.target;
      if (downTarget == null) {
        return;
      }

      const rect = downTarget.getBoundingClientRect();
      let lastX = downEvent.pageX - rect.left;
      let lastY = downEvent.pageY - rect.top;
      const mouseUpdate = (moveEvent: MouseEvent) => {
        const relX = moveEvent.pageX - rect.left;
        const relY = moveEvent.pageY - rect.top;

        renderer.setX(renderer.getX() +
            map(lastX - relX, -canvas.width, canvas.width, -1, 1) /
              renderer.getZ());
        renderer.setY(renderer.getY() +
            map(lastY - relY, -canvas.height, canvas.height, -1, 1) /
              renderer.getZ());

        xValEl.value = renderer.getX().toString();
        yValEl.value = renderer.getY().toString();

        lastX = relX;
        lastY = relY;
      };
      downTarget.addEventListener("mousemove", mouseUpdate);
      addEventListener(
        "mouseup",
        () => {
          downTarget.removeEventListener("mousemove", mouseUpdate);
        },
        { once: true }
      );
    });

    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        renderer.setZ(renderer.getZ() * 1.25);
      } else if (e.deltaY > 0) {
        renderer.setZ(renderer.getZ() * 0.75);
      }


      if (renderer.getZ() == 0) {
        renderer.setZ(1);
      }
    });

    window.addEventListener("resize", () => {
      renderer.redraw();
    });
  });
}

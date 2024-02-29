import { type MazeGenerator, RecursiveBacktracker } from "./generators/index";

enum GeneratorType {
  RecursiveBacktracker = "RecursiveBacktracker",
  Kruskals = "Kruskal",
  Prims = "Prim",
}

function newGenerator(
  type: GeneratorType,
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): MazeGenerator {
  switch (type) {
    case GeneratorType.RecursiveBacktracker: {
      return new RecursiveBacktracker({
        canvas,
        ctx,
      });
    }

    case GeneratorType.Kruskals: {
      throw new Error("Not Implemented: " + type);
    }

    case GeneratorType.Prims: {
      throw new Error("Not Implemented: " + type);
    }

    default: {
      throw new Error("Invalid generator type: " + type);
    }
  }
}

window.addEventListener("load", () => {
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Context not provided. HTML5 Canvas may not be supported.");
  }

  let generator = newGenerator(GeneratorType.RecursiveBacktracker, canvas, ctx);

  const draw = async () => {
    await generator.step();
    generator.draw();

    requestAnimationFrame(() => {
      draw();
    });
  };

  draw();

  const generatorEl = <HTMLSelectElement>document.getElementById("generatorEl");
  if (generatorEl != null) {
    generatorEl.addEventListener("change", (event) => {
      if (event.target != null) {
        const target = <HTMLSelectElement>event.target;
        try {
          generator = newGenerator(target.value as GeneratorType, canvas, ctx);
        } catch (e) {
          const error = e as Error;
          console.error(error);
          if (error.message != null) {
            alert(error.message);
          }
          target.value = GeneratorType.RecursiveBacktracker;
          generator = newGenerator(
            GeneratorType.RecursiveBacktracker,
            canvas,
            ctx
          );
        }
      }
    });
  }

  const widthEl = <HTMLInputElement>document.getElementById("widthVal");
  if (widthEl != null) {
    widthEl.addEventListener("change", (event) => {
      const el = event.target as HTMLInputElement;
      const val = el.valueAsNumber;
      if (!Number.isNaN(val)) {
        generator.width = val;
        generator.reset();
      }
    });
  }
  const heightEl = <HTMLInputElement>document.getElementById("heightVal");
  if (heightEl != null) {
    heightEl.addEventListener("change", (event) => {
      const el = event.target as HTMLInputElement;
      const val = el.valueAsNumber;
      if (!Number.isNaN(val)) {
        generator.height = val;
        generator.reset();
      }
    });
  }

  window.addEventListener("resize", () => {
    generator.resizeCanvas();
  });
});

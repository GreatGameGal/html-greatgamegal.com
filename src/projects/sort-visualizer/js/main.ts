import {
  type SorterOptions,
  Sorter,
  BubbleSorter,
  QuickSorter,
} from "./sorters/index.js";

const Algorithms: Record<
  string,
  {
    new (options: SorterOptions): Sorter;
    defaultLength: number;
  }
> = {
  Bubble: BubbleSorter,
  Quick: QuickSorter,
};

const defaults: Record<string, keyof typeof Algorithms> = {
  algorithm: "Bubble",
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

window.addEventListener("load", async () => {
  const canvas = document.getElementById(
    "visualizerCanvas"
  ) as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");
  const sorterEl = <HTMLSelectElement>document.getElementById("sorterEl");
  const countEl = <HTMLInputElement>document.getElementById("countVal");
  resize(canvas);

  if (!ctx) {
    throw new Error("Context not provided. HTML5 Canvas may not be supported.");
  }

  sorterEl.value = defaults.algorithm;
  countEl.value = "";

  const options: SorterOptions = {
    canvas,
    ctx,
  };

  const algo = Algorithms[sorterEl.value ?? defaults.algorithm];
  let sorter = new algo(options);

  const draw = () => {
    if (!sorter.done) {
      sorter.step();
    }
    sorter.draw();
    requestAnimationFrame(() => draw());
  };
  requestAnimationFrame(() => draw());

  window.addEventListener("resize", () => {
    resize(canvas);
  });

  countEl.addEventListener("change", function () {
    let count = parseInt(this.value);
    if (isNaN(count)) {
      count = Algorithms[sorterEl.value].defaultLength;
    }
    options.length = count;
    sorter.length = count;
    sorter.reset();
    return false;
  });

  sorterEl.addEventListener("change", function () {
    const algorithm = Algorithms[this.value];
    if (algorithm == undefined) {
      console.error(`Invalid algorithm: ${this.value}`);
      return;
    }
    console.log("Setting algorithm", algorithm);
    sorter = new algorithm(options);
  });
});

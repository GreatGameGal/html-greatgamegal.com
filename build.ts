import fs from "node:fs";

const srcDir = "./src";
const outDir = "./build";

type FileHandler = (srcDir: string | URL, outDir: string | URL, path: string | URL) => void;

const tsTranspiler = new Bun.Transpiler({
  loader: "ts",
  target: "browser",
  inline: true,
});

async function transpileTS (srcDir: string | URL, outDir: string | URL, path: string | URL) {
  const pathStr = path.toString();
  const outPath = pathStr.slice(0, pathStr.lastIndexOf(".")) + ".js";
  const srcFile = Bun.file(`${srcDir}${path}`);
  const outFile = Bun.file(`${outDir}${outPath}`);

  const src = await srcFile.arrayBuffer();

  const build = await tsTranspiler.transform(src);

  await Bun.write(outFile, build);
}

function addClass (element: HTMLRewriterTypes.Element, className: string) {
  const classes = element.getAttribute("class");
  element.setAttribute("class", classes == null ? className : classes + " " + className);
  return element;
}

class ComponentHandler implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers {
  async element (element: HTMLRewriterTypes.Element) {
    if (!element.hasAttribute("src")) {
      console.warn(`Component element does not have src attribute.`, element);
      return;
    }
    const src = element.getAttribute("src");
    if (!fs.existsSync(`${srcDir}/${src}`)) {
      console.error(`COMPONENT SRC FILE DOES NOT EXIST: ${src}`);
      return;
    }
    const replacementFile = Bun.file(`${srcDir}/${src}`);
    const rewriter = new HTMLRewriter();
    if (element.hasAttribute("addclassbyid")) {
      const rawToAdd = element.getAttribute("addclassbyid") ?? "";
      const toAdd = rawToAdd.split(";").map((e) => e.split(":").map((j) => j.trim()));
      for(const subarr of toAdd) {
        rewriter.on(`*#${subarr[0]}`, {
          element: (el) => {
            addClass(el, subarr[1]);
          },
        });
      }
    }
    const replacement = await rewriter.transform(new Response(replacementFile)).text();
    element.replace(replacement, { html: true });
  }
}

const htmlRewriter = new HTMLRewriter();
htmlRewriter.on("div#html_component", new ComponentHandler());

async function transpileHTML (srcDir: string | URL, outDir: string | URL, path: string | URL) {
  const srcFile = Bun.file(`${srcDir}${path}`);
  const outFile = Bun.file(`${outDir}${path}`);

  const src = new Response(srcFile);
  const out = await htmlRewriter.transform(src).arrayBuffer();
  await Bun.write(outFile, out);
}



async function copyFile (srcDir: string | URL, outDir: string | URL, path: string | URL) {
  await Bun.write(Bun.file(`${outDir}${path}`), Bun.file(`${srcDir}${path}`));
}

async function transpileDir (srcDir: string, outDir: string, path = "") {
  for(const file of fs.readdirSync(`${srcDir}${path}`)) {
    if (fs.statSync(`${srcDir}${path}/${file}`).isDirectory()) {
      fs.mkdirSync(`${outDir}${path}/${file}`, { recursive: true });
      transpileDir(`${srcDir}`, outDir, `${path}/${file}`);
      continue;
    }
    let handler: FileHandler;
    switch (file.slice(file.lastIndexOf("."))) {
      case ".html":
      case ".htm": {
        handler = transpileHTML;
      } break;

      case ".ts": {
        handler = transpileTS;
      } break;

      default: {
        handler = copyFile;
      } break;
    }
    if (handler != null) {
      await handler(srcDir, outDir, `${path}/${file}`);
    }
  }
}

console.log("Removing old build...");
fs.rmSync("./build", {
  recursive: true,
  force: true,
});
console.log("Beginning build...");
fs.mkdirSync("./build");
transpileDir(srcDir, outDir);
console.log("Build complete.");

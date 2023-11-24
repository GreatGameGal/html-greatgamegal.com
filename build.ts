import fs from "node:fs";
import path from "path";

const srcDir = "./src";
const outDir = "./build";
const ALL_FILE_GLOB = new Bun.Glob("**/*");

type FileHandler = (srcDir: string | URL, outDir: string | URL, path: string | URL) => Promise<void>;

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
    const src = element.getAttribute("src");
    if (!element.hasAttribute("src") || src == null) {
      console.warn(`Component element does not have src attribute.`, element);
      return;
    }
    const srcPath = path.join(import.meta.dir, srcDir, src);
    if (!fs.existsSync(srcPath)) {
      console.error(`COMPONENT SRC FILE DOES NOT EXIST: ${src}`);
      return;
    }
    const replacementFile = Bun.file(srcPath);
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
    const replacement = await rewriter.transform(new Response(await replacementFile.text())).text();
    element.replace(replacement, { html: true });
  }
}

const htmlRewriter = new HTMLRewriter();
htmlRewriter.on("div#html_component", new ComponentHandler());

async function transpileHTML (srcDir: string | URL, outDir: string | URL, path: string | URL) {
  const srcFile = Bun.file(`${srcDir}${path}`);
  const outFile = Bun.file(`${outDir}${path}`);

  const src = new Response(await srcFile.text());
  const out = await htmlRewriter.transform(src).arrayBuffer();
  await Bun.write(outFile, out);
}



async function copyFile (srcDir: string | URL, outDir: string | URL, path: string | URL) {
  await Bun.write(Bun.file(`${outDir}${path}`), Bun.file(`${srcDir}${path}`));
}

async function transpileDir (srcDir: string, outDir: string) {
  for await (const file of ALL_FILE_GLOB.scan({
    cwd: srcDir,
    onlyFiles: false,
  })) {
    if (fs.statSync(`${srcDir}/${file}`).isDirectory()) {
      fs.mkdirSync(`${outDir}/${file}`, { recursive: true });
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
      await handler(srcDir, outDir, `/${file}`);
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
await transpileDir(srcDir, outDir);
console.log("Build complete.");

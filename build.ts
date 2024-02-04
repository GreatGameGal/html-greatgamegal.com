import fs from "node:fs/promises";
import path from "path";
import { $ } from "bun";

const ALL_FILE_GLOB = new Bun.Glob("**/*");

const FLAG_FORMAT = process.argv.includes("--format");
const FLAG_NO_BUILD = process.argv.includes("--no-build");
const FLAG_WATCH = process.argv.includes("--watch");

type FileTranspileHandler = (srcPath: string, outPath: string) => Promise<void>;

const tsTranspiler = new Bun.Transpiler({
  loader: "ts",
  target: "browser",
  inline: true,
});

function addClass(element: HTMLRewriterTypes.Element, className: string) {
  const classes = element.getAttribute("class");
  element.setAttribute(
    "class",
    classes == null ? className : classes + " " + className
  );
  return element;
}

class ComponentHandler
  implements HTMLRewriterTypes.HTMLRewriterElementContentHandlers
{
  srcDir: string;

  constructor(srcDir: string) {
    this.srcDir = srcDir;
  }

  async element(element: HTMLRewriterTypes.Element) {
    const src = element.getAttribute("src");
    if (!element.hasAttribute("src") || src == null) {
      console.warn(`Component element does not have src attribute.`, element);
      return;
    }
    const replacementFile = Bun.file(path.join(this.srcDir, src));
    if (!(await replacementFile.exists())) {
      console.error(`COMPONENT SRC FILE DOES NOT EXIST: ${src}`);
      return;
    }
    const rewriter = new HTMLRewriter();
    if (element.hasAttribute("addclassbyid")) {
      const rawToAdd = element.getAttribute("addclassbyid") ?? "";
      const toAdd = rawToAdd
        .split(";")
        .map((e) => e.split(":").map((j) => j.trim()));
      for (const subarr of toAdd) {
        rewriter.on(`*#${subarr[0]}`, {
          element: (el) => {
            addClass(el, subarr[1]);
          },
        });
      }
    }
    const replacement = await rewriter
      .transform(new Response(await replacementFile.text()))
      .text();
    element.replace(replacement, { html: true });
  }
}

async function transpileTS(srcPath: string, outPath: string) {
  outPath = `${outPath.slice(0, outPath.lastIndexOf("."))}.js`;
  const srcFile = Bun.file(srcPath);
  const outFile = Bun.file(outPath);

  if (!(await srcFile.exists())) {
    return;
  }

  const src = await srcFile.arrayBuffer();

  const build = tsTranspiler.transformSync(src);

  await Bun.write(outFile, build, { createPath: true });
}

async function transpileHTML(
  srcPath: string,
  outPath: string,
  htmlRewriter: HTMLRewriter
) {
  const srcFile = Bun.file(srcPath);
  const outFile = Bun.file(outPath);

  if (!(await srcFile.exists())) {
    return;
  }

  const src = new Response(await srcFile.text());
  const out = await htmlRewriter.transform(src).arrayBuffer();
  await Bun.write(outFile, out, { createPath: true });
}

async function copyFile(srcPath: string, outPath: string) {
  const srcFile = Bun.file(srcPath);
  if (!(await srcFile.exists())) {
    return;
  }
  await Bun.write(Bun.file(outPath), srcFile, { createPath: true });
}

function transpileFile(
  srcPath: string,
  outPath: string,
  handlers: Map<string, FileTranspileHandler>
) {
  const handler: FileTranspileHandler =
    handlers.get(srcPath.slice(srcPath.lastIndexOf("."))) ?? copyFile;
  return handler(srcPath, outPath);
}

async function transpileDir(srcDir: string, outDir: string) {
  console.log(`Beginning build: ${srcDir}`);
  const start = performance.now();
  const htmlRewriter = new HTMLRewriter();
  htmlRewriter.on("div#html_component", new ComponentHandler(srcDir));
  const transpileHTMLWithRewriter = (srcDir: string, outDir: string) =>
    transpileHTML(srcDir, outDir, htmlRewriter);
  const handlers: Map<string, FileTranspileHandler> = new Map(
    Object.entries({
      ".htm": transpileHTMLWithRewriter,
      ".html": transpileHTMLWithRewriter,
      ".ts": transpileTS,
    })
  );
  const transpiling: ReturnType<FileTranspileHandler>[] = [];
  for await (const file of ALL_FILE_GLOB.scan({
    cwd: srcDir,
    onlyFiles: true,
  })) {
    transpiling.push(
      transpileFile(path.join(srcDir, file), path.join(outDir, file), handlers)
    );
  }
  await Promise.all(transpiling);
  console.log(
    `Finished build in ${(performance.now() - start).toFixed(3)}ms: ${srcDir}`
  );
}

async function formatDir(dir: string) {
  console.log(`Beginning format: ${dir}`);
  const start = performance.now();
  const prettier =
    await $`prettier --write --log-level warn ${dir} > ${Bun.stdout}`;

  if (prettier.exitCode != 0 && !FLAG_WATCH) {
    process.exit(prettier.exitCode);
  }

  const eslint = await $`eslint --fix ${dir} > ${Bun.stdout}`;
  if (eslint.exitCode != 0 && !FLAG_WATCH) {
    process.exit(eslint.exitCode);
  }

  console.log(
    `Finished format in ${(performance.now() - start).toFixed(3)}ms: ${dir}`
  );
}

async function run(srcDir: string, outDir: string, toFormatDir: string) {
  console.log();

  if (FLAG_FORMAT) {
    await formatDir(toFormatDir);
  }

  if (!FLAG_NO_BUILD) {
    // Runs tsc and pipes the output to Bun.stdout.
    const tscResults = await $`tsc > ${Bun.stdout}`;
    // If TSC exited with a non-zero code we should too unless we're watching. Either way we don't want to finish the build.
    if (tscResults.exitCode != 0) {
      if (!FLAG_WATCH) {
        process.exit(tscResults.exitCode);
      }
      return;
    }

    console.log("Removing old build.");
    await fs.rm(outDir, {
      recursive: true,
      force: true,
    });

    await transpileDir(srcDir, outDir);
  }
}

console.log("Beginning initial build.");
await run("./src", "./build", ".");

if (FLAG_WATCH) {
  console.log("\nBeginning to watch: .");

  let buildTimeout: NodeJS.Timeout | null = null;
  const watcher = fs.watch(".", { recursive: true });
  for await (const event of watcher) {
    if (event.filename?.startsWith("build")) {
      continue;
    }
    {
      if (buildTimeout != null) {
        clearTimeout(buildTimeout);
      }
    }
    // The timeout is done to prevent editors from causing problems with quick temp files.
    buildTimeout = setTimeout(async () => {
      console.log("\nFile change detected, rebuilding.");
      // This is really overkill, ideally I would specifically transpile the file changed but editor weirdness and excessive complexity made me choose this route for now.
      await run("./src", "./build", ".");
      buildTimeout = null;
    }, 500);
  }
}

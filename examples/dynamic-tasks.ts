import * as path from "https://deno.land/std@0.68.0/path/mod.ts";
import {
  desc,
  env,
  execute,
  glob,
  run,
  sh,
  task,
} from "https://deno.land/x/drake@v1.3.1/mod.ts";
// } from "../mod.ts";

const tasks: string[] = [];
const mdfiles = env("mdfiles") || "*.md";
const outdir = env("outdir") || path.dirname(mdfiles);

for (const prereq of glob(mdfiles)) {
  let target = `${prereq.replace(/\.[^/.]+$/, "")}.html`;
  target = path.join(outdir, path.basename(target));
  // Create a file task to compile the markdown source file.
  task(target, [prereq], async function () {
    await sh(`marked "${prereq}" > "${target}"`);
  });
  tasks.push(target);
}

desc("command-line usage");
task("help", [], function () {
  console.log(`
Example Drakefile illustrating dynamic task creation.

Dynamically create file tasks to compile markdown source files to HTML.
Execute them synchronously and asynchronously with 'compile-sync' and
'compile-async' tasks respectively.

Example usage:

   deno run -A dynamic-tasks.ts compile-async mdfiles=~/doc/test/*.md outdir=/tmp

Environment variables:

mdfiles=<markdown source files glob>                (default: "*.md")
outdir=<output directory for compiled HTML files>   (default: mdfiles directory)

- The 'compile-async' task runs up to 5 times faster than 'compile-sync'.
- Increase the maximum number of open file descriptors with ulimit(1) if
  there are 'Too many open files (os error 24)'.
`);
});

desc("compile markdown files synchronously");
task("compile-sync", tasks);

desc("compile markdown files asynchronously");
task("compile-async", [], async function () {
  await execute(...tasks);
});

await run();

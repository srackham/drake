import * as path from "https://deno.land/std@0.66.0/path/mod.ts";
import { env } from "../lib/env.ts";
import { desc, glob, run, sh, task } from "../mod.ts";

const tasks: string[] = [];

for (const prereq of glob("*.md")) {
  const target = `${path.basename(prereq, ".md")}.html`;
  desc(`compile "${target}"`);
  task(target, [prereq], async function () {
    await sh(`marked "${prereq}" > "${target}"`);
  });
  tasks.push(target);
}

desc("compile markdown");
task("compile-md", tasks);
env("--default-task", "compile-md");

run();

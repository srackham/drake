import * as path from "https://deno.land/std@v0.54.0/path/mod.ts";
import { desc, glob, run, sh, task } from "../mod.ts";

for (const prereq of glob("*.md")) {
  const target = `${path.basename(prereq, ".md")}.html`;
  desc(`compile "${target}"`);
  task(target, [prereq], async function () {
    await sh(`markdown "${prereq}" > "${target}"`);
  });
}

run();

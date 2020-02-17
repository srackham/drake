import { desc, env, glob, run, sh, task } from "./mod.ts";

env["--default-task"] = "test";
const SRC_FILES = glob("**/*.ts");

desc("Run tests");
task("test", ["fmt"], async function() {
  await sh("deno test -A tests/*.ts");
});

desc("Format source files");
task("fmt", [], async function() {
  await sh(`deno fmt ${SRC_FILES.join(" ")}`);
});

desc("Install drake executable CLI wrapper");
task("install", ["test"], async function() {
  await sh("deno install -A -f drake ./drake.ts");
});

desc("Run examples drakefile");
task("run", ["test"], async function() {
  await sh(`cd ./examples
            deno run -A ./Drakefile.ts prereqs pause "qux=Foo Bar" noop`);
});

run();

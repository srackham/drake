import { desc, exec, glob, run, sh, task } from "./mod.ts";

const SRC_FILES = glob("**/*.ts");

desc("format source files");
task("fmt", [], async function() {
  await exec(["deno", "fmt"].concat(SRC_FILES));
});

desc("run tests");
task("test", ["fmt"], async function() {
  await sh("deno test -A tests/");
});

// desc("Task 2")
task("2", ["3"], function() {
  console.log("task: 2");
});

desc("Task 3");
task("3", [], async function() {
  console.log("task: 3");
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
  console.log("done");
});

run();

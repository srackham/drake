import { desc, run, task } from "../mod.ts";

desc("Task 1");
task("1", ["2", "3"]);

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
  console.log("task: 3 done");
});

run();

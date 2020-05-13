import { desc, run, task } from "https://deno.land/x/drake/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

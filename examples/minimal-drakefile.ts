import { desc, run, task } from "https://deno.land/x/drake@v1.1.2/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

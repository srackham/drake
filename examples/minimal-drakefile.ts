import { desc, run, task } from "https://deno.land/x/drake@v1.4.0/mod.ts";
// import { desc, run, task } from "https://x.nest.land/drake@1.3.2/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

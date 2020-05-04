import {
  desc,
  run,
  task,
} from "https://raw.github.com/srackham/drake/v0.42.0/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

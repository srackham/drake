import {
  desc,
  run,
  task,
} from "https://raw.github.com/srackham/drake/v1.0.0-rc1/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

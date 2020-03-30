import {
  desc,
  run,
  task
} from "https://raw.github.com/srackham/drake/master/mod.ts";

desc("Minimal Drake task");
task("hello", [], function () {
  console.log("Hello World!");
});

run();

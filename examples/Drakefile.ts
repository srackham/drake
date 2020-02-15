import { sh } from "../lib/utils.ts";
import { desc, run, task } from "../mod.ts";

desc("Actionless task with prerequisites");
task("prereqs", ["noop", "pause"]);

desc("Synchronous task that does nothing");
task("noop", ["pause"], function() {});

desc("Asynchronous task pauses for 1 second");
task("pause", [], async function() {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

desc("Execute shell command");
task("shell", [], function() {
  sh("echo Hello World");
});

desc("Execute multiple shell commands sequentially");
task("sequential", [], async function() {
  await sh("echo Hello World");
  await sh("ls");
  await sh("wc Drakefile.ts");
});

desc("Execute multiple shell commands concurrently");
task("concurrent", [], function() {
  sh(["echo Hello World", "ls", "wc Drakefile.ts"]);
});

desc("Execute bash shell script");
task("script", [], function() {
  sh(`set -e  # Exit immediately on error.
      echo Hello World
      if [ "$EUID" -eq 0 ]; then
          echo "Running as root"
      else
          echo "Running as $USER"
      fi
      ls
      wc Drakefile.ts`);
});

desc("File task");
task("./target-file", ["./prereq-file"], function() {
  console.log("running file task");
});

run();

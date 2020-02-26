import { desc, execute, run, sh, task } from "../mod.ts";

desc("Minimal Drake task");
task("hello", [], function() {
  console.log("Hello World!");
});

desc("Actionless task with prerequisites");
task("prereqs", ["noop", "pause"]);

desc("Synchronous task that does nothing");
task("noop", ["pause"], function() {
  console.log(`${this.desc} executing in ${Deno.cwd()}`);
  console.log(`$HOME=${Deno.env("HOME")}`);
});

desc("Execute shell command");
task("shell", [], async function() {
  await sh("echo Hello World");
});

desc("Execute multiple shell commands sequentially");
task("sequential", [], async function() {
  await sh("echo Hello World");
  await sh("sleep 1");
  await sh("ls");
  await sh("sleep 1");
  await sh("wc Drakefile.ts");
  await sh("sleep 1");
});

desc("Execute multiple shell commands concurrently");
task("concurrent", [], async function() {
  await sh(["sleep 1", "sleep 1", "sleep 1"]);
});

desc("Execute bash shell script");
task("script", [], async function() {
  await sh(`set -e  # Exit immediately on error.
      echo Hello World
      if [ "$EUID" -eq 0 ]; then
          echo "Running as root"
      else
          echo "Running as $USER"
      fi
      ls
      wc Drakefile.ts`);
});

desc("Asynchronous task pauses for 1 second");
task("pause", [], async function() {
  await new Promise(resolve => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
});

desc("File task");
task("/tmp/file1", ["shell", "/tmp/file2"], function() {
  console.log(this.desc);
});

desc("Execute shell command");
task("shell2", ["shell"], async function() {
  await sh("echo Hello World 2");
});

desc("execute noop action function");
task("execute", [], async function() {
  await execute("noop");
});

desc("run noop and shell tasks");
task("run", [], async function() {
  await run("noop", "shell");
});

run();

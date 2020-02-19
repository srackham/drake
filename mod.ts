const vers = "0.1.0";

// Drake API.
export { abort, glob, quote, sh } from "./lib/utils.ts";
export { desc, execute, run, invoke, task, log, env, vers };

import { Env, parseArgs } from "./lib/cli.ts";
import { help } from "./lib/help.ts";
import { Action, TaskRegistry } from "./lib/tasks.ts";

// Instantiate environment and tasks registry and parse command-line.
const env: Env = {};
for (const name of Object.getOwnPropertyNames(Deno.env())) {
  env[`$${name}`] = Deno.env(name);
}
const taskRegistry = new TaskRegistry(env);
parseArgs(Deno.args.slice(), env);

// Set description of next registered task.
function desc(description: string): void {
  taskRegistry.desc(description);
}

// Register task.
function task(name: string, prereqs: string[] = [], action?: Action): void {
  taskRegistry.register(name, prereqs, action);
}

function log(message: string): void {
  taskRegistry.log(message);
}

// Run Drake command-line options and target tasks.
async function run() {
  if (env["--help"]) {
    help();
  } else if (env["--version"]) {
    console.log(vers);
  } else if (env["--tasks"]) {
    taskRegistry.list();
  } else {
    const tasks = env["--targets"];
    if (tasks.length === 0 && env["--default-target"]) {
      tasks.push(env["--default-target"]);
    }
    await taskRegistry.run(env["--targets"]);
  }
}

async function execute(name: string) {
  await taskRegistry.execute(name);
}

async function invoke(name: string) {
  await taskRegistry.run([name]);
}

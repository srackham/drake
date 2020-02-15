const vers = "0.0.1";

export { glob, sh } from "./lib/utils.ts";
export { desc, run, task, log, env };

import { Env, parseArgs } from "./lib/cli.ts";
import { help } from "./lib/help.ts";
import { Action, TaskRegistry } from "./lib/tasks.ts";

// Instantiate environment and tasks registry and parse command-line.
const env: Env = {};
const taskRegistry = new TaskRegistry(env);
parseArgs(Deno.args, env);

// Set task description.
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

function run(): void {
  if (env["--help"]) {
    help();
  } else if (env["--version"]) {
    console.log(vers);
  } else if (env["--list"]) {
    taskRegistry.list();
  } else {
    const tasks = env["--targets"];
    if (tasks.length === 0 && env["--default-task"]) {
      tasks.push(env["--default-task"]);
    }
    taskRegistry.run(env["--targets"]);
  }
}

export { exec, glob, sh } from './lib/utils.ts'
export { desc, run, task, log, env }

import { Env, parseArgs } from './lib/cli.ts'
import { Action, TaskRegistry } from './lib/tasks.ts'

// Instantiate environment and tasks registry and parse command-line.
const env: Env = {};
const taskRegistry = new TaskRegistry(env)
parseArgs(Deno.args, env);

// Set task description.
function desc(description: string): void {
  taskRegistry.desc(description)
}

// Register task.
function task(name: string, prereqs: string[], action?: Action): void {
  taskRegistry.register(name,prereqs,action)
}

function log(message: string) {
  taskRegistry.log(message)
}

function run() {
  taskRegistry.run(env["--tasks"])
}

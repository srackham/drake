const vers = "0.1.0";

// Drake API.
export { abort, glob, quote, sh } from "./lib/utils.ts";
export { desc, execute, run, task, log, env, vers };

import { existsSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.33.0/path/mod.ts";
import { Env, parseArgs } from "./lib/cli.ts";
import { help } from "./lib/help.ts";
import { TaskRegistry } from "./lib/tasks.ts";
import { abort } from "./lib/utils.ts";

/**
 * The Drake `env` object contains:
 *
 * _Options_: Mostly command-line options e.g. `env["--dry-run"]`.
 *
 * _Command-line variables_: For example `vers=1.0.1` on the command-line
 * is available as `env["vers"]` and `env.vers`.
 *
 * _Shell variables_: A read-only snapshot of the shell environment
 * variables e.g. `env["$HOME"]`.
 */
const env: Env = {};

// Copy shell environment variables into Drake environment.
for (const name of Object.getOwnPropertyNames(Deno.env())) {
  env[`$${name}`] = Deno.env(name);
}

// Parse command-line options into Drake environment.
parseArgs(Deno.args.slice(), env);

if (env["--help"]) {
  help();
} else if (env["--version"]) {
  console.log(vers);
}

// Caclulate drakefile path relative to cwd prior to processing --directory option.
let drakefile = env["--drakefile"] ? env["--drakefile"] : "./Drakefile.ts";
if (!path.isAbsolute(drakefile)) {
  drakefile = path.join(Deno.cwd(), drakefile);
}
env["--drakefile"] = drakefile;

if (env["--directory"]) {
  const dir = env["--directory"];
  if (!existsSync(dir) || !Deno.statSync(dir).isDirectory()) {
    abort(`--directory missing or not a directory: ${dir}`);
  }
  Deno.chdir(dir);
}

/** Global task registry. */
const taskRegistry = new TaskRegistry(env);

/** Set description of next registered task. */
function desc(description: string): void {
  taskRegistry.desc(description);
}

/** Create and register a task. */
function task(
  name: string,
  prerequisites: string[] = [],
  action?: () => any
): void {
  taskRegistry.register(name, prerequisites, action);
}

/** Log a message to the console. Do not log the message if the `--quiet` option is set. */
function log(message: string): void {
  taskRegistry.log(message);
}

/**
 * Execute Drake command-line options and target tasks. If `targets` is omitted then the
 * command-line targets are run or the default target is run.
 */
async function run(...targets: string[]) {
  if (env["--help"] || env["--version"]) {
    return;
  }
  if (env["--tasks"]) {
    taskRegistry.list();
  } else {
    if (targets.length === 0) {
      targets = env["--targets"];
      if (targets.length === 0 && env["--default-target"]) {
        targets.push(env["--default-target"]);
      }
    }
    if (targets.length === 0) {
      abort("no target task specified");
    }
    await taskRegistry.run(targets);
  }
}

/** Unconditionally execute the target task without its prerequisites. */
async function execute(target: string) {
  await taskRegistry.execute(target);
}

/** The Drake version number. */
const vers: string = "0.3.1";

// Drake API.
export {
  abort,
  glob,
  quote,
  readFile,
  sh,
  updateFile,
  writeFile
} from "./lib/utils.ts";
export { desc, execute, run, task, log, env, vers };

import { existsSync } from "https://deno.land/std@v0.35.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";
import { Env, parseArgs } from "./lib/cli.ts";
import { help } from "./lib/help.ts";
import { Action, TaskRegistry } from "./lib/tasks.ts";
import { abort } from "./lib/utils.ts";

/**
  * The Drake `env` object contains the command-line options, tasks an variables:
  *
  * Options are keyed by their long option name e.g.  `env["--dry-run"]`. Unspecified flag options
  * are undefined; unspecified value options are assigned their default value.
  *
  * Tasks names are stored in the `env["--tasks"]` string array. A default task can be specified by
  * setting `env["--default-task"]` to the task name.
  *
  * Variable values are keyed by name. For example `vers=1.0.1` on the command-line is available as
  * `env["vers"]` and `env.vers`.
  */
const env: Env = { "--tasks": [] };

/** Global task registry. */
const taskRegistry = new TaskRegistry(env);

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

/** Set description of next registered task. */
function desc(description: string): void {
  taskRegistry.desc(description);
}

/**
 * Create and register a task.
 * @param name - A unique task name.
 * @param prereqs - An array of prerequisite task names i.e. the names of tasks to be run prior to executing the task action function.
 * @param action - An optional function that is run if the task is selected for execution.
 */
function task(
  name: string,
  prereqs: string[] = [],
  action?: Action
): void {
  taskRegistry.register(name, prereqs, action);
}

/** Log a message to the console. Do not log the message if the `--quiet` command-line option is
 * set.
 */
function log(message: string): void {
  taskRegistry.log(message);
}

/**
 * Execute named tasks along with their prerequisite tasks (direct and indirect). If no `names` are
 * specified then the the command-line tasks are run. If no command-line tasks were specified the
 * default task (set in `env["--default-task"]`) is run.
 *
 * Task execution is ordered such that prerequisite tasks are executed prior to their parent task.
 * The same task is never run twice.
 */
async function run(...names: string[]) {
  if (env["--help"] || env["--version"]) {
    return;
  }
  if (env["--list-tasks"]) {
    taskRegistry.list();
  } else {
    if (names.length === 0) {
      names = env["--tasks"];
      if (names.length === 0 && env["--default-task"]) {
        names.push(env["--default-task"]);
      }
    }
    if (names.length === 0) {
      abort("no task specified");
    }
    await taskRegistry.run(...names);
  }
}

/**
 * Unconditionally execute task action functions ignoring task prerequisites.
 *
 * - If `names` is a task name string execute the task action.
 * - If `names` is an array of task names execute their actions asynchronously.
 * - Silently skip tasks that have no action function.
 */
async function execute(names: string | string[]) {
  await taskRegistry.execute(names);
}

// Drake API.
export {
  abort,
  env,
  glob,
  log,
  quote,
  readFile,
  sh,
  shCapture,
  updateFile,
  writeFile
} from "./lib/utils.ts";
export { desc, execute, run, task, vers };

import { existsSync } from "https://deno.land/std@v0.35.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";
import { help } from "./lib/help.ts";
import { Action, TaskRegistry } from "./lib/tasks.ts";
import { abort, env, parseEnv } from "./lib/utils.ts";

/** The Drake version number. */
const vers: string = "0.8.0";

/** Global task registry. */
const taskRegistry = new TaskRegistry();

env["--abort-exits"] = true;

// Parse command-line options into Drake environment.
parseEnv(Deno.args.slice(), env);

if (env["--help"]) {
  help();
} else if (env["--version"]) {
  console.log(vers);
} else {
  // Caclulate drakefile path relative to cwd prior to processing --directory option.
  let drakefile = env["--drakefile"] ?? "Drakefile.ts";
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

/**
 * Execute named tasks along with their prerequisite tasks (direct and indirect). If no `names` are
 * specified then the command-line tasks are run. If no command-line tasks were specified the
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

import { env } from "./env.ts";
import { Action, Task, TaskRegistry } from "./tasks.ts";
import { abort } from "./utils.ts";

/** Global task registry. */
const taskRegistry = new TaskRegistry();
let isRunning = false;

/** Set description of next registered task. */
export function desc(description: string): void {
  taskRegistry.desc(description);
}

/**
 * Create and register a task. Returns the task object.
 *
 * - `name` is a unique task name.
 * - `prereqs` is an array of prerequisite task names.  Prerequisites can be
 *   normal task names, file task names, file paths or globs (wildcards).
 * - `action` is an optional function that is run if the task is selected for
 *   execution (`type Action = (this: Task) => any;`).
 * - To fetch an existing task omit both the `prereqs` and `action` parameters.
 *
 */
export function task(name: string, prereqs?: string[], action?: Action): Task {
  if (prereqs !== undefined) {
    taskRegistry.register(name, prereqs, action);
  }
  return taskRegistry.get(name);
}

/**
 * Execute named tasks along with their prerequisite tasks (direct and
 * indirect). If no task names are specified then the command-line tasks are run.
 * If no command-line tasks were specified the default task (set in
 * `env("--default-task")`) is run.
 *
 * Task execution is ordered such that prerequisite tasks are executed prior to
 * their parent task. The same task is never run twice.
 */
export async function run(...taskNames: string[]) {
  if (env("--help") || env("--version")) {
    return;
  }
  if (env("--list-tasks") || env("--list-all")) {
    taskRegistry.list().forEach((t: unknown) => console.log(t));
  } else {
    if (taskNames.length === 0) {
      taskNames = env("--tasks");
      if (taskNames.length === 0 && env("--default-task")) {
        taskNames.push(env("--default-task"));
      }
    }
    if (taskNames.length === 0) {
      abort(
        "no task specified (use the --list-tasks option to list tasks, --help for help)",
      );
    }
    isRunning = true;
    try {
      await taskRegistry.run(...taskNames);
    } finally {
      isRunning = false;
    }
  }
}

/**
 * Execute task action functions.
 * First the non-async actions are executed synchronously then the
 * async actions are exectuted asynchronously.
 * Silently skip tasks that have no action function.
 */
export async function execute(...taskNames: string[]) {
  if (!isRunning) {
    // Necessary because the `run` API ensures the Drake cache file is saved.
    abort("'execute' API must be called by 'run' API");
  }
  await taskRegistry.execute(...taskNames);
}

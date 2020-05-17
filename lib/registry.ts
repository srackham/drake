import { env } from "./env.ts";
import { Action, Task, TaskRegistry } from "./tasks.ts";
import { abort } from "./utils.ts";

/** Global task registry. */
const taskRegistry = new TaskRegistry();

/** Set description of next registered task. */
export function desc(description: string): void {
  taskRegistry.desc(description);
}

/**
 * Create and register a task. Returns the task object.
 *
 * - `name` is a unique task name.
 * - `prereqs` is an array of prerequisite task names.  Prerequisites can be
 *   Normal task names, File task names, file paths or globs (wildcards).
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
 * indirect). If no `names` are specified then the command-line tasks are run.
 * If no command-line tasks were specified the default task (set in
 * `env("--default-task")`) is run.
 *
 * Task execution is ordered such that prerequisite tasks are executed prior to
 * their parent task. The same task is never run twice.
 */
export async function run(...names: string[]) {
  if (env("--help") || env("--version")) {
    return;
  }
  if (env("--list-tasks") || env("--list-all")) {
    taskRegistry.list().forEach((t: unknown) => console.log(t));
  } else {
    if (names.length === 0) {
      names = env("--tasks");
      if (names.length === 0 && env("--default-task")) {
        names.push(env("--default-task"));
      }
    }
    if (names.length === 0) {
      abort("no task specified");
    }
    await taskRegistry.run(...names);
  }
}

/**
 * Unconditionally execute task action functions asynchronously.
 * Silently skip tasks that have no action function.
 */
export async function execute(...names: string[]) {
  await taskRegistry.execute(...names);
}

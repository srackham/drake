export { desc, task, run, taskRegistry, Task, resolveActions };

import { env } from "./cli.ts";
import { manpage, vers } from "./manpage.ts";

type Action = () => void;

interface Task {
  name: string;
  desc: string;
  prereqs: string[];
  action: Action;
}

// Task registry.
type Tasks = { [name: string]: Task; };
const taskRegistry: Tasks = {};

let lastDesc: string;

// Set task description.
function desc(description: string): void {
  lastDesc = description;
}

// Register task.
function task(name: string, prereqs: string[], action?: Action): void {
  taskRegistry[name] = { name, desc: lastDesc, prereqs, action };
  lastDesc = ""; // Consume decription.
}

// Return a list of tasks and all dependent tasks, in first to last execution order,
// from the list of task names.
// TODO
// function resolveActions(tasks: Tasks, names: string[]): Tasks[] {
function resolveActions(names: string[]): string[] {
  const expand = function(names: string[]): string[] {
    // Recursively exoand prerequisites into task names list.
    let result: string[] = [];
    for (const name of names) {
      if (taskRegistry[name] === undefined) {
        throw new Error(`unknown task: ${name}`);
      }
      result.unshift(name);
      const prereqs = taskRegistry[name].prereqs;
      if (prereqs.length !== 0) {
        result = resolveActions(prereqs).concat(result);
      }
    }
    return result;
  };
  const result = [];
  for (const name of expand(names)) {
    // Drop downstream dups.
    if (result.indexOf(name) !== -1) {
      continue;
    }
    result.push(name);
  }
  return result;
}

function log(message: string) {
  if (!env["--quiet"]) {
    console.log(message);
  }
}

async function run() {
  if (env["--help"]) {
    console.log(`${manpage}\n`);
  } else if (env["--version"]) {
    console.log(vers);
  } else if (env["--list"]) {
    const keys: string[] = [];
    for (const k in taskRegistry) {
      keys.push(k);
    }
    const maxLen = keys.reduce(function(a, b) {
      return a.length > b.length ? a : b;
    }).length;
    for (const k of keys.sort()) {
      const task = taskRegistry[k];
      console.log(`${task.name.padEnd(maxLen + 1)} ${task.desc}`);
    }
  } else {
    const tasks = resolveActions(env["--tasks"]);
    // Run tasks.
    for (const task of tasks) {
      const action = taskRegistry[task].action;
      if (!action) continue;
      log(`Running ${task} ...`);
      if (action.constructor.name === "AsyncFunction") {
        await action();
      } else {
        action();
      }
    }
  }
}

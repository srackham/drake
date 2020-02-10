export { desc, task, run, tasksReg as tasks, Task };

import { opts } from "./cli.ts";
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
const tasksReg: Tasks = {};

let lastDesc: string;

// Set task description.
function desc(description: string): void {
  lastDesc = description;
}

// Register task.
function task(name: string, prereqs: string[], action: Action): void {
  tasksReg[name] = { name, desc: lastDesc, prereqs, action };
  lastDesc = ""; // Consume decription.
}

// Return a list of tasks and all dependent tasks, in first to last execution order,
// from the list of task names.
// TODO
// function resolveTasks(tasks: Tasks, names: string[]): Tasks[] {
function resolveTasks(names: string[]): string[] {
  const expand = function(names: string[]): string[] {
    // Recursively exoand prerequisites into task names list.
    let result: string[] = [];
    for (const name of names) {
      if (tasksReg[name] === undefined) {
        throw new Error(`unknown task: ${name}`);
      }
      result.unshift(name);
      const prereqs = tasksReg[name].prereqs;
      console.log("name: ", name, "prereqs:", prereqs);
      if (prereqs.length !== 0) {
        result = resolveTasks(prereqs).concat(result);
      }
      console.log("result:", result);
    }
    return result;
  };
  const result = [];
  for (const name of expand(names)) {
    // Drop downstream dups.
    if (result.indexOf(name) != -1) {
      continue;
    }
    result.push(name);
  }
  return result;
}

function run(): void {
  if (opts.help) {
    console.log(`${manpage}\n`);
  } else if (opts.vers) {
    console.log(vers);
  } else if (opts.list) {
    const keys: string[] = [];
    for (const k in tasksReg) {
      keys.push(k);
    }
    const maxLen = keys.reduce(function(a, b) {
      return a.length > b.length ? a : b;
    }).length;
    for (const k of keys.sort()) {
      const task = tasksReg[k];
      console.log(`${task.name.padEnd(maxLen + 1)} ${task.desc}`);
    }
  } else {
    const tasks = resolveTasks(opts.tasks);
    console.log("deduped result:", tasks);
    // Run tasks.
    for (const task of tasks) {
      tasksReg[task].action();
    }
  }
}

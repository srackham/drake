export { desc, task, run, taskReg };

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
type TaskReg = { [name: string]: Task; };
const taskReg: TaskReg = {};

let lastDesc: string;

// Set task description.
function desc(description: string): void {
  lastDesc = description;
}

// Register task.
function task(name: string, prereqs: string[], action: Action): void {
  taskReg[name] = { name, desc: lastDesc, prereqs, action };
  lastDesc = ""; // Consume decription.
}

// Return a list of tasks and all dependent tasks, in first to last execution order,
// from the list of task names.
function resolveTasks(names: string[]): string[] {
  const expand = function(names: string[]): string[] {
    // Recursively exoand prerequisites into task names list.
    let result: string[] = [];
    for (let name of names) {
      if (taskReg[name] === undefined) {
        throw new Error(`missing task: ${name}`);
      }
      result.unshift(name);
      let prereqs = taskReg[name].prereqs;
      console.log("name: ", name, "prereqs:", prereqs);
      if (prereqs.length !== 0) {
        result = resolveTasks(prereqs).concat(result);
      }
      console.log("result:", result);
    }
    return result;
  };
  let result = [];
  for (let name of expand(names)) {
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
    let keys: string[] = [];
    for (let k in taskReg) {
      keys.push(k);
    }
    for (let k of keys.sort()) {
      let task = taskReg[k];
      console.log(`${task.name}: ${task.desc}`);
    }
  } else {
    let tasks = resolveTasks(opts.tasks);
    console.log("deduped result:", tasks);
    // Run tasks.
    for (let task of tasks) {
      taskReg[task].action();
    }
  }
}

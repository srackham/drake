export { Action, Task, TaskRegistry };
import { Env } from "./cli.ts";

type Action = () => void;

interface Task {
  name: string;
  desc: string;
  prereqs: string[];
  action: Action;
}

type Tasks = { [name: string]: Task; };

class TaskRegistry {
  env: Env;
  tasks: Tasks;
  lastDesc: string;

  constructor(env: Env) {
    this.env = env;
    this.tasks = {};
    this.lastDesc = "";
  }

  desc(description: string): void {
    this.lastDesc = description;
  }

  register(name: string, prereqs: string[], action?: Action): void {
    this.tasks[name] = { name, desc: this.lastDesc, prereqs, action };
    this.lastDesc = ""; // Consume decription.
  }

  log(message: string) {
    if (!this.env["--quiet"]) {
      console.log(message);
    }
  }

  // Recursively exoand and flatten prerequisites into task names list.
  private expand(names: string[]): string[] {
    let result: string[] = [];
    for (const name of names) {
      if (this.tasks[name] === undefined) {
        throw new Error(`unknown task: ${name}`);
      }
      result.unshift(name);
      const prereqs = this.tasks[name].prereqs;
      if (prereqs.length !== 0) {
        result = this.resolveActions(prereqs).concat(result);
      }
    }
    return result;
  }

  // Return a list of tasks and all dependent tasks, in first to last execution order,
  // from the list of task names.
  resolveActions(names: string[]): string[] {
    const result = [];
    for (const name of this.expand(names)) {
      // Drop downstream dups.
      if (result.indexOf(name) !== -1) {
        continue;
      }
      result.push(name);
    }
    return result;
  }

  // Print list of tasks and task descriptions.
  list() {
    const keys: string[] = [];
    for (const k in this.tasks) {
      keys.push(k);
    }
    const maxLen = keys.reduce(function(a, b) {
      return a.length > b.length ? a : b;
    }).length;
    for (const k of keys.sort()) {
      const task = this.tasks[k];
      console.log(`${task.name.padEnd(maxLen + 1)} ${task.desc}`);
    }
  }

  // Resolve task names and run tasks.
  async run(names: string[]) {
    const tasks = this.resolveActions(names);
    // Run tasks.
    for (const task of tasks) {
      const action = this.tasks[task].action;
      if (!action) continue;
      this.log(`Running ${task} ...`);
      if (!this.env["--dry-run"]) {
        if (action.constructor.name === "AsyncFunction") {
          await action();
        } else {
          action();
        }
      }
    }
  }
}

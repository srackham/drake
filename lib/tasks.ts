export { Action, Task, TaskRegistry };
import * as path from "https://deno.land/std@v0.32.0/path/mod.ts";
import { Env } from "./cli.ts";

type Action = () => void;

class Task {
  name: string;
  desc: string;
  prereqs: string[];
  action: Action;

  isFileTask(): boolean {
    return path.isAbsolute(this.name) || this.name.startsWith(".");
  }
}

class TaskRegistry extends Map<string, Task> {
  env: Env;
  lastDesc: string;

  constructor(env: Env) {
    super();
    this.env = env;
    this.lastDesc = "";
  }

  desc(description: string): void {
    this.lastDesc = description;
  }

  register(name: string, prereqs: string[], action?: Action): void {
    const task = new Task();
    task.name = name;
    task.desc = this.lastDesc;
    this.lastDesc = ""; // Consume decription.
    task.prereqs = prereqs;
    task.action = action;
    this.set(name, task);
  }

  log(message: string): void {
    if (!this.env["--quiet"]) {
      console.log(message);
    }
  }

  // Recursively exoand and flatten prerequisites into task names list.
  private expand(names: string[]): string[] {
    let result: string[] = [];
    for (const name of names) {
      if (this.get(name) === undefined) {
        throw new Error(`missing task: ${name}`);
      }
      result.unshift(name);
      const prereqs = this.get(name).prereqs;
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
  list(): void {
    const keys = Array.from(this.keys());
    const maxLen = keys.reduce(function(a, b) {
      return a.length > b.length ? a : b;
    }).length;
    for (const k of keys.sort()) {
      const task = this.get(k);
      console.log(`${task.name.padEnd(maxLen)} ${task.desc}`);
    }
  }

  // Resolve task names and run tasks.
  async run(names: string[]) {
    const tasks = this.resolveActions(names);
    // Run tasks.
    for (const task of tasks) {
      const action = this.get(task).action;
      if (!action) continue;
      this.log(`task: ${task}`);
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

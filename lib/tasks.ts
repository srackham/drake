export { Action, Task, TaskRegistry };
import { bold, green } from "https://deno.land/std@v0.33.0/fmt/colors.ts";
import { existsSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import { isAbsolute } from "https://deno.land/std@v0.33.0/path/mod.ts";
import { Env } from "./cli.ts";

type Action = () => any;

// Return true if name is a file task name i.e. an absolute file name path or a relative path
// starting with '.'.
// Throw error is name contains wildcards.
function isFileName(name: string): boolean {
  if (/[*?]/.test(name)) {
    throw new Error(`wildcard names are not allowed: ${name}`);
  }
  return isAbsolute(name) || name.startsWith(".");
}

class Task {
  name: string;
  desc: string;
  prereqs: string[];
  action: Action;

  // Return false if the task is not a file task.
  // Return false if the task name file does not exist.
  // Return true if the task name file exists and is newer than all prerequisite files
  // otherwise return false.
  // Throw error if any prerequisite path does not exists.
  isUpToDate(): boolean {
    if (!isFileName(this.name)) {
      return false;
    }
    // Check all prerequisite paths exist.
    for (const name of this.prereqs) {
      if (!isFileName(name)) {
        continue;
      }
      if (!existsSync(name)) {
        throw new Error(
          `task: ${this.name}: missing prerequisite path: ${name}`
        );
      }
    }
    if (!existsSync(this.name)) {
      return false;
    }
    const target = Deno.statSync(this.name);
    for (const name of this.prereqs) {
      if (!isFileName(name)) {
        continue;
      }
      const prereq = Deno.statSync(this.name);
      if (target.modified < prereq.modified) {
        return false;
      }
    }
    return true;
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
    if (action) {
      task.action = action.bind(task);
    }
    this.set(name, task);
  }

  log(message: string): void {
    if (!this.env["--quiet"]) {
      console.log(message);
    }
  }

  // Recursively exoand and flatten prerequisites into task names list.
  // Throw error if non-file task is missing.
  private expand(names: string[]): Task[] {
    let result: Task[] = [];
    names.reverse(); // So the result maintains the same order.
    for (const name of names) {
      const task = this.get(name);
      if (task === undefined) {
        if (isFileName(name)) { // Allow missing file name prerequisite tasks.
          continue;
        }
        throw new Error(`missing task: ${name}`);
      }
      result.unshift(task);
      const prereqs = task.prereqs;
      if (prereqs.length !== 0) {
        result = this.resolveActions(prereqs).concat(result);
      }
    }
    return result;
  }

  // Return a list of tasks and all dependent tasks, from the list of task names.
  // Ordered in first to last execution order,
  resolveActions(names: string[]): Task[] {
    const result: Task[] = [];
    for (const task of this.expand(names)) {
      // Drop downstream dups.
      if (result.find(t => t.name === task.name)) {
        continue;
      }
      result.push(task);
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
      console.log(`${green(bold(task.name.padEnd(maxLen)))} ${task.desc}`);
    }
  }

  // Resolve task names and run tasks.
  async run(targets: string[]) {
    for (const name of targets) {
      if (this.get(name) === undefined) {
        throw new Error(`missing task: ${name}`);
      }
    }
    const tasks = this.resolveActions(targets);
    this.log(`${green(bold("resolved targets"))}: ${tasks.map(t => t.name)}`);
    // Run tasks.
    for (const task of tasks) {
      if (!task.action) {
        continue;
      }
      if (!this.env["--always-make"] && task.isUpToDate()) {
        continue;
      }
      const startTime = new Date().getTime();
      this.log(green(bold(`${task.name} started`)));
      if (!this.env["--dry-run"]) {
        if (task.action.constructor.name === "AsyncFunction") {
          await task.action();
        } else {
          task.action();
        }
        const endTime = new Date().getTime();
        this.log(
          green(bold(`${task.name} finished`)) +
            ` in ${((endTime - startTime) / 1000).toFixed(2)} seconds`
        );
      }
    }
  }
}

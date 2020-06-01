import { colors, existsSync, path } from "./deps.ts";
import { env } from "./env.ts";
import { Graph } from "./graph.ts";
import {
  abort,
  debug,
  DrakeError,
  glob,
  log,
  readFile,
  vers,
  writeFile,
} from "./utils.ts";

export type Action = (this: Task) => any;

type FileCache = {
  size: number;
  mtime: string;
};
type TaskCache = {
  [filename: string]: FileCache;
};
type RegistryCache = {
  [task: string]: TaskCache;
};

/** Drake cache file contents. */
type DrakeCache = {
  version: string;
  os: string;
  tasks: RegistryCache;
};

/** Drake task. */
export class Task {
  /** Unique task name or file path */
  name: string;
  desc: string;
  prereqs: string[];
  action?: Action;
  cache?: TaskCache;

  /**
   * Create a new task.
   * Task name and prerequisite names are normalized.
   */
  constructor(name: string, desc: string, prereqs: string[], action?: Action) {
    name = normalizeTaskName(name);
    this.name = name;
    this.desc = desc;
    prereqs = normalizePrereqs(prereqs);
    const dup = prereqs.find((x) =>
      prereqs.indexOf(x) !== prereqs.lastIndexOf(x)
    );
    if (dup) {
      abort(`${name}: duplicate prerequisite: ${dup}`);
    }
    this.prereqs = prereqs;
    if (action) {
      this.action = action.bind(this);
    }
  }

  private static fileInfo(path: string): FileCache {
    const info = Deno.statSync(path);
    if (!info.mtime) {
      abort(`${path}: invalid mtime: ${info.mtime}`);
    }
    return {
      size: info.size,
      mtime: info.mtime.toISOString(),
    };
  }

  updateCache(): void {
    const taskCache: TaskCache = {};
    if (existsSync(this.name)) {
      taskCache[this.name] = Task.fileInfo(this.name);
    }
    for (const prereq of this.prereqs) {
      if (isFileTask(prereq)) {
        if (existsSync(prereq)) {
          const info = Deno.statSync(prereq);
          taskCache[prereq] = Task.fileInfo(prereq);
        }
      } else {
        delete taskCache[prereq];
      }
    }
    debug("updateCache", `${this.name}`);
    this.cache = taskCache;
  }

  /**
   * Return `true` if:
   * 
   * - The target file does not exist.
   * - The target file or any of the prerequisite files have changed
   *   since the task was last executed successfully.
   * - The Drake version or the operating system has changed
   *   since the task was last executed successfully.
   * 
   * Throw error is one or more prerequisite files are missing.
   */
  isOutOfDate(): boolean {
    const prereqs = this.prereqs.filter((p) => isFileTask(p));
    let result = false;
    let debugMsg = "false";
    for (const prereq of prereqs) {
      if (!existsSync(prereq)) {
        if (env("--dry-run")) {
          // Assume the missing prerequisite would have been created thus rendering the target out of date.
          debugMsg = `true: dry run`;
          result = true;
          break;
        }
        abort(`${this.name}: missing prerequisite file: "${prereq}"`);
      }
    }
    if (result) {
      // Break.
    } else if (!this.cache) {
      debugMsg = "true: no previous task cache";
      result = true;
    } else if (!existsSync(this.name)) {
      debugMsg = "true: no target file";
      result = true;
    } else {
      for (const filename of [this.name, ...prereqs]) {
        const prev = this.cache[filename];
        if (!prev) {
          debugMsg = `true: no previous cache: ${filename}`;
          result = true;
          break;
        }
        const curr = Task.fileInfo(filename);
        if (
          curr.size !== prev.size || curr.mtime !== prev.mtime
        ) {
          debugMsg = `true: ${filename}\nfrom: ${JSON.stringify(prev)}\nto:   ${
            JSON.stringify(curr)
          }`;
          result = true;
          break;
        }
      }
    }
    debug("isOutOfDate", `${this.name}: ${debugMsg}`);
    return result;
  }
}

/** Task registry map. */
export class TaskRegistry extends Map<string, Task> {
  lastDesc: string;

  constructor() {
    super();
    this.lastDesc = "";
  }

  /**
   * Lookup task by task name.
   * Throw error if task does not exist.
   */
  get(name: string): Task {
    name = normalizeTaskName(name);
    if (!this.has(name)) {
      abort(`missing task: ${name}`);
    }
    return super.get(name)!;
  }

  /**
   * Add task to registry.
   * Throw error if task is already registered.
   */
  set(name: string, task: Task) {
    name = normalizeTaskName(name);
    if (this.has(name)) {
      abort(`task already exists: ${name}`);
    }
    return super.set(name, task);
  }

  /** Set description of next registered task. */
  desc(description: string): void {
    this.lastDesc = description;
  }

  /** Create and register a task. */
  register(name: string, prereqs: string[], action?: Action): void {
    debug("register", `${name}: ${this.lastDesc}`);
    this.set(name, new Task(name, this.lastDesc, prereqs, action));
    this.lastDesc = ""; // Consume description.
  }

  cacheFile(): string {
    return path.join(env("--directory"), ".drake.cache.json");
  }

  loadCache(): void {
    const filename = this.cacheFile();
    if (!existsSync(filename)) {
      debug("loadCache:", `no cache file: ${filename}`);
      return;
    }
    debug("loadCache");
    const json = readFile(filename);
    let cache: DrakeCache;
    let deleteCache = false;
    try {
      cache = JSON.parse(json);
      if (cache.version !== vers()) {
        log(`drake version changed: deleting cache file: ${filename}`);
        deleteCache = true;
      } else if (cache.os !== Deno.build.os) {
        log(`operating system changed: deleting cache file: ${filename}`);
        deleteCache = true;
      } else {
        for (const taskname of Object.keys(cache.tasks)) {
          if (this.has(taskname)) {
            this.get(taskname).cache = cache.tasks[taskname];
          }
        }
      }
    } catch {
      abort(`corrupt cache file: ${filename}`);
    }
    if (deleteCache) {
      Deno.removeSync(filename);
    }
  }

  saveCache(): void {
    if (env("--dry-run")) {
      debug("saveCache", "dry run");
      return;
    }
    const filename = this.cacheFile();
    const tasksCache: RegistryCache = {};
    for (const task of this.values()) {
      if (isFileTask(task.name) && task.cache) {
        tasksCache[task.name] = task.cache;
      }
    }
    if (Object.keys(tasksCache).length !== 0) {
      debug("saveCache");
      const cache: DrakeCache = {
        version: vers(),
        os: Deno.build.os,
        tasks: tasksCache,
      } as const;
      writeFile(filename, JSON.stringify(cache, null, 1));
    } else {
      debug("saveCache", "no cache");
    }
  }

  /** Create a printable list of tasks. */
  list(): string[] {
    let keys = Array.from(this.keys());
    if (!env("--list-all")) {
      keys = keys.filter((k) => this.get(k).desc); // Drop "hidden" tasks.
    }
    const maxLen = keys.reduce(function (a, b) {
      return a.length > b.length ? a : b;
    }).length;
    const result: string[] = [];
    for (const k of keys.sort()) {
      const task = this.get(k);
      const padding = " ".repeat(maxLen - k.length);
      let msg = k;
      if (k === env("--default-task")) {
        msg = colors.underline(msg);
      }
      msg += padding;
      if (task.desc) {
        msg = `${colors.green(colors.bold(msg))} ${task.desc}`;
      } else {
        msg = colors.green(msg);
      }
      if (env("--list-all") && task.prereqs.length > 0) {
        msg += `\n${
          task.prereqs.map((prereq) =>
            `${" ".repeat(maxLen)} ${colors.yellow(prereq)}`
          ).join("\n")
        }`;
      }
      result.push(msg);
    }
    return result;
  }

  /**
   * Recursively expand prerequisites and return a list of prerequisite tasks.
   */
  private expand(names: string[]): Task[] {
    let result: Task[] = [];
    names = [...names];
    names.reverse(); // Result maintains the same order as the list of names.
    for (const name of names) {
      if (isFileTask(name) && !this.has(name)) {
        continue; // Ignore prerequisite paths that don't have a task.
      }
      const task = this.get(name);
      for (const prereq of task.prereqs) {
        if (isNormalTask(prereq) && !this.has(prereq)) {
          abort(`${name}: missing prerequisite task: ${prereq}`);
        }
        if (isNormalTask(name) && isFileTask(prereq) && !this.has(prereq)) {
          // A prerequisite path without a matching task does nothing in a normal task.
          abort(`${name}: missing prerequisite task: ${prereq}`);
        }
      }
      result.unshift(task);
      result = [...this.resolveDependencies(task.prereqs), ...result];
    }
    return result;
  }

  /**
   * Return a list of tasks and all dependent tasks from the list of task names.
   * Ordered in first to last execution order,
   */
  resolveDependencies(names: string[]): Task[] {
    const result: Task[] = [];
    for (const task of this.expand(names)) {
      // Drop downstream duplicates.
      if (result.find((t) => t.name === task.name)) {
        continue;
      }
      result.push(task);
    }
    return result;
  }

  /** Throw error if there are one or more task dependency cycles. */
  checkForCycles(): void {
    const graph = new Graph();
    for (const task of this.keys()) {
      graph.addNode(task, this.get(task).prereqs.filter((p) => this.has(p)));
    }
    graph.searchForCycles();
    if (graph.errors.length > 0) {
      abort(graph.errors.join(", "));
    }
  }

  /**
   * Run tasks and prerequisite tasks in the correct dependency order.
   */
  async run(...names: string[]) {
    names = names.map((name) => normalizeTaskName(name));
    for (const name of names) {
      if (!this.has(name)) {
        abort(`missing task: ${name}`);
      }
    }
    this.loadCache();
    this.checkForCycles();
    const tasks = this.resolveDependencies(names);
    debug("run", `${names.join(" ")}`);
    for (const task of tasks) {
      const savedAbortExits = env("--abort-exits");
      env().setValue("--abort-exits", false);
      try {
        if (isNormalTask(task.name)) {
          await this.executeNormalTask(task);
        } else {
          await this.executeFileTask(task);
        }
        env().setValue("--abort-exits", savedAbortExits);
      } catch (e) {
        env().setValue("--abort-exits", savedAbortExits);
        this.saveCache();
        if (e instanceof DrakeError) {
          abort(e.message);
        } else {
          throw e;
        }
      }
    }
    this.saveCache();
  }

  /**
   * Unconditionally execute normal task.
   */
  private async executeNormalTask(task: Task) {
    await this.execute(task.name);
  }

  /**
   * Execute file task if it is out of date.
   */
  private async executeFileTask(task: Task) {
    if (!env("--always-make") && !task.isOutOfDate()) {
      log(colors.yellow(`${task.name}:`) + " up to date");
      return;
    }
    await this.execute(task.name);
    task.updateCache();
  }

  /**
   * Unconditionally execute task action functions asynchronously.
   * Silently skip tasks that have no action function.
   */
  async execute(...names: string[]) {
    names = names.map((name) => normalizeTaskName(name));
    if (names.every((name) => !this.get(name).action)) {
      log(colors.yellow(`${names}:`) + " no action");
      return;
    }
    if (env("--dry-run")) {
      log(`${colors.green(colors.bold(`${names}:`))} dry run`);
      return;
    }
    const msg = names.join(" ");
    const startTime = logStart(msg);
    const promises: Promise<any>[] = [];
    for (const name of names) {
      const task = this.get(name);
      if (!task.action) {
        log(colors.yellow(`${name}:`) + " no action");
        continue;
      }
      if (task.action.constructor.name === "AsyncFunction") {
        promises.push(task.action());
      } else {
        task.action();
      }
    }
    await Promise.all(promises);
    logFinish(msg, startTime);
  }
}

function logStart(message: string): number {
  log(`${colors.green(colors.bold(`${message}:`))} started`);
  return new Date().getTime();
}

function logFinish(message: string, startTime: number): void {
  const endTime = new Date().getTime();
  log(
    `${colors.green(colors.bold(`${message}:`))} finished (${endTime -
      startTime}ms)`,
  );
}

/* Helper functions */

/**
 * Return true if `name` is a normal task name. Normal task names contain one or more alphanumeric,
 * underscore and hyphen characters and cannot start with a hyphen.
 *
 *     isNormalTask("hello-world")    // true
 *     isNormalTask("io.ts")          // false
 *     isNormalTask("./hello-world")  // false
 *
 */
export function isNormalTask(name: string): boolean {
  return /^\w[\w-]*$/.test(name);
}

/**
 * Return true if `name` is a file task name. File task names are valid file paths.
 * 
 *     isFileTask("io.ts")          // true
 *     isFileTask("hello-world")    // false
 *     isFileTask("./hello-world")  // true
 * 
 */
export function isFileTask(name: string): boolean {
  return !isNormalTask(name);
}

/**
 * The path name is normalized and, if necessary, prefixed with a period and path separator to
 * distinguish it from non-file task name.
 *
 *     normalizePath("hello-world")   // "./hello-world"
 *     normalizePath("./lib/io.ts")   // "lib/io.ts"
 */
export function normalizePath(name: string): string {
  name = path.normalize(name);
  if (isNormalTask(name)) {
    name = "." + path.sep + name;
  }
  return name;
}

/** Normalize Drake task name. Throw an error if the name is blank or it contains wildcard
 * characters.
 */
export function normalizeTaskName(name: string): string {
  name = name.trim();
  if (name === "") {
    abort("blank task name");
  }
  if (path.isGlob(name)) {
    abort(`wildcard task name not allowed: ${name}`);
  }
  if (isFileTask(name)) {
    name = normalizePath(name);
  }
  return name;
}

/**
 * Return a list prerequisite task names.
 * Globs are expanded and path names are normalized.
 */
export function normalizePrereqs(prereqs: string[]): string[] {
  const result: string[] = [];
  for (let prereq of prereqs) {
    prereq = prereq.trim();
    if (prereq === "") {
      abort("blank prerequisite name");
    }
    if (!isFileTask(prereq)) {
      result.push(prereq);
    } else if (path.isGlob(prereq)) {
      result.push(...glob(prereq).map((p) => normalizePath(p)));
    } else {
      result.push(normalizePath(prereq));
    }
  }
  return result;
}

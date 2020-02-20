import { walkSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.33.0/path/mod.ts";

class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

/** Throw `DrakeError` with error message to terminate execution. */
export function abort(message: string): void {
  throw new DrakeError(message);
}

/**
 * Quote string array values with double-quotes then join them with a separator.
 * Double-quote characters are escaped with a backspace.
 * The separator defaults to a space character.
 */
export function quote(values: string[], sep: string = " "): string {
  values = values.map(value => `"${value.replace(/"/g, "\\\"")}"`);
  return values.join(sep);
}

/**
 * Return true if name is a file task name. A task is a file task if its name contains characters
 * that are not alphanumeric, underscore or dash characters.
 */
export function isFileTask(name: string): boolean {
  return !/^[\w-]+$/.test(name);
}

/**
 * The path name is normalized and the relative path names are guaranteed to start with a `.`
 * character (to distinguish them from non-file task names).
 */
export function normalizePath(name: string): string {
  name = path.normalize(name);
  if (!path.isAbsolute(name)) {
    if (!name.startsWith(".")) {
      name = "." + path.sep + name;
    }
  }
  return name;
}

/** Normalise Drake target name. */
export function normalizeTarget(name: string): string {
  name = name.trim();
  if (name === "") {
    abort("blank target name");
  }
  if (path.isGlob(name)) {
    abort(`wildcard target not allowed: ${name}`);
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
      result.push(...glob(prereq));
    } else {
      result.push(normalizePath(prereq));
    }
  }
  return result;
}

/**
 * Return array of normalized file names matching the glob patterns.
 * e.g. `glob("tmp/*.ts", "lib/*.ts", "mod.ts");`
 */
export function glob(...patterns: string[]): string[] {
  const regexps = patterns.map(pat => path.globToRegExp(path.normalize(pat)));
  const iter = walkSync(".", { match: regexps, includeDirs: false });
  return Array.from(iter, info => normalizePath(info.filename));
}

/** Start shell command and return status promise. */
function launch(command: string): Promise<Deno.ProcessStatus> {
  let args: string[];
  if (Deno.build.os === "win") {
    args = [Deno.env("COMSPEC"), "/C", command];
  } else {
    args = [Deno.env("SHELL"), "-c", command];
  }
  // create subprocess
  const p = Deno.run({
    args: args,
    stdout: "inherit"
  });
  return p.status();
}

/**
 * Execute shell commands.
 * If `commands` is a string execute it in the command shell.
 * If `commands` is an array of commands execute them in parallel.
 * If any command fails throw an error.
 */
export async function sh(commands: string | string[]) {
  let cmd: string;
  let code: number;
  if (typeof commands === "string") {
    cmd = commands;
    code = (await launch(commands)).code;
  } else {
    const promises = [];
    for (const cmd of commands) {
      promises.push(launch(cmd));
    }
    const results = await Promise.all(promises);
    for (const i in results) {
      cmd = commands[i];
      code = results[i].code;
      if (code !== 0) {
        break;
      }
    }
  }
  if (code !== 0) {
    abort(`sh: ${cmd}: error code: ${code}`);
  }
}

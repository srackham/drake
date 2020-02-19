import { walkSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.33.0/path/mod.ts";

class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

/**
 * Throw `DrakeError` with error message to terminate execution.
 */
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
 * Return true if name is a normal task name i.e. not a file path.
 */
export function isTaskName(name: string): boolean {
  return /^[\w-]+$/.test(name);
}

/**
 * Ensure file name confirms to Deno module path name convention
 * i.e. is an absolute file path or starts with a '.' character.
 */
export function normalizeModulePath(name: string): string {
  if (!path.isAbsolute(name)) {
    return "." + path.sep + path.normalize(name);
  }
  return name;
}

/**
 * Normalise Drake target name.
 */
export function normalizeTarget(name: string): string {
  if (path.isGlob(name)) {
    abort(`wildcard target not allowed: ${name}`);
  }
  if (!isTaskName(name)) {
    name = normalizeModulePath(name);
  }
  return name;
}

/**
 * Return a list of normalized prerequisite names.
 * Globs are expanded.
 */
export function normalizePrereqs(prereqs: string[]): string[] {
  const result: string[] = [];
  for (const prereq of prereqs) {
    if (isTaskName(prereq)) {
      result.push(prereq);
    } else if (path.isGlob(prereq)) {
      result.push(...glob(prereq));
    } else {
      result.push(normalizeModulePath(prereq));
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
  return Array.from(iter, info => normalizeModulePath(info.filename));
}

/**
 * Start shell command and return status promise.
 */
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

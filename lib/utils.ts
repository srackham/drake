import { walkSync } from "https://deno.land/std@v0.34.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.34.0/path/mod.ts";

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
  values = values.map(value => `"${value.replace(/"/g, '\\"')}"`);
  return values.join(sep);
}

/** Read the entire contents of a file synchronously to a UTF-8 string. */
export function readFile(filename: string): string {
  return new TextDecoder("utf-8").decode(Deno.readFileSync(filename));
}

/** Write text to a new file with given filename synchronously. */
export function writeFile(filename: string, text: string): void {
  Deno.writeFileSync(filename, new TextEncoder().encode(text));
}

/** Find and replace in text file synchronously. */
export function updateFile(
  filename: string,
  find: RegExp,
  replace: string
): void {
  writeFile(filename, readFile(filename).replace(find, replace));
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
  const shellVar = Deno.build.os === "win" ? "COMSPEC" : "SHELL";
  let shellExe = Deno.env(shellVar);
  if (shellExe === undefined) {
    abort(`cannot locate shell: missing ${shellVar} environment variable`);
  }
  shellExe = (shellExe as string).trim();
  if (!shellExe) {
    abort(`cannot locate shell: blank ${shellVar} environment variable`);
  }
  if (Deno.build.os === "win") {
    args = [shellExe, "/C", command];
  } else {
    args = [shellExe, "-c", command];
  }
  // create subprocess
  const p = Deno.run({
    args: args,
    stdout: "inherit"
  });
  return p.status();
}

/**
 * Execute commands in the command shell.
 * If `commands` is a string execute it.
 * If `commands` is an array of commands execute them in parallel.
 * If any command fails throw an error.
 */
export async function sh(commands: string | string[]) {
  if (typeof commands === "string") {
    commands = [commands];
  }
  const promises = [];
  for (const cmd of commands) {
    promises.push(launch(cmd));
  }
  const results = await Promise.all(promises);
  for (const i in results) {
    const cmd = commands[i];
    const code = results[i].code;
    if (code === undefined) {
      abort(`sh: ${cmd}: undefined exit code`);
    }
    if (code !== 0) {
      abort(`sh: ${cmd}: error code: ${code}`);
    }
  }
}

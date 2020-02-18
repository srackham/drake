import { walkSync } from "https://deno.land/std@v0.33.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.33.0/path/mod.ts";

class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

export function abort(message: string): void {
  throw new DrakeError(message);
}

// Return true if name is a normal task name i.e. not a file path.
export function isTaskName(name: string): boolean {
  return /^[\w-]+$/.test(name);
}

// Ensure file name confirms to Deno module path name convention
// i.e. is an absolute file path or starts with a '.' character.
export function normalizeModulePath(name: string): string {
  if (!path.isAbsolute(name)) {
    return "." + path.sep + path.normalize(name);
  }
  return name;
}

// Normalise the target name.
export function normalizeTarget(name: string): string {
  if (path.isGlob(name)) {
    abort(`wildcard target not allowed: ${name}`);
  }
  if (!isTaskName(name)) {
    name = normalizeModulePath(name);
  }
  return name;
}

// Return a list of normalized prerequisite names and expanded globs.
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

// Return array of normalized file names matching the glob patterns.
// e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
export function glob(...patterns: string[]): string[] {
  const regexps = patterns.map(pat => path.globToRegExp(path.normalize(pat)));
  const iter = walkSync(".", { match: regexps, includeDirs: false });
  return Array.from(iter, info => normalizeModulePath(info.filename));
  // return Array.from(iter, info => info.filename);
}

// Start shell command and return status promise.
function launch(cmd: string): Promise<Deno.ProcessStatus> {
  let args: string[];
  if (Deno.build.os === "win") {
    args = [Deno.env("COMSPEC"), "/C", cmd];
  } else {
    args = [Deno.env("SHELL"), "-c", cmd];
  }
  // create subprocess
  const p = Deno.run({
    args: args,
    stdout: "inherit"
  });
  return p.status();
}

// Execute shell commands.
// If 'cmds` is a string execute it in the command shell.
// If 'cmds` is a string array execute each command in parallel.
// If any command fails throw and error.
export async function sh(cmds: string | string[]) {
  let cmd: string;
  let code: number;
  if (typeof cmds === "string") {
    cmd = cmds;
    code = (await launch(cmds)).code;
  } else {
    const promises = [];
    for (const cmd of cmds) {
      promises.push(launch(cmd));
    }
    const results = await Promise.all(promises);
    for (const i in results) {
      cmd = cmds[i];
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

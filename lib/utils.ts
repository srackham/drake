import { bold, red } from "https://deno.land/std@v0.35.0/fmt/colors.ts";
import { walkSync } from "https://deno.land/std@v0.35.0/fs/mod.ts";
import * as path from "https://deno.land/std@v0.35.0/path/mod.ts";

export class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

type Env = { [name: string]: any; "--tasks": string[] };

/**
  * The Drake `env` object contains the command-line options, tasks an variables:
  *
  * Options are keyed by their long option name e.g.  `env["--dry-run"]`. Unspecified flag options
  * are undefined; unspecified value options are assigned their default value.
  *
  * Tasks names are stored in the `env["--tasks"]` string array. A default task can be specified by
  * setting `env["--default-task"]` to the task name.
  *
  * Variable values are keyed by name. For example `vers=1.0.1` on the command-line is available as
  * `env["vers"]` and `env.vers`.
  */
export const env: Env = { "--tasks": [] };

export function parseEnv(args: string[], env: Env): void {
  let arg: string | undefined;
  while (!!(arg = args.shift())) {
    const match = arg.match(/^([a-zA-Z]\w*)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
      continue;
    }
    switch (arg) {
      case "-a":
      case "--always-make":
        env["-a"] = true;
        env["--always-make"] = true;
        break;
      case "-d":
      case "--directory":
        arg = args.shift();
        if (arg === undefined) {
          abort("missing --directory option value");
        }
        env["--directory"] = arg;
        break;
      case "-f":
      case "--drakefile":
        arg = args.shift();
        if (arg === undefined) {
          abort("missing --drakefile option value");
        }
        env["--drakefile"] = arg;
        break;
      case "-h":
      case "--help":
        env["--help"] = true;
        break;
      case "-l":
      case "--list-tasks":
        env["--list-tasks"] = true;
        break;
      case "-n":
      case "--dry-run":
        env["--dry-run"] = true;
        break;
      case "-q":
      case "--quiet":
        env["--quiet"] = true;
        break;
      case "--version":
        env["--version"] = true;
        break;
      default:
        if (arg.startsWith("-")) {
          abort(`illegal option: ${arg}`);
        }
        env["--tasks"].push(arg);
        break;
    }
  }
}

/** Print error message to to `stderr` and terminate execution. */
export function abort(message: string): never {
  if (env["--abort-exits"]) {
    console.error(`${red(bold("drake error:"))} ${message}`);
    Deno.exit(1);
  } else {
    throw new DrakeError(message);
  }
}

/**
 * Log a message to the console. Do not log the message if the `--quiet` command-line option is set.
 */
export function log(message: string): void {
  if (!env["--quiet"]) {
    console.log(message);
  }
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

/* Write text to a file synchronously. If the file exists it will be overwritten. */
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

/** Normalise Drake task name. Throw an error if the name is blank or it contains wildcard
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
      result.push(...glob(prereq));
    } else {
      result.push(normalizePath(prereq));
    }
  }
  return result;
}

/**
 * Return a  sorted array of normalized file names matching the wildcard patterns.
 * Wildcard patterns can include the `**` (globstar) pattern.
 * e.g. `glob("tmp/*.ts", "lib/*.ts", "mod.ts");`
 */
export function glob(...patterns: string[]): string[] {
  function glob1(pattern: string): string[] {
    const globOptions = { extended: true, globstar: true };
    pattern = path.normalizeGlob(pattern, globOptions);
    let root = path.dirname(pattern);
    while (root !== "." && path.isGlob(root)) {
      root = path.dirname(root);
    }
    const regexp = path.globToRegExp(pattern, globOptions);
    const iter = walkSync(root, { match: [regexp], includeDirs: false });
    return Array.from(iter, info => info.filename);
  }
  let result: string[] = [];
  for (const pattern of patterns) {
    result = [...result, ...glob1(pattern)];
  }
  // Drop dups, normalise and sort paths.
  return [...new Set(result)].map(p => normalizePath(p)).sort();
}

function shArgs(command: string): [string[], string | undefined] {
  let args: string[];
  let cmdFile: string | undefined;
  if (Deno.build.os === "win") {
    cmdFile = Deno.makeTempFileSync(
      { prefix: "drake_", suffix: ".bat" }
    );
    writeFile(cmdFile, `@echo off\n${command}`);
    args = [cmdFile];
  } else {
    const shellExe = Deno.env("SHELL")!;
    if (!shellExe) {
      abort(`cannot locate shell: missing SHELL environment variable`);
    }
    args = [shellExe, "-c", command];
  }
  return [args, cmdFile];
}

export interface ShOpts {
  cwd?: string;
  env?: { [key: string]: string };
  stdout?: Deno.ProcessStdio;
  stderr?: Deno.ProcessStdio;
}

/**
 * Execute commands in the command shell.
 * 
 * - If `commands` is a string execute it.
 * - If `commands` is an array of commands execute them asynchronously.
 * - If any command fails throw an error.
 * - If `opts.stdout` or `opts.stderr` is set to `"null"` then the respective outputs are ignored.
 * - `opts.cwd` sets the shell current working directory (defaults to the parent process working directory).
 * - The `opts.env` mapping passes additional environment variables to the shell.
 * 
 * Examples:
 * 
 *     await sh("echo Hello World");
 *     await sh(["echo Hello 1", "echo Hello 2", "echo Hello 3"]);
 *     await sh("echo Hello World", { stdout: "null" });
 */
export async function sh(commands: string | string[], opts: ShOpts = {}) {
  if (typeof commands === "string") {
    commands = [commands];
  }
  const tempFiles: string[] = [];
  const promises = [];
  for (const cmd of commands) {
    let args: string[];
    let cmdFile: string | undefined;
    [args, cmdFile] = shArgs(cmd);
    if (cmdFile) tempFiles.push(cmdFile);
    const p = Deno.run({
      args: args,
      cwd: opts.cwd,
      env: opts.env,
      stdout: opts.stdout ?? "inherit",
      stderr: opts.stderr ?? "inherit"
    });
    promises.push(p.status());
  }
  const results = await Promise.all(promises);
  for (const f of tempFiles) {
    Deno.removeSync(f);
  }
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

export type ShOutput = {
  code: number | undefined;
  output: string;
  error: string;
};

export interface ShCaptureOpts extends ShOpts {
  input?: string;
}

/**
 * Execute `command` in the command shell and return a promise for the exit `code`, `output` (the
 * stdout output) and `error` (the stderr output).
 *
 * - If the `opts.input` string has been assigned then it is piped to the shell `stdin`.
 * - `opts.cwd` sets the shell current working directory (defaults to the parent process working
 *   directory).
 * - The `opts.env` mapping passes additional environment variables to the shell.
 * - `opts.stdout` and `opts.stderr` have `Deno.ProcessStdio` semantics and default to `"piped"`.
 *
 * Examples:
 *
 *     const { code, stdout, stderr } = await shCapture("echo Hello"); 
 */
export async function shCapture(
  command: string,
  opts: ShCaptureOpts = {}
): Promise<ShOutput> {
  let args: string[];
  let cmdFile: string | undefined;
  [args, cmdFile] = shArgs(command);
  const p = Deno.run({
    args: args,
    cwd: opts.cwd,
    env: opts.env,
    stdin: opts.input !== undefined ? "piped" : undefined,
    stdout: opts.stdout ?? "piped",
    stderr: opts.stderr ?? "piped"
  });
  if (p.stdin) {
    await p.stdin.write(new TextEncoder().encode(opts.input));
    p.stdin.close();
  }
  const [status, stdout, stderr] = await Promise.all(
    [p.status(), p.output(), p.stderrOutput()]
  );
  if (cmdFile) Deno.removeSync(cmdFile);
  return {
    code: status.code,
    output: new TextDecoder().decode(stdout),
    error: new TextDecoder().decode(stderr)
  };
}

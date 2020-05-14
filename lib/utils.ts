import { colors, existsSync, path, walkSync } from "../deps.ts";

export class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

/**
 * The Drake `env` API function gets and optionally sets the command-line
 * options, task names and variables.
 *
 * Options are keyed by their long option name e.g.  `env("--dry-run")`.
 * Command-line flag options are set to `true`. Unspecified option values
 * default to `undefined`.
 *
 * Tasks names are stored in the `env("--tasks")` string array. A default task
 * can be specified by setting the `"--default-task"` value to the task name.
 *
 * Command-line variables are keyed by name. For example `vers=1.0.1` on the
 * command-line sets the `"vers"` value to `"1.0.1"`.
 */
export const env = newEnvFunction();

type EnvData = { [name: string]: any };
type EnvFunction = (name: string, value?: any) => any;

/** Return an environment getter/setter function with `this` set to `envData`. */
export function newEnvFunction() {
  return function (
    this: EnvData,
    name: string,
    value?: any,
  ): any {
    if (value !== undefined) {
      switch (name) {
        case "--abort-exits":
        case "--always-make":
        case "--debug":
        case "--dry-run":
        case "--help":
        case "--list-all":
        case "--list-tasks":
        case "--quiet":
        case "--version":
          if (typeof value !== "boolean") {
            abort(`${name} must be a boolean`);
          }
          break;
        case "--directory":
          if (typeof value !== "string") {
            abort(`${name} must be a string`);
          }
          if (!existsSync(value) || !Deno.statSync(value).isDirectory) {
            abort(`--directory missing or not a directory: ${value}`);
          }
          Deno.chdir(value);
          break;
        case "--default-task":
          if (typeof value !== "string") {
            abort(`${name} must be a string`);
          }
          break;
        case "--tasks":
          if (!(value instanceof Array)) {
            abort("--tasks must be a string array");
          }
          break;
        default:
          if (name.startsWith("-")) {
            abort(`illegal option: ${name}`);
          }
          if (typeof value !== "string") {
            abort(`${name} must be a string`);
          }
          if (!/^[a-zA-Z]\w*$/.test(name)) {
            abort(`illegal variable name: ${name}`);
          }
      }
      this[name] = value;
    }
    return this[name];
    // TODO is a new bound object created every time envFunction is called?
  }.bind({
    "--tasks": [],
    "--debug": !!Deno.env.get("DRAKE_DEBUG"),
    "--directory": Deno.cwd(),
  });
}

export function parseEnv(args: string[], env: EnvFunction): void {
  let arg: string | undefined;
  while (!!(arg = args.shift())) {
    const match = arg.match(/^([a-zA-Z]\w*)=(.*)$/);
    if (match) {
      env(match[1], match[2]);
      continue;
    }
    switch (arg) {
      case "-a":
      case "--always-make":
        env("--always-make", true);
        break;
      case "-d":
      case "--directory":
        arg = args.shift();
        if (arg === undefined) {
          abort("missing --directory option value");
        }
        env("--directory", arg);
        break;
      case "-D":
      case "--debug":
        env("--debug", true);
        break;
      case "-h":
      case "--help":
        env("--help", true);
        break;
      case "-l":
      case "--list-tasks":
        env("--list-tasks", true);
        break;
      case "-L":
        env("--list-all", true);
        break;
      case "-n":
      case "--dry-run":
        env("--dry-run", true);
        break;
      case "-q":
      case "--quiet":
        env("--quiet", true);
        break;
      case "--version":
        env("--version", true);
        break;
      default:
        if (arg.startsWith("-")) {
          abort(`illegal option: ${arg}`);
        }
        env("--tasks").push(arg);
        break;
    }
  }
}

/**
 * Write an error message to to `stderr` and terminate execution.
 * If the `"--abort-exits"` environment option is true throw a
 * `DrakeError` instead.
 */
export function abort(message: string): never {
  if (env("--abort-exits")) {
    console.error(`${colors.red(colors.bold("drake error:"))} ${message}`);
    Deno.exit(1);
  } else {
    throw new DrakeError(message);
  }
}

/**
 * Log a message to stdout. Do not log the message if the `--quiet`
 * command-line option is set.
 */
export function log(message: string): void {
  if (!env("--quiet")) {
    console.log(message);
  }
}

/**
 * Write the `title` and `message` to stderr if it is a TTY and the
 * `--debug` command-line option was specified or the `DRAKE_DEBUG` shell
 * environment variable is set.
 */
export function debug(title: string, message: any = ""): void {
  if (typeof message === "object") {
    message = JSON.stringify(message, null, 1);
  }
  if (env("--debug") && Deno.isatty(Deno.stderr.rid)) {
    console.error(`${colors.yellow(colors.bold(title + ":"))} ${message}`);
  }
}

/**
 * Quote string array values with double-quotes then join them with a separator.
 * Double-quote characters are escaped with a backspace.
 * The separator defaults to a space character.
 */
export function quote(values: string[], sep: string = " "): string {
  values = values.map((value) => `"${value.replace(/"/g, '\\"')}"`);
  return values.join(sep);
}

/** Wait `ms` milliseconds. Must be called with `await`. */
export async function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Read the entire contents of a file synchronously to a UTF-8 string. */
export function readFile(filename: string): string {
  const result = new TextDecoder("utf-8").decode(Deno.readFileSync(filename));
  debug(
    "readFile",
    `filename: ${filename}: ${result.length} characters read`,
  );
  return result;
}

/* Write text to a file synchronously. If the file exists it will be overwritten. */
export function writeFile(filename: string, text: string): void {
  debug(
    "writeFile",
    `filename: ${filename}: ${text.length} characters written`,
  );
  Deno.writeFileSync(filename, new TextEncoder().encode(text));
}

/**
 * Find and replace in text file synchronously.
 * If the file contents is unchanged return `false`.
 * If the contents has changed write it to the file and return `true`.
 */
export function updateFile(
  filename: string,
  find: RegExp,
  replace: string,
): boolean {
  debug(
    "updateFile",
    `filename: ${filename}: find: ${find}, replace: "${replace}"`,
  );
  let result = false;
  const text = readFile(filename);
  const updatedText = text.replace(find, replace);
  if (text !== updatedText) {
    writeFile(filename, updatedText);
    result = true;
  }
  return result;
}

/**
 * Create zero length file.
 * Missing parent directory paths are also created.
 * Throws error if file exists.
 */
export function createFile(file: string): void {
  debug("createFile", file);
  const dir = path.dirname(file);
  if (!existsSync(dir)) {
    Deno.mkdirSync(dir, { recursive: true });
  }
  if (existsSync(file)) {
    abort(`file already exists: ${file}`);
  } else {
    Deno.createSync(file).close();
  }
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
      result.push(...glob(prereq));
    } else {
      result.push(normalizePath(prereq));
    }
  }
  return result;
}

/**
 * Return a sorted array of normalized file names matching the wildcard glob patterns.
 * Valid glob patterns are those supported by Deno's `path` library.
 * Example: `glob("tmp/*.ts", "lib/*.ts", "mod.ts");`
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
    return Array.from(iter, (info) => info.path);
  }
  let result: string[] = [];
  for (const pattern of patterns) {
    result = [...result, ...glob1(pattern)];
  }
  // Drop duplicates, normalize and sort paths.
  result = [...new Set(result)].map((p) => normalizePath(p)).sort();
  debug("glob", `${quote(patterns, ", ")}:\n${result.join("\n")}`);
  return result;
}

/** Synthesize platform dependent shell command arguments and Windows command file. */
function shArgs(command: string): [string[], string] {
  let cmdArgs: string[];
  if (Deno.build.os === "windows") {
    const cmdFile = Deno.makeTempFileSync(
      { prefix: "drake_", suffix: ".cmd" },
    );
    writeFile(cmdFile, `@echo off\n${command}`);
    return [[cmdFile], cmdFile];
  } else {
    const shellExe = Deno.env.get("SHELL")!;
    if (!shellExe) {
      abort(`cannot locate shell: missing SHELL environment variable`);
    }
    return [[shellExe, "-c", command], ""];
  }
}

export interface ShOpts {
  cwd?: string;
  env?: { [key: string]: string };
  stdout?: "inherit" | "piped" | "null" | number;
  stderr?: "inherit" | "piped" | "null" | number;
}

/**
 * Execute commands asynchronously in the command shell.
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
  debug("sh", `${commands.join("\n")}\nopts: ${JSON.stringify(opts)}`);
  const tempFiles: string[] = [];
  const processes: Deno.Process[] = [];
  const results: Deno.ProcessStatus[] = [];
  try {
    for (const cmd of commands) {
      let cmdArgs: string[];
      let cmdFile = "";
      [cmdArgs, cmdFile] = shArgs(cmd);
      if (cmdFile) tempFiles.push(cmdFile);
      const p = Deno.run({
        cmd: cmdArgs,
        cwd: opts.cwd,
        env: opts.env,
        stdout: opts.stdout ?? "inherit",
        stderr: opts.stderr ?? "inherit",
      });
      processes.push(p);
    }
    results.push(...await Promise.all(processes.map((p) => p.status())));
  } finally {
    for (const p of processes) {
      p.close();
    }
  }
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
 * Execute `command` in the command shell and return a promise for
 * `{code, output, error}` (the exit code, the stdout output and the
 * stderr output).
 *
 * - If the `opts.input` string has been assigned then it is piped to the
 *   shell `stdin`.
 * - `opts.cwd` sets the shell current working directory (defaults to the
 *   parent process working directory).
 * - The `opts.env` mapping passes additional environment variables to
 *   the shell.
 * - `opts.stdout` and `opts.stderr` have `Deno.RunOptions` semantics.
 *   `opts.stdout` defaults to `"piped"`. `opts.stderr` defaults to
 *   `"inherit"` (to capture stderr set `opts.stderr` to `"piped"`).
 *
 * Examples:
 *
 *     const { code, stdout } = await shCapture("echo Hello"); 
 *     const { code, output, error } = await shCapture( "mkdir tmpdir", { stderr: "piped" }); 
 * 
 */
export async function shCapture(
  command: string,
  opts: ShCaptureOpts = {},
): Promise<ShOutput> {
  let cmdArgs: string[];
  let cmdFile = "";
  [cmdArgs, cmdFile] = shArgs(command);
  const p = Deno.run({
    cmd: cmdArgs,
    cwd: opts.cwd,
    env: opts.env,
    stdin: opts.input !== undefined ? "piped" : undefined,
    stdout: opts.stdout ?? "piped",
    stderr: opts.stderr ?? "inherit",
  });
  let status: Deno.ProcessStatus;
  let outputBytes, errorBytes: Uint8Array;
  try {
    if (p.stdin) {
      await p.stdin.write(new TextEncoder().encode(opts.input));
      p.stdin.close();
    }
    [status, outputBytes, errorBytes] = await Promise.all(
      [
        p.status(),
        p.stdout ? p.output() : Promise.resolve(new Uint8Array()),
        p.stderr ? p.stderrOutput() : Promise.resolve(new Uint8Array()),
      ],
    );
  } finally {
    p.close();
  }
  if (cmdFile) Deno.removeSync(cmdFile);
  const result = {
    code: status.code,
    output: new TextDecoder().decode(outputBytes),
    error: new TextDecoder().decode(errorBytes),
  };
  debug(
    "shCapture",
    `${command}\nopts:      ${JSON.stringify(opts)}\noutputs:   ${
      JSON.stringify(result)
    }`,
  );
  return result;
}

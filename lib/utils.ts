import { colors, path, walkSync } from "./deps.ts";
import { env } from "./env.ts";

const DRAKE_VERS = "1.7.0";

/** Returns the Drake version number string. */
export function vers(): string {
  return DRAKE_VERS;
}

export class DrakeError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DrakeError";
  }
}

/**
 * Return `FileInfo` (or `null` if file does not exist).
 */
export function stat(path: string): Deno.FileInfo | null {
  try {
    return Deno.statSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      return null;
    } else {
      throw err;
    }
  }
}

/**
 * Return `true` if `path` exists, otherwise return `false`.
 */
export function pathExists(path: string): boolean {
  return stat(path) != null;
}

/**
 * Return `true` if the `path` is that of a regular file.
 * Return `false` if it is not a regular file or does not exist.
 */
export function isFile(path: string): boolean {
  return !!stat(path)?.isFile;
}

/**
 * Return `true` if `path` is that of a directory.
 * Return `false` if it is not a directory or does not exist.
 */
export function isDirectory(path: string): boolean {
  return !!stat(path)?.isDirectory;
}

/**
 * Write an error message to to `stderr` and terminate execution.
 *
 * - If the `"--abort-exits"` environment option is `false` throw a `DrakeError`.
 * - If the `"--debug"` environment option is `true` include the stack trace in
 *   the error message.
 */
export function abort(message: string): never {
  if (env("--abort-exits")) {
    message = `${colors.red(colors.bold("error"))}: ${message}`;
    if (env("--debug")) {
      const e = new Error();
      if (e.stack) {
        message += `\n${e.stack}`;
      }
    }
    console.error(message);
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

export function logExecution(title: string, info: string, duration?: number) {
  if (env("--quiet")) {
    return;
  }
  if ((title == "sh" || title == "shCapture") && !env("--verbose")) {
    return;
  }
  info = `${colors.green(colors.bold(`${title}: `))}${info}`;
  if (duration !== undefined) {
    info += ` ${colors.brightWhite(colors.bold(`(${duration}ms)`))}`;
  }
  log(info);
}

/**
 * Write the `title` and `message` to stderr if it is a TTY and the
 * `--debug` command-line option was specified or the `DRAKE_DEBUG` shell
 * environment variable is set.
 */
// deno-lint-ignore no-explicit-any
export function debug(title: string, message: any = ""): void {
  if (typeof message === "object") {
    message = JSON.stringify(message, null, 1);
  }
  if (env("--debug") && Deno.stdin.isTerminal()) {
    if (title !== "") {
      message = `${colors.yellow(colors.bold(title + ":"))} ${message}`;
    }
    console.error(message);
  }
}

/**
 * Quote string array values with double-quotes then join them with a separator.
 * Double-quote characters are escaped with a backspace.
 * The separator defaults to a space character.
 */
export function quote(values: string[], sep = " "): string {
  values = values.map((value) => `"${value.replace(/"/g, '\\"')}"`);
  return values.join(sep);
}

/** Wait `ms` milliseconds. Must be called with `await`. */
// deno-lint-ignore require-await
export async function sleep(ms: number): Promise<unknown> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Read the entire contents of a file synchronously to a UTF-8 string. */
export function readFile(filename: string): string {
  try {
    const result = Deno.readTextFileSync(filename);
    debug(
      "readFile",
      `${filename}: ${result.length} characters read`,
    );
    return result;
  } catch (e) {
    abort(`readFile: ${filename}: ${e.message}`);
  }
}

/**
 * Write text to a file synchronously.
 * If the file exists it will be overwritten.
 * Returns `true` if a new file was created.
 * Returns `false` if the file already exists.
 */
export function writeFile(filename: string, text: string): boolean {
  const exists = !!stat(filename);
  try {
    debug(
      "writeFile",
      `${filename}: ${text.length} characters written`,
    );
    Deno.writeTextFileSync(filename, text);
  } catch (e) {
    abort(`writeFile: ${filename}: ${e.message}`);
  }
  return !exists;
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
    `${filename}: find: ${find}, replace: "${replace}"`,
  );
  let changed = false;
  const text = readFile(filename);
  const updatedText = text.replace(find, replace);
  if (text !== updatedText) {
    writeFile(filename, updatedText);
    changed = true;
  }
  return changed;
}

/**
 * Create directory.
 *
 * - Missing parent directory paths are created.
 * - Returns `true` if a new directory was created.
 * - Returns `false` if the directory already exists.
 */
export function makeDir(dir: string): boolean {
  debug("makeDir", dir);
  const exists = !!stat(dir);
  if (exists) {
    if (!stat(dir)?.isDirectory) {
      abort(`file is not directory: ${dir}`);
    }
  } else {
    Deno.mkdirSync(dir, { recursive: true });
  }
  return !exists;
}

/**
 * Return a sorted array of normalized file names matching the wildcard glob patterns.
 * Valid glob patterns are those supported by Deno's `path` library
 * (see https://deno.land/std@0.152.0/path/mod.ts?s=globToRegExp).
 * Example: `glob("tmp/*.ts", "lib/*.ts", "mod.ts");`
 */
export function glob(...patterns: string[]): string[] {
  function glob1(pattern: string): string[] {
    const globOptions = { extended: true, globstar: true } as const;
    pattern = path.normalizeGlob(pattern, globOptions);
    let root = path.dirname(pattern);
    while (root !== "." && path.isGlob(root)) {
      root = path.dirname(root);
    }
    if (!stat(root)) {
      return [];
    }
    const regexp = path.globToRegExp(pattern, globOptions);
    const iter = walkSync(root, { match: [regexp], includeDirs: false });
    return Array.from(iter, (info) => info.path);
  }
  debug("glob", `${quote(patterns, ", ")}`);
  let result: string[] = [];
  for (const pattern of patterns) {
    try {
      result = [...result, ...glob1(pattern)];
    } catch (e) {
      abort(`${pattern}: ${e.message}`);
    }
  }
  // Drop duplicates, normalize and sort paths.
  result = [...new Set(result)].map((p) => path.normalize(p)).sort();
  debug("", `${result.slice(0, 100).join("\n")}`);
  if (result.length > 100) {
    debug("", `... (${result.length} files)`);
  }
  return result;
}

/**
 * Delete files matching the wildcard glob patterns.
 * Example: `remove("tmp/*.ts", "lib/*.ts", "mod.ts");`
 */
export function remove(...patterns: string[]): void {
  debug("remove", `${quote(patterns, ", ")}`);
  for (const f of glob(...patterns)) {
    Deno.removeSync(f);
  }
}

/** Synthesize platform dependent shell command arguments. */
function shArgs(command: string): string[] {
  if (Deno.build.os === "windows") {
    return ["PowerShell.exe", "-Command", command];
  } else {
    let shellExe = Deno.env.get("SHELL")!;
    if (!shellExe) {
      shellExe = "/bin/bash";
      if (!stat(shellExe)?.isFile) {
        abort(
          `cannot locate shell: no SHELL environment variable or ${shellExe} executable`,
        );
      }
    }
    return [shellExe, "-c", command];
  }
}

/** `sh` API options. */
export interface ShOpts {
  /** Working directory. */
  cwd?: string;
  /** Map containing additional shell environment variables. */
  env?: { [key: string]: string };
  stdout?: "inherit" | "piped" | "null";
  stderr?: "inherit" | "piped" | "null";
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
 * On MS Windows run `PowerShell.exe -Command <cmd>`. On other platforms run `$SHELL -c <cmd>` (if `SHELL`
 * is not defined use `/bin/bash`).
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
  const startTime = new Date().getTime();
  const outputs: Promise<Deno.CommandOutput>[] = [];
  const results: Deno.CommandOutput[] = [];
  for (const cmd of commands) {
    const args = shArgs(cmd);
    const command = new Deno.Command(
      args[0],
      {
        args: args.slice(1),
        cwd: opts.cwd,
        env: opts.env,
        stdout: opts.stdout ?? "inherit",
        stderr: opts.stderr ?? "inherit",
      },
    );
    outputs.push(command.output());
  }
  results.push(...await Promise.all(outputs));
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
  logExecution(
    "sh",
    `${commands.join("\n")}`,
    new Date().getTime() - startTime,
  );
}

export type ShOutput = {
  code: number | undefined;
  output: string;
  error: string;
};

/** `shCapture` API options. */
export interface ShCaptureOpts extends ShOpts {
  /** Piped to shell stdin. */
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
 * - `opts.stdout` and `opts.stderr` have `Deno.CommandOptions.stdout`
 *    and `Deno.CommandOptions.stdout` semantics respectively.
 * -  `opts.stdout` defaults to `"piped"`. `opts.stderr` defaults to
 *   `"inherit"` (to capture stderr set `opts.stderr` to `"piped"`).
 *
 * Examples:
 *
 *     const { code, output } = await shCapture("echo Hello");
 *     const { code, output, error } = await shCapture( "mkdir tmpdir", { stderr: "piped" });
 *     const vers = (await shCapture("make version")).output.trim();
 */
export async function shCapture(
  command: string,
  opts: ShCaptureOpts = {},
): Promise<ShOutput> {
  const startTime = new Date().getTime();
  const args = shArgs(command);
  const options: Deno.CommandOptions = {
    args: args.slice(1),
    cwd: opts.cwd,
    env: opts.env,
    stdin: opts.input !== undefined ? "piped" : undefined,
    stdout: opts.stdout ?? "piped",
    stderr: opts.stderr ?? "inherit",
  };
  const cmd = new Deno.Command(
    args[0],
    options,
  );
  const process = cmd.spawn();
  if (options.stdin == "piped") {
    const writer = process.stdin.getWriter();
    writer.write(new TextEncoder().encode(opts.input));
    writer.close();
  }
  const result: ShOutput = { code: undefined, output: "", error: "" };
  const output = await process.output();
  result.code = output.code;
  if (options.stdout == "piped") {
    result.output = new TextDecoder().decode(output.stdout);
  }
  if (options.stderr == "piped") {
    result.error = new TextDecoder().decode(output.stderr);
  }
  process.unref();
  debug(
    "shCapture",
    `${command}\nopts:      ${JSON.stringify(opts)}\noutputs:   ${
      JSON.stringify(result)
    }`,
  );
  logExecution("shCapture", command, new Date().getTime() - startTime);
  return result;
}

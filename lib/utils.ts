import { colors, existsSync, path, walkSync } from "./deps.ts";
import { env } from "./env.ts";

const DRAKE_VERS = "1.2.3";

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
 * Write an error message to to `stderr` and terminate execution.
 * 
 * - If the `"--abort-exits"` environment option is true throw a `DrakeError`.
 * - If the `"--debug"` environment option is true include the stack trace in
 *   the error message.
 */
export function abort(message: string): never {
  if (env("--abort-exits")) {
    message = `${colors.red(colors.bold("drake error:"))} ${message}`;
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
  const result = Deno.readTextFileSync(filename);
  debug(
    "readFile",
    `${filename}: ${result.length} characters read`,
  );
  return result;
}

/**
 * Write text to a file synchronously.
 * If the file exists it will be overwritten.
 * Returns `true` if a new file was created.
 * Returns `false` if the file already exists.
 * */
export function writeFile(filename: string, text: string): boolean {
  const exists = existsSync(filename);
  debug(
    "writeFile",
    `${filename}: ${text.length} characters written`,
  );
  Deno.writeTextFileSync(filename, text);
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
  const exists = existsSync(dir);
  if (exists) {
    if (!Deno.statSync(dir).isDirectory) {
      abort(`file is not directory: ${dir}`);
    }
  } else {
    Deno.mkdirSync(dir, { recursive: true });
  }
  return !exists;
}

/**
 * Return a sorted array of normalized file names matching the wildcard glob patterns.
 * Valid glob patterns are those supported by Deno's `path` library.
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
    const regexp = path.globToRegExp(pattern, globOptions);
    const iter = walkSync(root, { match: [regexp], includeDirs: false });
    return Array.from(iter, (info) => info.path);
  }
  let result: string[] = [];
  for (const pattern of patterns) {
    result = [...result, ...glob1(pattern)];
  }
  // Drop duplicates, normalize and sort paths.
  result = [...new Set(result)].map((p) => path.normalize(p)).sort();
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

/** `sh` API options. */
export interface ShOpts {
  /** Working directory. */
  cwd?: string;
  /** Map containing additional shell environment variables. */
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
      // Workaround for Narrowing type guard bug https://github.com/denoland/deno/issues/6270
      await (p.stdin as unknown as Deno.Writer).write(
        new TextEncoder().encode(opts.input),
      );
      // Workaround for Narrowing type guard bug https://github.com/denoland/deno/issues/6270
      (p.stdin as unknown as Deno.Closer).close();
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
  } as const;
  debug(
    "shCapture",
    `${command}\nopts:      ${JSON.stringify(opts)}\noutputs:   ${
      JSON.stringify(result)
    }`,
  );
  return result;
}

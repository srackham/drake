import { existsSync } from "./deps.ts";
import { abort, clone } from "./utils.ts";

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

type EnvValue = boolean | string | Array<string>;
type EnvData = { [name: string]: any };
type EnvFunction = (name: string, value?: any) => any;

/** Return an environment getter/setter function with `this` set to default options values. */
export function newEnvFunction() {
  return function (
    this: EnvData,
    name: string,
    value?: EnvValue,
  ): any {
    if (arguments.length !== 1) {
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
          if (
            !(value instanceof Array) ||
            !value.every((v) => typeof v === "string")
          ) {
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
  }.bind(clone({
    "--tasks": [],
    "--debug": !!Deno.env.get("DRAKE_DEBUG"),
    "--default-task": "",
    "--directory": Deno.cwd(),
    "--abort-exits": false,
    "--always-make": false,
    "--dry-run": false,
    "--help": false,
    "--list-all": false,
    "--list-tasks": false,
    "--quiet": false,
    "--version": false,
  }));
}

export function parseEnv(args: string[], env: EnvFunction): void {
  let arg: string | undefined;
  while (!!(arg = args.shift())) {
    const match = arg.match(/^([a-zA-Z]\w*)=(.*)$/);
    if (match) {
      env(match[1], match[2]); // Set named variable.
      continue;
    }
    const shortOpts: { [arg: string]: string } = {
      "-a": "--always-make",
      "-D": "--debug",
      "-d": "--directory",
      "-n": "--dry-run",
      "-h": "--help",
      "-l": "--list-tasks",
      "-L": "--list-all",
      "-q": "--quiet",
    };
    if (shortOpts[arg] !== undefined) {
      arg = shortOpts[arg];
    }
    switch (arg) {
      case "--always-make":
      case "--debug":
      case "--dry-run":
      case "--help":
      case "--list-tasks":
      case "--list-all":
      case "--quiet":
      case "--version":
        env(arg, true);
        break;
      case "--directory":
        arg = args.shift();
        if (arg === undefined) {
          abort("missing --directory option value");
        }
        env("--directory", arg);
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

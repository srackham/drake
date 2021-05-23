// deno-lint-ignore-file no-explicit-any

import { existsSync, path } from "./deps.ts";
import { abort, debug } from "./utils.ts";

export type EnvValue = boolean | string | Array<string>;
type EnvValues = { [name: string]: EnvValue };
type EnvFunction = (name?: string, value?: EnvValue) => any;

/** Factory class for creating environment functions. */
export class Env {
  private values: EnvValues;

  private constructor() {
    this.values = {
      ...{
        "--tasks": [],
        "--debug": !!Deno.env.get("DRAKE_DEBUG"),
        "--default-task": "",
        "--cache": "",
        "--directory": Deno.cwd(),
        "--abort-exits": false,
        "--always-make": false,
        "--dry-run": false,
        "--help": false,
        "--list-all": false,
        "--list-tasks": false,
        "--quiet": false,
        "--verbose": false,
        "--version": false,
      },
    } as EnvValues;
  }

  /** Set command-line options and variables. */
  private setValue(name: string, value: EnvValue) {
    switch (name) {
      case "--abort-exits":
      case "--always-make":
      case "--debug":
      case "--dry-run":
      case "--help":
      case "--list-all":
      case "--list-tasks":
      case "--quiet":
      case "--verbose":
      case "--version":
        if (typeof value !== "boolean") {
          abort(`${name} must be a boolean`);
        }
        break;
      case "--cache":
        if (typeof value !== "string") {
          abort(`${name} must be a string`);
        }
        if (value !== "") {
          const dir = path.dirname(value);
          if (!existsSync(dir) || !Deno.statSync(dir).isDirectory) {
            abort(`--cache file directory missing or not a directory: ${dir}`);
          }
          value = path.join(Deno.realPathSync(dir), path.basename(value));
        }
        break;
      case "--directory":
        if (typeof value !== "string") {
          abort(`${name} must be a string`);
        }
        if (!existsSync(value) || !Deno.statSync(value).isDirectory) {
          abort(`--directory missing or not a directory: ${value}`);
        }
        value = Deno.realPathSync(value);
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
        if (!/^[a-zA-Z]\w*$/.test(name)) {
          abort(`illegal variable name: ${name}`);
        }
        if (typeof value !== "string") {
          abort(`variable value must be a string: ${name}`);
        }
    }
    this.values[name] = value;
  }

  /** Return a new environment getter/setter function with `this` set to a new Env object. */
  static create(): EnvFunction {
    const env = new Env();
    return function (
      this: Env,
      name?: string,
      value?: EnvValue,
    ): any {
      if (name === undefined) {
        return this; // Return function's Env object if called without parameters.
      }
      if (arguments.length !== 1) {
        debug("set", `${name}: ${value}`);
        this.setValue(name, value!);
      }
      return this.values[name];
    }.bind(env);
  }

  /** Parse command-line arguments. */
  parseArgs(args: string[]): void {
    let arg: string | undefined;
    // deno-lint-ignore no-extra-boolean-cast
    while (!!(arg = args.shift())) {
      const match = arg.match(/^([a-zA-Z]\w*)=(.*)$/);
      if (match) {
        this.values[match[1]] = match[2]; // Set named variable.
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
        "-v": "--verbose",
      } as const;
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
        case "--verbose":
          this.setValue(arg, true);
          break;
        case "--cache":/* falls through */
        // deno-lint-ignore no-case-declarations
        case "--directory":
          const value = args.shift();
          if (value === undefined) {
            abort(`missing ${arg} option value`);
          }
          this.setValue(arg, value);
          break;
        default:
          if (arg.startsWith("-")) {
            abort(`illegal option: ${arg}`);
          }
          (this.values["--tasks"] as Array<string>).push(arg);
          break;
      }
    }
  }
}

/**
 * The Drake `env` API function gets and optionally sets the command-line
 * options, task names and variables.
 *
 * Options are keyed by their long option name e.g. `env("--dry-run")`.
 * Command-line flag options return a boolean; the `--cache` and `--directory` options
 * return a string.
 *
 * Command-line variables are keyed by name. For example `vers=1.0.1` on the
 * command-line sets the `vers` value to `"1.0.1"`.
 *
 * Command-line tasks are stored in the `--tasks` string array.
 *
 * Examples:
 *
 *     env("--abort-exits", true);
 *     env("--default-task", "test");
 *     console.log(`version: ${env("vers")}`);
 *     if (!env("--quiet")) console.log(message);
 */
export const env = Env.create();

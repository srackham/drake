export { Env, parseArgs };
import { abort } from "./utils.ts";

type Env = { [name: string]: any; "--tasks": string[]; };

function parseArgs(args: string[], env: Env): void {
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

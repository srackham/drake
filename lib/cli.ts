export { Env, parseArgs };
import { abort } from "./utils.ts";

type Env = { [name: string]: any; "--targets"?: string[]; };

function parseArgs(args: string[], env: Env): void {
  if (env["--targets"] === undefined) {
    env["--targets"] = [];
  }
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
        env["-d"] = arg;
        env["--directory"] = arg;
        break;
      case "-f":
      case "--drakefile":
        arg = args.shift();
        if (arg === undefined) {
          abort("missing --drakefile option value");
        }
        env["-f"] = arg;
        env["--drakefile"] = arg;
        break;
      case "-h":
      case "--help":
        env["-h"] = true;
        env["--help"] = true;
        break;
      case "-t":
      case "--tasks":
        env["-t"] = true;
        env["--tasks"] = true;
        break;
      case "-n":
      case "--dry-run":
        env["-n"] = true;
        env["--dry-run"] = true;
        break;
      case "-q":
      case "--quiet":
        env["-q"] = true;
        env["--quiet"] = true;
        break;
      case "--version":
        env["--version"] = true;
        break;
      default:
        env["--targets"].push(arg);
        break;
    }
  }
}

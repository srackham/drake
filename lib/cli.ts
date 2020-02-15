export { Env, parseArgs };

type Env = { [name: string]: any; "--targets"?: string[]; };

function parseArgs(args: string[], env: Env): void {
  if (env["--targets"] === undefined) {
    env["--targets"] = [];
  }
  for (const arg of args) {
    const match = arg.match(/^([\w_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    } else if (arg === "-a" || arg === "--always-make") {
      env["-a"] = true;
      env["--always-make"] = true;
    } else if (arg === "-h" || arg === "--help") {
      env["-h"] = true;
      env["--help"] = true;
    } else if (arg === "-t" || arg === "--tasks") {
      env["-t"] = true;
      env["--tasks"] = true;
    } else if (arg === "-n" || arg === "--dry-run") {
      env["-n"] = true;
      env["--dry-run"] = true;
    } else if (arg === "-q" || arg === "--quiet") {
      env["-q"] = true;
      env["--quiet"] = true;
    } else if (arg === "--version") {
      env["--version"] = true;
    } else {
      env["--targets"].push(arg);
    }
  }
}

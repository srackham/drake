export { env, Env, parseArgs };

type Env = { [name: string]: any; };
const env: Env = { "--tasks": [] };

function parseArgs(args: string[], env: Env): void {
  for (const arg of args) {
    const match = arg.match(/^([\w_]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    } else if (arg === "-f" || arg === "--force") {
      env["-f"] = true;
      env["--force"] = true;
    } else if (arg === "-h" || arg === "--help") {
      env["-h"] = true;
      env["--help"] = true;
    } else if (arg === "-l" || arg === "--list") {
      env["-l"] = true;
      env["--list"] = true;
    } else if (arg === "-n" || arg === "--dry-run") {
      env["-n"] = true;
      env["--dry-run"] = true;
    } else if (arg === "-q" || arg === "--quiet") {
      env["-q"] = true;
      env["--quiet"] = true;
    } else if (arg === "--version") {
      env["--version"] = true;
    } else {
      env["--tasks"].push(arg);
    }
  }
}

parseArgs(Deno.args, env);

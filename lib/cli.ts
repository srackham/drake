export { opts, vars, parseArgs, Options, Variables };

interface Options {
  force: boolean;
  quiet: boolean;
  help: boolean;
  vers: boolean;
  list: boolean;
  dryrun: boolean;
  tasks: string[]; // Command-line tasks.
}

const opts: Options = {
  force: false,
  quiet: false,
  help: false,
  vers: false,
  list: false,
  dryrun: false,
  tasks: []
};

type Variables = { [name: string]: string; }; // Command-line variables.
const vars: Variables = {};

function parseArgs(args: string[], opts: Options, vars: Variables): void {
  for (const arg of args) {
    const match = arg.match(/^([\w_]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2];
    } else if (arg == "-f" || arg == "--force") {
      opts.force = true;
    } else if (arg == "-h" || arg == "--help") {
      opts.help = true;
    } else if (arg == "-l" || arg == "--list") {
      opts.list = true;
    } else if (arg == "-n" || arg == "--dry-run") {
      opts.dryrun = true;
    } else if (arg == "-q" || arg == "--quiet") {
      opts.quiet = true;
    } else if (arg == "--version") {
      opts.vers = true;
    } else {
      opts.tasks.push(arg);
    }
  }
}

parseArgs(Deno.args, opts, vars);

export { opts, vars, parseArgs, Options }

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

const vars: { [name: string]: string; } = {}; // Command-line variables.

function parseArgs(args: string[], opts: Options): void {
  for (const arg of Deno.args) {
    const match = arg.match(/^([\w_]+)=(.*)$/);
    if (match) {
      vars[match[1]] = match[2];
    } else if (arg == "-h" || arg == "--help") {
      opts.help = true;
    } else if (arg == "--version") {
      opts.vers = true;
    } else {
      opts.tasks.push(arg);
    }
  }
}

parseArgs(Deno.args, opts);

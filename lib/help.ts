export { help };

function help(): void {
  console.log(manpage);
}

const manpage = String.raw `
NAME
  drake - a make-like task runner for Deno.

SYNOPSIS
  drake [OPTION|VARIABLE|TASK]...
  deno run [DENO_OPTION...] DRAKEFILE [OPTION|VARIABLE|TASK]...

DESCRIPTION
  The Drake TypeScript library provides functions for defining and executing
  build TASKs on the Deno runtime.

  A DRAKEFILE is a TypeScript module file containing Drake task definitions.
  The 'drake' CLI is a thin wrapper for executing a DRAKEFILE.

  A Drake VARIABLE is a named string value e.g. 'vers=0.1.0'.  Variables are
  accessed via the Drake 'env' object e.g. 'env.vers' or 'env["vers"]'.

OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -f, --drakefile FILE  Use FILE as drakefile (default: './Drakefile.ts').
  -h, --help            Display this help message.
  -l, --list-tasks      Display task names, descriptions and prerequisites.
  -n, --dry-run         Skip task execution.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.

ENVIRONMENT VARIABLES
  NO_COLOR              Set to disable color (see https://no-color.org/).

SEE ALSO
  The Drake user guide: https://github.com/srackham/drake
`;

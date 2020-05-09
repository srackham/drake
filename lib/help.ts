export { help };

function help(): void {
  console.log(manpage);
}

const manpage = String.raw`
NAME
  drake - a make-like task runner for Deno.

SYNOPSIS
  deno run -A DRAKEFILE [OPTION|VARIABLE|TASK]...

DESCRIPTION
  The Drake TypeScript module provides functions for defining and executing
  build TASKs on the Deno runtime.

  A DRAKEFILE is a TypeScript module file containing Drake task definitions.
  Drakefiles are run with the Deno 'run' command.

  A Drake VARIABLE is a named string value e.g. 'vers=0.1.0'.  Variables are
  accessed using the Drake 'env' API e.g. 'env("vers")'.

OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -D, --debug           Write debug information to stderr.
  -h, --help            Display this help message.
  -l, -L, --list-tasks  List tasks (-L for hidden tasks and prerequisites).
  -n, --dry-run         Skip task execution.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.

ENVIRONMENT VARIABLES
  NO_COLOR              Set to disable color (see https://no-color.org/).

SEE ALSO
  The Drake user guide: https://github.com/srackham/drake
`;

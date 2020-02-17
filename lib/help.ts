export { help };

function help(): void {
  console.log(`${manpage}\n`);
}

const manpage = String.raw `
NAME
    drake - a make-like build tool for Deno.

SYNOPSIS
    drake DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]
    deno -A run DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]


DESCRIPTION
  The drake library provides functions for defining and executing build tasks
  on the Deno runtime. The 'drake' CLI is a thin wrapper for executing a
  DRAKEFILE with the 'deno run' command. A DRAKEFILE is a TypeScript (or
  JavaScript) module file. A DRAKEFILE can be executed directly by the 'deno
  run' command.


OPTIONS
  -a, --always-make     Unconditionally execute all targets.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -f, --drakefile FILE  Run drakefile FILE (default: './Drakefile.ts').
  -h, --help            Display this help message.
  -t, --tasks           Display task names, descriptions and prerequisites.
  -n, --dry-run         Skip execution of task actions.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.


ENVIRONMENT VARIABLES:
    NO_COLOR       Set to disable color (see https://no-color.org/).


EXAMPLE


VARIABLES
  A variable is a named string value that is made available to the build
  script. Variables are formatted like '<name>=<value>' e.g. 'vers=0.1.0'.
  Variables are accessed via the 'env' object e.g. 'env.vers' or 'env["vers"]'.

  Variable names can only contain one or more alphanumeric or underscore
  characters and must start with a letter.

  Tip: Use shell quoting and escapes to pass values containing spaces or
  special characters e.g. 'title=Foo & bar'.


ENVIRONMENT
  The 'env' object contains:

  Variables: Passed on the command-line (see VARIABLES).

  Options: Mostly command-line options. Option names start with a dash e.g.
  'env["--dry-run"].

  Shell environment variables: Variable names are prefixed with a '$' character
  e.g. 'env["$HOME"].


TASKS
  - Task prerequisites are executed before the task target.
  - Task execution order corresponds to the declaration order unless
    overriden by prerequisite dependencies.
  - Tasks are executed sequential i.e. the next task won't be started until
    the previous task has completed.
  - File and non-file tasks differentiated by name: file names must be
    prefixed with '/', './', or '../' e.g. 'foobar' is a non-file task,
    './foobar' is a file task,

ACTION FUNCTIONS
  - All async functions must be awaited to ensure the task completes before starting the next task.

  - Action functions containing 'await' statements must be declared with the
    'async' keyword.

EXAMPLES
  TODO`;

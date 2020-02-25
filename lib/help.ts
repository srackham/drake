export { help };

function help(): void {
  console.log(`${manpage}\n`);
}

const manpage = String.raw `
NAME
    drake - a make-like build-tool and task-runner for Deno.

SYNOPSIS
    drake DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]
    deno run [DENO_OPTION...] DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]


DESCRIPTION
  The Drake library provides functions for defining and executing build TASKs
  with the Deno runtime.

  The 'drake' CLI is a thin wrapper for executing a DRAKEFILE using the 'deno
  run' command. A DRAKEFILE is a TypeScript (or JavaScript) module file. A
  DRAKEFILE can be run directly with the 'deno run' command.


OPTIONS
  -a, --always-make     Unconditionally execute tasks.
  -d, --directory DIR   Change to directory DIR before running drakefile.
  -f, --drakefile FILE  Use FILE as drakefile (default: './Drakefile.ts').
  -h, --help            Display this help message.
  -l, --list-tasks      Display task names, descriptions and prerequisites.
  -n, --dry-run         Skip execution of task actions.
  -q, --quiet           Do not log drake messages to standard output.
  --version             Display the drake version.


ENVIRONMENT VARIABLES
  NO_COLOR              Set to disable color (see https://no-color.org/).


EXAMPLE DRAKEFILE


VARIABLES
  A variable is a named string value that is made available to the drakefile.
  Variables are formatted like '<name>=<value>' e.g. 'vers=0.1.0'.  Variables
  are accessed via the 'env' object e.g. 'env.vers' or 'env["vers"]'.

  Variable names can only contain alphanumeric or underscore characters and
  must start with an alpha character.

  Tip: Use shell quoting and escapes to pass values containing spaces or
  special characters e.g. 'title=Foo & bar'.


ENVIRONMENT
  The exported Drake 'env' object contains:

  Variables: From the command-line (see VARIABLES).

  Options: Mostly command-line options. Option names start with a dash e.g.
  'env["--dry-run"].

  Shell environment variables: A read-only snapshot of the shell environment
  variables. Shell environment variable names distinguished by a '$' character
  prefix e.g. 'env["$HOME"]'.


TASKS
  - Task prerequisites are executed before the task is executed.
  - Task execution order corresponds to the declaration order unless overriden
    by prerequisite dependencies.
  - Tasks are executed sequential i.e. the next task won't be started until the
    previous task has completed.
  - File and non-file tasks differentiated by name: file names must be prefixed
    with '/', './', or '../' e.g. 'foobar' is a non-file task, './foobar' is a
    file task,
  - Task names can only contain alphanumeric or underscore characters and must
    start with an alpha character.


ACTION FUNCTIONS
  - All async functions must be awaited to ensure the task completes before starting the next task.

  - Action functions containing 'await' statements must be declared with the
    'async' keyword.

API FUNCTIONS
  The Drake 'mod.ts' module exports the following functions:

  function desc(description: string): void;
      Set description of next registered task.

  function task(name: string, prereqs: string[] = [], action?: Action): void;
      Register task.

  async function run();
      Run Drake command-line options and named tasks.

  function glob(...patterns: string[]): string[];
      Return array of file names matching the glob patterns relative to the
      current working directory.  e.g. glob("tmp/*.ts", "lib/*.ts", "mod.ts");
`;

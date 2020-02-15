export { help };

function help(): void {
  console.log(`${manpage}\n`);
}

const manpage = String.raw `
NAME
    drake - amake-like build tool for Deno.

SYNOPSIS
    deno -A DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]

OPTIONS
    -a, --always-make     Unconditionally execute all targets.
    -h, --help            Display this help message.
    -t, --tasks           Display tasks and task descriptions.
    -n, --dry-run         Skip execution of task actions.
    -q, --quiet           Do not log drake messages to standard output.
    --version             Display the drake version.


DESCRIPTION
    The drake library provides functions for defining and executing build tasks
    on the Deno runtime.  The build script is just a TypeScript (or JavaScript)
    module file.

EXAMPLE


VARIABLES
    A variable is a named string value that is made available to the build
    script Variables are formatted like '<name>=<value>' e.g. 'vers=0.1.0'.
    Accessed via 'vars' e.g. 'vars.vers'.

    Tip: Use shell quoting and escapes to process values containing spaces or
    special characters e.g. 'title=Foo & bar'.


TASKS
    - File and non-file tasks differentiated by name: file names must be
      prefixed with '/', './', or '../' e.g. 'foobar' is a non-file task,
      './foobar' is a file task,


EXAMPLES
    TODO`;

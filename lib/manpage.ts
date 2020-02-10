export { vers, manpage };

const vers = "0.0.1";

const manpage = String.raw `
NAME
    deno DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]

SYNOPSIS
    TODO

OPTIONS
    -f, --force           Unconditionally make all tasks.
    -h, --help            Display this help message.
    -l, --list            Display tasks and task descriptions.
    -n, --dry-run         Skip execution of task actions.
    -q, --quiet           Do not log messages to standard output.
    --version             Display the Drake version.


VARIABLES
    Variables are formatted like '<name>=<value>' e.g. 'vers=0.1.0'.
    Accessed via 'vars' e.g. 'vars.vers'.

    Tip: Use shell quoting and escapes to process values containing spaces or special characters
    e.g. 'title=Foo & bar'.


TASKS
    - File and non-file tasks differentiated by name:
    file names must be prefixed with '/', './', or '../'
    e.g. 'foobar' is a non-file task, './foobar' is a file task,


EXAMPLES
    TODO`;

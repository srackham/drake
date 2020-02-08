
## Questions

## Resources
- [Jake](https://jakejs.com/).
- https://github.com/jakejs/jake
- https://deno.land/x/task_runner/README.md


## Usage
```
Usage: deno DRAKEFILE [OPTION...] [VARIABLE...] [TASK...]

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
Variables are formatted like `<name>=<value>` e.g. `vers=0.1.0`.
Accessed via `vars` e.g. `vars.vers`.

Tip: Use shell quoting and escapes to process values containing spaces or special characters
e.g. `'title=Foo & bar'`.


TASKS
- File and non-file tasks differentiated by name:
  file names must be prefixed with `/`, `./`, or `../`
  e.g. 'foobar' is a non-file task, './foobar' is a file task,


EXAMPLES
TODO
```

## API
when the drake.ts module ii imported:

- The command-line aguments are pased to `opts` and `vars`.

When the `run()` function is executed:

- If `--version`, `--help` or `--list` options were specified the corresponding
  information is printed and Drake exits.
- Synthesises ordered list of actionable tasks from opts.tasks using the tasks registry.
- Executes the list of actionable tasks.

```
vars: { [name:string] : string }; // Command-line variables.

tasks: { [name: string] : Task }; // Task registry.

interface Task {
  name: string;
  desc: string;
  prereqs: string[];
  action: Action;
}

function desc(description: string): void; // Register task description.

function task(name: string, prerequisites: Task[], action: Action): void; // Register task.

function run(): void; // Execute Drake tasks.

// Utility functions.
function log(msg: string?): void;         // Print log message.
function die(msg: string?): void;         // Error exit.
function exec(cmds: string[]): void;   // Execute shell commands sequentially.
function execConcurrently(cmds: string[]): void;      // Execute shell commands concurrently.
function glob(pattern: string, options): string[];

// Command-line options.
opts: Options;

interface Options {
  force: boolean;
  quiet: boolean;
  help: boolean;
  vers: boolean;
  list: boolean;
  dryrun: boolean;
  tasks: string[];  // Command-line tasks.
}
```


## Example Drake file
```
import * from './lib/drake.ts'

desc('Task one')
task('task1', [], function() {
  ...  
})

desc('Task two')
task('task2', [task1], function() {
  ...  
})

run()
```

## Tips
- Read file to string:

  readFileStrSync(filename).toString();

- Write string to file:

  writeFileStrSync(filename, 'Hello world!')

- Replace text in file:

  let text = readFileStrSync(filename).toString();
  text = text.replace(/foo/gi, 'bar');
  writeFileStrSync(filename, text);

- Use drake alias to execute Drakefile.ts:

  alias drake=deno Drakefile.ts

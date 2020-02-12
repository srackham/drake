
## Questions

## Resources
- [Jake](https://jakejs.com/).
- https://github.com/jakejs/jake
- https://deno.land/x/task_runner/README.md


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

function glob(pattern: string, options): string[];

function exec(args: string[]): void;   // Run executable.

function shell(cmds: string[]): void;   // Execute shell commands sequentially.
function shellConcurrently(cmds: string[]): void;      // Execute shell commands concurrently.

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

## Globbing
[Glob primer](https://github.com/isaacs/node-glob/blob/master/README.md#glob-primer).

Deno globbing is based on


## Cookbook
- Read file info e.g.

  Deno.statSync(f).modified

- Use [concat()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat) to merge two or more arrays:

  arr4 = arr1.concat(arr2, arr3);
  arr4 = arr1.concat(); // Shallow copy of arr1.

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

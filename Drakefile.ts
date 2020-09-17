/**
 * Drake drakefile.
 */

import {
  abort,
  desc,
  env,
  glob,
  quote,
  run,
  sh,
  task,
  vers,
} from "./mod.ts";

env("--default-task", "test");
const TS_FILES = [...glob("*.ts"), ...glob("+(lib|tests)/*.ts")].filter((p) =>
  !p.endsWith(".d.ts")
);

desc("Run tests");
task("test", ["fmt"], async function () {
  await sh(
    `deno test -A ${env("--quiet") ? "--quiet" : ""} tests`,
    env("--debug") ? { env: { DRAKE_DEBUG: "true" } } : {},
  );
});

desc("Format source files");
task("fmt", [], async function () {
  await sh(`deno fmt ${quote(TS_FILES)}`);
});

desc("Run some example drakefiles");
task("examples", [], async function () {
  await sh(`
    deno run -A examples/examples-drakefile.ts help prereqs pause "qux=Foo Bar" noop
  `);
});

function checkVers(task: any) {
  if (!env("vers")) {
    abort(
      `version number must be specified e.g. drake ${task.name} vers=1.0.0`,
    );
  }
  if (!/^\d+\.\d+\.\d+/.test(env("vers"))) {
    abort(`illegal semantic version number: ${env("vers")}`);
  }
}

desc(
  "Create Git version number tag",
);
task("tag", ["test"], async function () {
  checkVers(this);
  if (vers() !== env("vers")) {
    abort(`${env("vers")} does not match version ${vers()} in mod.ts`);
  }
  const tag = `v${env("vers")}`;
  console.log(`tag: ${tag}`);
  await sh(`git tag -a -m ${tag} ${tag}`);
});

desc("Push changes to Github");
task("push", ["test"], async function () {
  await sh("git push -u --tags origin master");
});

run();

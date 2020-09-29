/**
 * Drake drakefile.
 */

import type { Task } from "./mod.ts";
import {
  abort,
  desc,
  env,
  glob,
  quote,
  readFile,
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
task("test", ["lint", "fmt"], async function () {
  await sh(
    `deno test -A ${env("--quiet") ? "--quiet" : ""} tests`,
    env("--debug") ? { env: { DRAKE_DEBUG: "true" } } : {},
  );
});

desc("Format source files");
task("fmt", [], async function () {
  await sh(`deno fmt --quiet ${quote(TS_FILES)}`);
});

desc("Lint source files");
task("lint", [], async function () {
  await sh(`deno lint --unstable ${quote(TS_FILES)}`);
});

desc("Run some example drakefiles");
task("examples", [], async function () {
  await sh(`
    deno run -A examples/examples-drakefile.ts help prereqs pause "qux=Foo Bar" noop
  `);
});

function checkVers(task: Task) {
  if (!env("vers")) {
    abort(
      `version number must be specified e.g. drake ${task.name} vers=1.0.0`,
    );
  }
  if (!/^\d+\.\d+\.\d+/.test(env("vers"))) {
    abort(`illegal semantic version number: ${env("vers")}`);
  }
}

function checkEgg() {
  const egg = JSON.parse(readFile("egg.json"));
  if (env("vers") !== egg.version) {
    abort(
      `egg.json version ${egg.version} does not match version ${env("vers")}`,
    );
  }
}

desc(
  "Create Git version number tag",
);
task("tag", ["test"], async function () {
  checkVers(this);
  checkEgg();
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

desc("Publish tagged version to nest.land registry");
task("publish-nestland", [], async function () {
  checkVers(this);
  // Publication is staged from temporary directory.
  const tmpDir = Deno.makeTempDirSync({ prefix: "drake-egg-" });
  try {
    await sh(`git clone . "${tmpDir}"`);
    const savedDir = Deno.cwd();
    try {
      Deno.chdir(tmpDir);
      await sh(`git checkout --quiet v${env("vers")}`);
      checkEgg();
      await sh("eggs publish");
    } finally {
      Deno.chdir(savedDir);
    }
  } finally {
    Deno.removeSync(tmpDir, { recursive: true });
  }
});

run();

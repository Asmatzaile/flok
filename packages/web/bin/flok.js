#!/usr/bin/env node

const program = require("commander");
// const { spawn } = require("child_process");
const packageInfo = require("../package.json");
// const PubSubClient = require("../lib/pubsub-client");
const { REPL } = require("../lib/repl");

program
  .version(packageInfo.version)
  .option("-t, --target [NAME]", "Use the specified name as target", "default")
  .option("--secure", "Use secure connection (wss://)", false)
  .option("-H, --host [HOST]", "Evaluation WebSockets server host", "localhost")
  .option("-P, --port [PORT]", "Evaluation WebSockets server port", 3000)
  .option("--path [PATH]", "Evaluation WebSockets server path", "/pubsub")
  .parse(process.argv);

const cmd = program.args[0];
const cmdArgs = program.args.slice(1);

if (!cmd) {
  console.error("Missing REPL command (e.g.: flok -- sclang)");
  program.outputHelp();
  process.exit(1);
}

const wsProtocol = program.secure ? "wss" : "ws";
const wsUrl = `${wsProtocol}://${program.host}:${program.port}`;

console.log(`Target: ${program.target}`);
console.log(`PubSub server: ${wsUrl}`);
console.log(`Spawn: ${JSON.stringify(program.args)}`);

const replClient = new REPL({
  command: program.args.join(" "),
  target: program.target,
  hub: wsUrl,
  pubSubPath: program.path
});
replClient.start();

replClient.emitter.on("data", data => {
  const line = data.lines.join("\n> ");
  if (line) {
    if (data.type === "stderr") {
      process.stderr.write(`> ${line}\n`);
    } else if (data.type === "stdout") {
      process.stdout.write(`> ${line}\n`);
    } else if (data.type === "stdin") {
      process.stdout.write(`< ${line}\n`);
    } else {
      process.stdout.write(`[data] ${JSON.stringify(data)}\n`);
    }
  }
});

replClient.emitter.on("close", ({ code }) => {
  process.exit(code);
});
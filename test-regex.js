const fs = require('fs');
let c = fs.readFileSync('.next/standalone/server.js', 'utf8');

const m1 = c.match(/"cpus":\w+/);
const m2 = c.match(/"workerThreads":\w+/);
const m3 = c.match(/"turbopackPluginRuntimeStrategy":"[^"]+"/);

console.log("Original match:");
console.log(m1 && m1[0]);
console.log(m2 && m2[0]);
console.log(m3 && m3[0]);

let patched = c.replace(/"cpus":\d+/, '"cpus":1');
patched = patched.replace(/"workerThreads":false/, '"workerThreads":true');
patched = patched.replace(/"turbopackPluginRuntimeStrategy":"childProcesses"/, '"turbopackPluginRuntimeStrategy":"workerThreads"');

console.log("\nPatched match:");
console.log(patched.match(/"cpus":\w+/)[0]);
console.log(patched.match(/"workerThreads":\w+/)[0]);
console.log(patched.match(/"turbopackPluginRuntimeStrategy":"[^"]+"/)[0]);

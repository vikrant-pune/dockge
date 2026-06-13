import { DockgeServer } from "../backend/dockge-server";
import { Stack } from "../backend/stack";
import * as fs from "fs";
import * as path from "path";

const benchmarkDir = path.join(__dirname, "benchmark_stacks");

async function setupBenchmarkEnvironment(numStacks: number) {
    console.log(`Setting up ${numStacks} mock stacks in ${benchmarkDir}...`);
    if (fs.existsSync(benchmarkDir)) {
        fs.rmSync(benchmarkDir, { recursive: true, force: true });
    }
    fs.mkdirSync(benchmarkDir, { recursive: true });

    for (let i = 0; i < numStacks; i++) {
        const stackDir = path.join(benchmarkDir, `stack_${i}`);
        fs.mkdirSync(stackDir);
        fs.writeFileSync(path.join(stackDir, "compose.yaml"), `services:\n  web_${i}:\n    image: nginx\n`);
        fs.writeFileSync(path.join(stackDir, ".env"), `VAR_${i}=VAL_${i}\n`);
    }
}

async function cleanupBenchmarkEnvironment() {
    console.log("Cleaning up benchmark environment...");
    if (fs.existsSync(benchmarkDir)) {
        fs.rmSync(benchmarkDir, { recursive: true, force: true });
    }
}

async function runBenchmark() {
    await setupBenchmarkEnvironment(200);

    // Mock server to just provide the stacksDir
    const server = new DockgeServer();
    server.stacksDir = benchmarkDir;

    console.log("Starting benchmark for Stack.getStackList()...");
    
    const start = performance.now();
    const list = await Stack.getStackList(server, false);
    const end = performance.now();

    console.log(`Discovered ${list.size} stacks.`);
    console.log(`Execution Time: ${(end - start).toFixed(2)} ms`);

    await cleanupBenchmarkEnvironment();
}

runBenchmark().catch(console.error);

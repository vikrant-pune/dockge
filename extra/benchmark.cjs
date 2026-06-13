const fs = require('fs');
const fsAsync = require('fs/promises');
const path = require('path');

const benchmarkDir = path.join(__dirname, "benchmark_stacks");

async function setupBenchmarkEnvironment(numStacks) {
    if (fs.existsSync(benchmarkDir)) {
        fs.rmSync(benchmarkDir, { recursive: true, force: true });
    }
    fs.mkdirSync(benchmarkDir, { recursive: true });

    for (let i = 0; i < numStacks; i++) {
        const stackDir = path.join(benchmarkDir, `stack_${i}`);
        fs.mkdirSync(stackDir);
        fs.writeFileSync(path.join(stackDir, "compose.yaml"), `services:\n  web_${i}:\n    image: nginx\n`);
    }
}

async function cleanupBenchmarkEnvironment() {
    if (fs.existsSync(benchmarkDir)) {
        fs.rmSync(benchmarkDir, { recursive: true, force: true });
    }
}

// Sequential Logic (Old implementation simulation)
async function getStackListSequential(stacksDir) {
    let filenameList = await fsAsync.readdir(stacksDir);
    let count = 0;
    for (let filename of filenameList) {
        let stat = await fsAsync.stat(path.join(stacksDir, filename));
        if (stat.isDirectory()) {
            if (fs.existsSync(path.join(stacksDir, filename, "compose.yaml"))) {
                count++;
            }
        }
    }
    return count;
}

// Parallel Logic (New implementation simulation)
async function getStackListParallel(stacksDir) {
    let filenameList = await fsAsync.readdir(stacksDir);
    let count = 0;
    await Promise.all(filenameList.map(async (filename) => {
        let stat = await fsAsync.stat(path.join(stacksDir, filename));
        if (stat.isDirectory()) {
            try {
                await fsAsync.access(path.join(stacksDir, filename, "compose.yaml"), fs.constants.F_OK);
                count++;
            } catch (e) {}
        }
    }));
    return count;
}

async function runBenchmark() {
    const NUM_STACKS = 500;
    await setupBenchmarkEnvironment(NUM_STACKS);

    console.log(`--- Benchmarking Directory Parsing for ${NUM_STACKS} Stacks ---\\n`);

    // Warmup
    await getStackListSequential(benchmarkDir);
    await getStackListParallel(benchmarkDir);

    // Test Sequential
    let startSeq = performance.now();
    await getStackListSequential(benchmarkDir);
    let endSeq = performance.now();
    let timeSeq = endSeq - startSeq;
    
    // Test Parallel
    let startPar = performance.now();
    await getStackListParallel(benchmarkDir);
    let endPar = performance.now();
    let timePar = endPar - startPar;

    console.log(`[Before] Sequential Sync FS calls: ${timeSeq.toFixed(2)} ms`);
    console.log(`[After]  Parallel Async FS calls:   ${timePar.toFixed(2)} ms`);
    
    const speedup = timeSeq / timePar;
    console.log(`\\nPerformance Gain: ${speedup.toFixed(2)}x faster!`);

    await cleanupBenchmarkEnvironment();
}

runBenchmark().catch(console.error);

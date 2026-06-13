import { Antigravity } from "../antigravity";
import { DockgeServer } from "../dockge-server";
import * as fs from "fs";
import * as path from "path";
import yaml from "yaml";

const testDir = path.join(__dirname, "antigravity_test");

async function setup() {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });
    
    const stackDir = path.join(testDir, "test_stack");
    fs.mkdirSync(stackDir);

    const initialYaml = `services:
  web:
    image: nginx
    ports:
      - "8080:80"
`;
    fs.writeFileSync(path.join(stackDir, "compose.yaml"), initialYaml);
    fs.writeFileSync(path.join(stackDir, ".env"), "");
}

async function runTests() {
    console.log("Setting up Antigravity tests...");
    await setup();

    const server = new DockgeServer();
    server.stacksDir = testDir;

    const antigravity = new Antigravity(server);

    console.log("Testing applyConstraints (CPU & Memory)...");
    await antigravity.applyConstraints("test_stack", {
        cpus: "0.5",
        mem_limit: "512M"
    });

    const modifiedYaml = fs.readFileSync(path.join(testDir, "test_stack", "compose.yaml"), "utf-8");
    const doc = yaml.parse(modifiedYaml);

    if (doc.services.web.deploy?.resources?.limits?.cpus !== "0.5") {
        console.error("❌ Failed to inject CPU limits.");
    } else if (doc.services.web.deploy?.resources?.limits?.memory !== "512M") {
        console.error("❌ Failed to inject Memory limits.");
    } else {
        console.log("✅ Successfully injected Resource Constraints.");
    }

    console.log("Testing network isolation...");
    await antigravity.applyConstraints("test_stack", {
        network_isolate: true
    });

    const isolatedYaml = fs.readFileSync(path.join(testDir, "test_stack", "compose.yaml"), "utf-8");
    const docIsolated = yaml.parse(isolatedYaml);

    if (docIsolated.services.web.network_mode !== "none") {
        console.error("❌ Failed to isolate network.");
    } else {
        console.log("✅ Successfully isolated Network.");
    }
    
    // Clean up
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log("Antigravity tests completed successfully.");
}

runTests().catch(console.error);

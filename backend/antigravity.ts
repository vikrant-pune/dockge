import { Stack } from "./stack";
import { DockgeServer } from "./dockge-server";
import { DockgeSocket, fileExists } from "./util-server";
import yaml from "yaml";
import * as fsAsync from "fs/promises";
import path from "path";

export interface AntigravityConstraints {
    cpus?: string;
    mem_limit?: string;
    network_isolate?: boolean;
}

export class Antigravity {
    server: DockgeServer;

    constructor(server: DockgeServer) {
        this.server = server;
    }

    async applyConstraints(stackName: string, constraints: AntigravityConstraints) {
        const stack = await Stack.getStack(this.server, stackName);
        let composeYamlStr = await stack.readComposeYAML();
        
        let composeDoc = yaml.parseDocument(composeYamlStr);
        let services = composeDoc.get("services") as yaml.YAMLMap;
        
        if (services) {
            for (const item of services.items) {
                const serviceNode = item.value as yaml.YAMLMap;
                
                // Resources
                if (constraints.cpus || constraints.mem_limit) {
                    let deployNode = serviceNode.get("deploy") as yaml.YAMLMap;
                    if (!deployNode) {
                        deployNode = new yaml.YAMLMap();
                        serviceNode.set("deploy", deployNode);
                    }
                    
                    let resourcesNode = deployNode.get("resources") as yaml.YAMLMap;
                    if (!resourcesNode) {
                        resourcesNode = new yaml.YAMLMap();
                        deployNode.set("resources", resourcesNode);
                    }

                    let limitsNode = resourcesNode.get("limits") as yaml.YAMLMap;
                    if (!limitsNode) {
                        limitsNode = new yaml.YAMLMap();
                        resourcesNode.set("limits", limitsNode);
                    }

                    if (constraints.cpus) {
                        limitsNode.set("cpus", constraints.cpus);
                    }
                    if (constraints.mem_limit) {
                        limitsNode.set("memory", constraints.mem_limit);
                    }
                }

                // Network isolation
                if (constraints.network_isolate !== undefined) {
                    if (constraints.network_isolate) {
                        serviceNode.set("network_mode", "none");
                    } else {
                        serviceNode.delete("network_mode");
                    }
                }
            }
        }

        const newYamlStr = String(composeDoc);
        
        // Write the new YAML
        // We can just overwrite the current file
        const stackDir = stack.path;
        // In real stack.save(), we would use _composeFileName, but here we assume compose.yaml or it's retrieved
        // Wait, we need to expose _composeFileName or write a method on Stack. 
        // For simplicity, we just save via stack.save(false) but stack needs its internal property updated.
        // Let's create an update method on Stack, or just overwrite the file directly since Stack caches it.
        const acceptedComposeFileNames = ["compose.yaml", "docker-compose.yaml", "docker-compose.yml", "compose.yml"];
        let composeFileName = "compose.yaml";
        for (const filename of acceptedComposeFileNames) {
            if (await fileExists(path.join(stackDir, filename))) {
                composeFileName = filename;
                break;
            }
        }
        await fsAsync.writeFile(path.join(stackDir, composeFileName), newYamlStr);
    }

    async suspendStack(socket: DockgeSocket, stackName: string) {
        const stack = await Stack.getStack(this.server, stackName);
        return await stack.stop(socket);
    }

    async isolateStack(socket: DockgeSocket, stackName: string) {
        // Isolate means applying network_isolate=true and then redeploying
        await this.applyConstraints(stackName, { network_isolate: true });
        const stack = await Stack.getStack(this.server, stackName);
        return await stack.deploy(socket);
    }
}

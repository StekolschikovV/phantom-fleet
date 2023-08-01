#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const interface_1 = require("./interface");
const fs_1 = __importDefault(require("fs"));
const { spawn } = require('child_process');
let client = null;
const socketPath = '/tmp/my_unix_socket6';
switch (process.argv[2]) {
    case "list":
        client = net_1.default.createConnection({ path: socketPath }, () => {
            const jsonData = { type: interface_1.EEvent.GET_LIST };
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break;
    case "stopAll":
        client = net_1.default.createConnection({ path: socketPath }, () => {
            const jsonData = { type: interface_1.EEvent.STOP_ALL };
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break;
    case "removeAll":
        console.log("removeAll");
        client = net_1.default.createConnection({ path: socketPath }, () => {
            const jsonData = { type: interface_1.EEvent.REMOVE_ALL };
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break;
    case "remove":
        console.log("removeAll");
        client = net_1.default.createConnection({ path: socketPath }, () => {
            if (!process.argv[3])
                throw new Error("Specify ID!");
            const jsonData = { type: interface_1.EEvent.REMOVE, appId: +process.argv[3] };
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break;
    case "stop":
        client = net_1.default.createConnection({ path: socketPath }, () => {
            if (!process.argv[3])
                throw new Error("Specify ID!");
            const jsonData = { type: interface_1.EEvent.STOP, appId: +process.argv[3] };
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break;
    case "start":
        client = net_1.default.createConnection({ path: socketPath }, () => {
            const fileName = process.argv[3];
            if (!fileName || !fs_1.default.existsSync(fileName)) {
                console.log("Check the path to the file!");
                client === null || client === void 0 ? void 0 : client.end();
            }
            else {
                let rawdata = fs_1.default.readFileSync(fileName);
                const jsonData = { type: interface_1.EEvent.START, apps: JSON.parse(rawdata).apps };
                const jsonDataString = JSON.stringify(jsonData);
                client && client.write(jsonDataString);
            }
        });
        break;
    case "startDamon":
        const scriptProcess = spawn('node', ['./background.js'], {
            detached: true,
            stdio: 'ignore',
        });
        scriptProcess.unref();
        break;
    default:
        console.log("Command not recognized!");
        break;
}
if (client) {
    client.on('data', (data) => {
        const responseData = JSON.parse(data);
        console.log('Received response from server:', responseData);
        client && client.end();
    });
    client.on('error', (err) => {
        console.error('example.js is not running:', err.message);
    });
}
//# sourceMappingURL=index.js.map
#!/usr/bin/env ts-node

import net, {Socket} from "net";
import {EEvent, EventMessageType} from "./interface";
import fs from "fs";

let client: Socket | null = null
const socketPath = '/tmp/my_unix_socket3';

switch (process.argv[2]) {
    case "list":
        client = net.createConnection({path: socketPath}, () => {
            const jsonData: EventMessageType = {type: EEvent.GET_LIST};
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break
    case "stopAll":
        console.log("stop all")
        client = net.createConnection({path: socketPath}, () => {
            const jsonData: EventMessageType = {type: EEvent.STOP_ALL};
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break
    case "stop":
        client = net.createConnection({path: socketPath}, () => {
            if (!process.argv[3]) throw new Error("Specify ID!")
            const jsonData: EventMessageType = {type: EEvent.STOP, appId: +process.argv[3]};
            const jsonDataString = JSON.stringify(jsonData);
            client && client.write(jsonDataString);
        });
        break
    case "start":
        client = net.createConnection({path: socketPath}, () => {
            const fileName = process.argv[3]
            if (!fileName || !fs.existsSync(fileName)) {
                console.log("Check the path to the file!")
                client?.end()
            } else {
                let rawdata = fs.readFileSync(fileName) as unknown as string
                const jsonData: EventMessageType = {type: EEvent.START, apps: JSON.parse(rawdata).apps};
                const jsonDataString = JSON.stringify(jsonData);
                client && client.write(jsonDataString);
            }
        });
        break
    default:
        console.log("Command not recognized!")
        break
}

if (client) {
    client.on('data', (data: string) => {
        const responseData = JSON.parse(data);
        console.log('Received response from server:', responseData);
        client && client.end();
    });
    client.on('error', (err) => {
        console.error('example.js is not running:', err.message);
    });

}

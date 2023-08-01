#!/usr/bin/env node

import net from 'net';
import fs from 'fs';
import {EEvent, EventMessageType, IApp} from "./interface";
import PhantomFleet from "./lib";

// Удаление сокета, если он существует
const socketPath = '/tmp/my_unix_socket6';
if (fs.existsSync(socketPath)) {
    fs.unlinkSync(socketPath);
}

let apps: IApp[] = []

// Создаем Unix сокет
const server = net.createServer((client) => {
    console.log('Connection established.');
    const getList = () => {
        try {
            client.write(JSON.stringify(apps.map(a => {
                return {
                    CONTAINER_NAME: a.CONTAINER_NAME
                }
            })));
        } catch (e) {
            console.log(e)
        }
    }
    const stopAll = () => {
        console.log("stopAll")
        apps.forEach(a => {
            try {
                a?.instance?.stop()
            } catch (e) {
                console.log(e)
            }
        })
        apps = []
    }
    const stop = (appId: number) => {
        try {
            apps[appId]?.instance?.stop()
            // apps = apps.filter((a, i) => i !== appId)
        } catch (e) {
            console.log(e)
        }
    }

    const remove = (appId: number) => {
        console.log("remove")
        try {
            apps[appId]?.instance?.remove()
            // apps = apps.filter((a, i) => i !== appId)
        } catch (e) {
            console.log(e)
        }
    }
    const removeAll = () => {
        console.log("removeAll")
        apps.forEach(a => {
            try {
                a?.instance?.remove()
            } catch (e) {
                console.log(e)
            }
        })
        apps = []
    }
    const start = (newApps: IApp[]) => {
        newApps.forEach(a => {
            try {
                if (apps.filter(ao => ao.CONTAINER_NAME === a.CONTAINER_NAME || ao.APP_PORT === a.APP_PORT).length === 0) {
                    const app = new PhantomFleet(
                        a.CONTAINER_NAME,
                        a.LOG_START_TEXT,
                        a.TIMEOUT_INACTIVE,
                        a.IMAGE,
                        a.PORT,
                        a.HOST_PORT,
                        a.TARGET,
                        a.APP_PORT,
                        a.ENV
                    )
                    app.start()
                    apps.push({
                        CONTAINER_NAME: a.CONTAINER_NAME,
                        LOG_START_TEXT: a.LOG_START_TEXT,
                        TIMEOUT_INACTIVE: a.TIMEOUT_INACTIVE,
                        IMAGE: a.IMAGE,
                        PORT: a.PORT,
                        HOST_PORT: a.HOST_PORT,
                        TARGET: a.TARGET,
                        APP_PORT: a.APP_PORT,
                        ENV: a.ENV,
                        instance: app
                    })
                }
            } catch (e) {
                console.log(e)
            }

        })
    }

    // Вызываем метод doSomeWork() при получении данных от клиента
    client.on('data', (data: string) => {
        const jsonData: EventMessageType = JSON.parse(data);
        switch (jsonData.type) {
            case EEvent.GET_LIST:
                getList()
                break
            case EEvent.STOP_ALL:
                stopAll()
                break
            case EEvent.STOP:
                stop(jsonData.appId)
                break
            case EEvent.START:
                start(jsonData.apps)
                break
            case EEvent.REMOVE:
                remove(jsonData.appId)
                break
            case EEvent.REMOVE_ALL:
                removeAll()
                break
        }
        client.end();
    });
});

server.listen(socketPath, () => {
    console.log('Server listening on', socketPath);
});

process.on('SIGINT', () => {
    console.log('Closing server...');
    server.close(() => {
        console.log('Server closed.');
        process.exit();
    });
});

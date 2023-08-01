"use strict";
// example.js
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const fs_1 = __importDefault(require("fs"));
const interface_1 = require("./interface");
const lib_1 = __importDefault(require("./lib"));
// Удаление сокета, если он существует
const socketPath = '/tmp/my_unix_socket3';
if (fs_1.default.existsSync(socketPath)) {
    fs_1.default.unlinkSync(socketPath);
}
let apps = [];
// Создаем Unix сокет
const server = net_1.default.createServer((client) => {
    console.log('Connection established.');
    const getList = () => {
        try {
            client.write(JSON.stringify(apps.map(a => {
                return {
                    CONTAINER_NAME: a.CONTAINER_NAME
                };
            })));
        }
        catch (e) {
            console.log(e);
        }
    };
    const stopAll = () => {
        console.log("stopAll");
        apps.forEach(a => {
            var _a;
            try {
                (_a = a === null || a === void 0 ? void 0 : a.instance) === null || _a === void 0 ? void 0 : _a.stop();
            }
            catch (e) {
                console.log(e);
            }
        });
        apps = [];
    };
    const stop = (appId) => {
        var _a, _b;
        try {
            (_b = (_a = apps[appId]) === null || _a === void 0 ? void 0 : _a.instance) === null || _b === void 0 ? void 0 : _b.stop();
            // apps = apps.filter((a, i) => i !== appId)
        }
        catch (e) {
            console.log(e);
        }
    };
    const remove = (appId) => {
        var _a, _b;
        console.log("remove");
        try {
            (_b = (_a = apps[appId]) === null || _a === void 0 ? void 0 : _a.instance) === null || _b === void 0 ? void 0 : _b.remove();
            // apps = apps.filter((a, i) => i !== appId)
        }
        catch (e) {
            console.log(e);
        }
    };
    const removeAll = () => {
        console.log("removeAll");
        apps.forEach(a => {
            var _a;
            try {
                (_a = a === null || a === void 0 ? void 0 : a.instance) === null || _a === void 0 ? void 0 : _a.remove();
            }
            catch (e) {
                console.log(e);
            }
        });
        apps = [];
    };
    const start = (newApps) => {
        newApps.forEach(a => {
            try {
                if (apps.filter(ao => ao.CONTAINER_NAME === a.CONTAINER_NAME || ao.APP_PORT === a.APP_PORT).length === 0) {
                    const app = new lib_1.default(a.CONTAINER_NAME, a.LOG_START_TEXT, a.TIMEOUT_INACTIVE, a.IMAGE, a.PORT, a.HOST_PORT, a.TARGET, a.APP_PORT);
                    app.start();
                    apps.push({
                        CONTAINER_NAME: a.CONTAINER_NAME,
                        LOG_START_TEXT: a.LOG_START_TEXT,
                        TIMEOUT_INACTIVE: a.TIMEOUT_INACTIVE,
                        IMAGE: a.IMAGE,
                        PORT: a.PORT,
                        HOST_PORT: a.HOST_PORT,
                        TARGET: a.TARGET,
                        APP_PORT: a.APP_PORT,
                        instance: app
                    });
                }
            }
            catch (e) {
                console.log(e);
            }
        });
    };
    // Вызываем метод doSomeWork() при получении данных от клиента
    client.on('data', (data) => {
        const jsonData = JSON.parse(data);
        switch (jsonData.type) {
            case interface_1.EEvent.GET_LIST:
                getList();
                break;
            case interface_1.EEvent.STOP_ALL:
                stopAll();
                break;
            case interface_1.EEvent.STOP:
                stop(jsonData.appId);
                break;
            case interface_1.EEvent.START:
                start(jsonData.apps);
                break;
            case interface_1.EEvent.REMOVE:
                remove(jsonData.appId);
                break;
            case interface_1.EEvent.REMOVE_ALL:
                removeAll();
                break;
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
//# sourceMappingURL=background.js.map
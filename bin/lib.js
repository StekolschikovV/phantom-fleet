"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_proxy_middleware_1 = require("http-proxy-middleware");
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const dockerode_1 = __importDefault(require("dockerode"));
const portscanner_1 = __importDefault(require("portscanner"));
class PhantomFleet {
    constructor(CONTAINER_NAME, LOG_START_TEXT, TIMEOUT_INACTIVE, IMAGE, PORT, HOST_PORT, TARGET, APP_PORT) {
        this.container = null;
        this.timer = null;
        this.CONTAINER_NAME = "";
        this.LOG_START_TEXT = "";
        this.IMAGE = "";
        this.PORT = "";
        this.HOST_PORT = "";
        this.start = () => {
            try {
                this.app.use((req, res, next) => __awaiter(this, void 0, void 0, function* () {
                    if (this.container === null) {
                        this.container = yield this.docker.getContainer(this.CONTAINER_NAME);
                        yield this.startContainer();
                        this.restartTimer();
                    }
                    else {
                        this.container = yield this.docker.getContainer(this.CONTAINER_NAME);
                        const containerInfo = yield this.container.inspect();
                        console.log("++containerInfo.State.Paused", containerInfo.State.Paused);
                    }
                    next();
                }));
                this.app.use('/', (0, http_proxy_middleware_1.createProxyMiddleware)({
                    target: this.TARGET,
                    changeOrigin: true,
                    onError: (err, req, res) => __awaiter(this, void 0, void 0, function* () {
                        this.container = null;
                        if (err.code === 'ECONNREFUSED') {
                            console.error('Connection refused, restarting container...');
                            yield this.startContainer();
                            // @ts-ignore
                            (0, http_proxy_middleware_1.createProxyMiddleware)({
                                target: this.TARGET,
                                changeOrigin: true,
                            })(req, res);
                            this.restartTimer();
                        }
                        else {
                            res.status(500).send('Proxy Error');
                        }
                    })
                }));
                portscanner_1.default.checkPortStatus(this.APP_PORT, '127.0.0.1', (error, status) => {
                    if (status === "open") {
                        console.log(`The port ${this.APP_PORT} is busy!`);
                    }
                    else {
                        this.app.listen(this.APP_PORT, () => {
                            console.log(`Proxy server listening on port ${this.APP_PORT}...`);
                        });
                    }
                });
            }
            catch (e) {
                console.log(e);
            }
        };
        this.remove = () => {
            this.container && this.container.stop((err, data) => {
                if (err) {
                    console.error('Error stopping the container:', err);
                }
                else {
                    this.container && this.container.remove({ force: true }, function (err, data) {
                        if (err) {
                            if (err.statusCode === 409) {
                                console.error('Container is already in progress of removal');
                            }
                            else {
                                console.error('Error removing the container:', err);
                            }
                        }
                        else {
                            console.log('Container removed successfully');
                        }
                    });
                }
            });
        };
        this.stop = () => {
            this.stopContainer();
        };
        this.stopContainer = () => __awaiter(this, void 0, void 0, function* () {
            if (this.container) {
                yield this.container.pause();
                this.container = null;
                console.log(`Container ${this.CONTAINER_NAME} stopped.`);
            }
        });
        this.pullImage = (imageName) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.docker.pull(imageName, (err, stream) => {
                    if (err)
                        reject(err);
                    this.docker.modem.followProgress(stream, (err, output) => {
                        if (err)
                            reject(err);
                        else
                            resolve(output);
                    });
                });
            });
        });
        this.waitForLogMessage = (container, message) => __awaiter(this, void 0, void 0, function* () {
            const logsStream = yield container.attach({
                stream: true,
                stdout: true,
                stderr: true,
                timestamps: true,
            });
            return new Promise((resolve, reject) => {
                logsStream.on('data', (data) => {
                    const logMessage = data.toString();
                    if (logMessage.includes(message)) {
                        logsStream.destroy(); // Destroy the stream when the message is found
                        resolve();
                    }
                });
                logsStream.on('end', () => {
                    reject(new Error(`Message "${message}" not found in the logs.`));
                });
                logsStream.on('error', (err) => {
                    reject(err);
                });
            });
        });
        this.createNewContainer = () => __awaiter(this, void 0, void 0, function* () {
            let exposedPortsObj = {};
            exposedPortsObj["PORT"] = {};
            let hostConfigObj = {};
            hostConfigObj[this.PORT] = [{ HostPort: this.HOST_PORT }];
            const newContainer = yield this.docker.createContainer({
                Image: this.IMAGE,
                name: this.CONTAINER_NAME,
                ExposedPorts: exposedPortsObj,
                HostConfig: {
                    PortBindings: hostConfigObj
                },
            });
            this.container = this.docker.getContainer(newContainer.id);
            yield this.container.start();
            console.log(`Waiting for "${this.LOG_START_TEXT}" message in logs...`);
            try {
                if (this.LOG_START_TEXT)
                    yield this.waitForLogMessage(this.container, this.LOG_START_TEXT);
                console.log(`"${this.LOG_START_TEXT}" message found in logs.`);
            }
            catch (error) {
                console.error(`Error waiting for "${this.LOG_START_TEXT}" message:`, error.message);
            }
            console.log(`Container ${this.CONTAINER_NAME} started.`);
        });
        this.restartTimer = () => {
            if (this.timer)
                clearTimeout(this.timer);
            this.timer = setTimeout(this.stopContainer, this.TIMEOUT_INACTIVE);
        };
        this.startContainer = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const containers = yield this.docker.listContainers({ all: true });
                const existingContainer = containers.find((containerInfo) => containerInfo.Names.includes(`/${this.CONTAINER_NAME}`));
                if (existingContainer) {
                    this.container = yield this.docker.getContainer(this.CONTAINER_NAME);
                    const containerInfo = yield this.container.inspect();
                    console.log("++containerInfo.State.Paused", containerInfo.State.Paused);
                    if (!containerInfo.State.Running) {
                        yield this.container.start();
                        yield this.container.logs({
                            stdout: true,
                            stderr: true,
                            timestamps: true,
                        });
                        if (this.LOG_START_TEXT)
                            yield this.waitForLogMessage(this.container, this.LOG_START_TEXT);
                        console.log(`Container ${this.CONTAINER_NAME} run.`);
                    }
                    else {
                        yield this.container.unpause();
                        console.log(`Container ${this.CONTAINER_NAME} started.`);
                    }
                }
                else {
                    const images = yield this.docker.listImages();
                    const existingImage = images.find((imageInfo) => imageInfo.RepoTags && imageInfo.RepoTags.includes(this.IMAGE));
                    if (!existingImage) {
                        // Если образа нет локально, скачиваем его с Docker Hub
                        console.log(`Image ${this.IMAGE} not found locally. Pulling from Docker Hub...`);
                        yield this.pullImage(this.IMAGE);
                    }
                    yield this.createNewContainer();
                }
            }
            catch (err) {
                console.error(`Error starting container ${this.CONTAINER_NAME}:`, err.message);
            }
        });
        this.CONTAINER_NAME = CONTAINER_NAME;
        this.LOG_START_TEXT = LOG_START_TEXT;
        this.TIMEOUT_INACTIVE = TIMEOUT_INACTIVE;
        this.IMAGE = IMAGE;
        this.PORT = PORT;
        this.TARGET = TARGET;
        this.APP_PORT = APP_PORT;
        this.HOST_PORT = HOST_PORT;
        this.docker = new dockerode_1.default();
        this.app = (0, express_1.default)();
        this.app.use((0, cors_1.default)());
    }
}
exports.default = PhantomFleet;
//# sourceMappingURL=lib.js.map
import {createProxyMiddleware} from 'http-proxy-middleware';
import cors from "cors"
import express, {Express, NextFunction, Request, Response} from "express";
import Docker from "dockerode";
import Dockerode from "dockerode";
import {IPhantomFleet} from "./interface";
import portscanner from "portscanner"

class PhantomFleet implements IPhantomFleet {

    docker: Dockerode

    container: Docker.Container | null = null;
    timer: NodeJS.Timeout | null = null;
    app: Express
    CONTAINER_NAME: string = ""
    LOG_START_TEXT: string | number = ""
    TIMEOUT_INACTIVE: number
    IMAGE: string = ""
    PORT: string | number = ""
    HOST_PORT: string | number = ""
    TARGET: string
    APP_PORT: number

    constructor(CONTAINER_NAME: string, LOG_START_TEXT: string, TIMEOUT_INACTIVE: number, IMAGE: string, PORT: string | number, HOST_PORT: string | number, TARGET: string, APP_PORT: number) {
        this.CONTAINER_NAME = CONTAINER_NAME
        this.LOG_START_TEXT = LOG_START_TEXT
        this.TIMEOUT_INACTIVE = TIMEOUT_INACTIVE
        this.IMAGE = IMAGE
        this.PORT = PORT
        this.TARGET = TARGET
        this.APP_PORT = APP_PORT
        this.HOST_PORT = HOST_PORT
        this.docker = new Docker();
        this.app = express();
        this.app.use(cors())
    }

    public start = () => {
        try {
            this.app.use(async (req: Request, res: Response, next: NextFunction) => {
                console.log("++++", this.container === null)
                if (this.container === null) {
                    this.container = await this.docker.getContainer(this.CONTAINER_NAME);
                    await this.startContainer();
                    this.restartTimer()
                } else {
                    this.container = await this.docker.getContainer(this.CONTAINER_NAME);
                    const containerInfo = await this.container.inspect();
                    console.log("++containerInfo.State.Paused", containerInfo.State.Paused)
                }
                next();
            });
            this.app.use(
                '/',
                createProxyMiddleware({
                    target: this.TARGET,
                    changeOrigin: true,
                    onError: async (err: any, req, res: any) => {
                        this.container = null
                        if (err.code === 'ECONNREFUSED') {
                            console.error('Connection refused, restarting container...');
                            await this.startContainer();
                            // @ts-ignore
                            createProxyMiddleware({
                                target: this.TARGET,
                                changeOrigin: true,
                            })(req, res)
                            this.restartTimer()
                        } else {
                            res.status(500).send('Proxy Error');
                        }
                    }
                })
            )
            portscanner.checkPortStatus(this.APP_PORT, '127.0.0.1', (error, status) => {
                if (status === "open") {
                    console.log(`The port ${this.APP_PORT} is busy!`)
                } else {
                    this.app.listen(this.APP_PORT, () => {
                        console.log(`Proxy server listening on port ${this.APP_PORT}...`);
                    });
                }
            })

        } catch (e) {
            console.log(e)
        }
    }

    public stop = () => {
        if (this.container) {
            this.container.stop();
            this.container.remove();
            this.container = null
            this.timer = null
        }
    }


    stopContainer = async () => {
        if (this.container) {
            await this.container.pause();
            this.container = null;
            console.log(`Container ${this.CONTAINER_NAME} stopped.`);
        }
    }

    private pullImage = async (imageName: string) => {
        return new Promise((resolve, reject) => {
            this.docker.pull(imageName, (err: any, stream: any) => {
                if (err) reject(err);
                this.docker.modem.followProgress(stream, (err: any, output: unknown) => {
                    if (err) reject(err);
                    else resolve(output);
                });
            });
        });
    };

    private waitForLogMessage = async (container: any, message: any) => {
        const logsStream = await container.attach({
            stream: true,
            stdout: true,
            stderr: true,
            timestamps: true,
        });
        return new Promise<void>((resolve, reject) => {
            logsStream.on('data', (data: any) => {
                const logMessage = data.toString();
                if (logMessage.includes(message)) {
                    logsStream.destroy(); // Destroy the stream when the message is found
                    resolve();
                }
            });
            logsStream.on('end', () => {
                reject(new Error(`Message "${message}" not found in the logs.`));
            });
            logsStream.on('error', (err: any) => {
                reject(err);
            });
        });
    };

    private createNewContainer = async () => {
        let exposedPortsObj: Record<string, any> = {};
        exposedPortsObj["PORT"] = {};

        let hostConfigObj: Record<string, any> = {};
        hostConfigObj[this.PORT] = [{HostPort: this.HOST_PORT}];
        const newContainer = await this.docker.createContainer({
            Image: this.IMAGE,
            name: this.CONTAINER_NAME,
            ExposedPorts: exposedPortsObj,
            HostConfig: {
                PortBindings: hostConfigObj
            },
        });
        this.container = this.docker.getContainer(newContainer.id);
        await this.container.start();
        console.log(`Waiting for "${this.LOG_START_TEXT}" message in logs...`);
        try {
            if (this.LOG_START_TEXT) await this.waitForLogMessage(this.container, this.LOG_START_TEXT);
            console.log(`"${this.LOG_START_TEXT}" message found in logs.`);
        } catch (error: any) {
            console.error(`Error waiting for "${this.LOG_START_TEXT}" message:`, error.message);
        }
        console.log(`Container ${this.CONTAINER_NAME} started.`);
    }

    private restartTimer = () => {
        if (this.timer) clearTimeout(this.timer);
        this.timer = setTimeout(this.stopContainer, this.TIMEOUT_INACTIVE);
    };

    private startContainer = async () => {
        try {
            const containers = await this.docker.listContainers({all: true});
            const existingContainer = containers.find(
                (containerInfo) => containerInfo.Names.includes(`/${this.CONTAINER_NAME}`)
            )
            if (existingContainer) {
                this.container = await this.docker.getContainer(this.CONTAINER_NAME);
                const containerInfo = await this.container.inspect();
                console.log("++containerInfo.State.Paused", containerInfo.State.Paused)
                if (!containerInfo.State.Running) {
                    await this.container.start();
                    await this.container.logs({
                        stdout: true,
                        stderr: true,
                        timestamps: true,
                    });
                    if (this.LOG_START_TEXT) await this.waitForLogMessage(this.container, this.LOG_START_TEXT);
                    console.log(`Container ${this.CONTAINER_NAME} run.`);
                } else {
                    await this.container.unpause();
                    console.log(`Container ${this.CONTAINER_NAME} started.`);
                }
            } else {
                const images = await this.docker.listImages();
                const existingImage = images.find(
                    (imageInfo) => imageInfo.RepoTags && imageInfo.RepoTags.includes(this.IMAGE)
                );
                if (!existingImage) {
                    // Если образа нет локально, скачиваем его с Docker Hub
                    console.log(`Image ${this.IMAGE} not found locally. Pulling from Docker Hub...`);
                    await this.pullImage(this.IMAGE);
                }
                await this.createNewContainer()
            }
        } catch (err: any) {
            console.error(`Error starting container ${this.CONTAINER_NAME}:`, err.message);
        }
    };
}


export default PhantomFleet
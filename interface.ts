export interface IPhantomFleet {
    start: () => void
    stop: () => void
    remove: () => void
}

export interface IApp {
    CONTAINER_NAME: string
    LOG_START_TEXT: string
    TIMEOUT_INACTIVE: number
    IMAGE: string
    PORT: string
    HOST_PORT: string
    TARGET: string
    APP_PORT: number
    ENV: string[]
    instance?: IPhantomFleet
}

export enum EEvent {
    "START",
    "STOP",
    "STOP_ALL",
    "GET_LIST",
    "REMOVE",
    "REMOVE_ALL",
}

export type EventMessageType =
    {
        type: EEvent.GET_LIST
    }
    |
    {
        type: EEvent.START,
        apps: IApp[]
    }
    |
    {
        type: EEvent.STOP,
        appId: number
    }
    |
    {
        type: EEvent.STOP_ALL,
    }
    |
    {
        type: EEvent.REMOVE,
        appId: number
    }
    |
    {
        type: EEvent.REMOVE_ALL
    }
export interface IPhantomFleet {
    start: () => void
    stop: () => void
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
    instance?: IPhantomFleet
}

export enum EEvent {
    "START",
    "STOP",
    "STOP_ALL",
    "GET_LIST"
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
        type: EEvent.STOP_ALL
    }
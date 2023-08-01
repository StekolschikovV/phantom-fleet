import PhantomFleet from "./lib"

const data = [
    {
        CONTAINER_NAME: 'strapi-blog',
        LOG_START_TEXT: 'Actions available',
        TIMEOUT_INACTIVE: 260000,
        IMAGE: 'blog-strapi:latest',
        PORT: '1337/tcp',
        HOST_PORT: '1337',
        TARGET: 'http://localhost:1337',
        APP_PORT: 3000
    },
    {
        CONTAINER_NAME: 'docker-nginx',
        LOG_START_TEXT: 'start worker process',
        TIMEOUT_INACTIVE: 10000,
        IMAGE: 'nginx:latest',
        PORT: '80/tcp',
        HOST_PORT: '88',
        TARGET: 'http://localhost:88',
        APP_PORT: 3001
    }
]

data.forEach(e => {
    const pf = new PhantomFleet(e.CONTAINER_NAME, e.LOG_START_TEXT, e.TIMEOUT_INACTIVE, e.IMAGE, e.PORT, e.HOST_PORT, e.TARGET, e.APP_PORT)
    pf.start()
})

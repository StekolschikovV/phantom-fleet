# Phantom Fleet

Phantom Fleet is a Node.js package that allows you to manage and control Docker images using configuration files. It
acts as a proxy, pausing Docker images when there are no requests and resuming them when requests come in. This package
aims to optimize the running Docker processes to save resources.

**Please note that this is a preliminary version, and I invite users to collaborate on improving the package.**

## Installation

You can install Phantom Fleet via npm:

```bash
npm install phantom-fleet
```

## Configuration

To use Phantom Fleet, you need to create a configuration file (e.g., `apps.json`) with the following format:

```json
{
  "apps": [
    {
      "CONTAINER_NAME": "docker-nginx",
      "LOG_START_TEXT": "start worker process",
      "TIMEOUT_INACTIVE": 100000,
      "IMAGE": "nginx:latest",
      "PORT": "80/tcp",
      "HOST_PORT": "88",
      "TARGET": "http://localhost:88",
      "APP_PORT": 3001
    }
    // Add more applications as needed
  ]
}
```

- `CONTAINER_NAME`: The name of the Docker image.
- `LOG_START_TEXT`: The text to wait for, indicating that the image has started successfully.
- `TIMEOUT_INACTIVE`: The duration of inactivity after which the image will be paused (in milliseconds).
- `IMAGE`: The Docker image to be used.
- `PORT`: The port opened inside the container.
- `HOST_PORT`: The port opened on the host machine.
- `TARGET`: The address to which requests will be redirected to the Docker image.
- `APP_PORT`: The port on which the application inside the container will work.

## Usage

### Starting the Daemon

To run the Phantom Fleet daemon, use the following command:

```bash
phantom-fleet-demon
```

It is recommended to run the daemon using pm2:

```bash

pm2 start phantom-fleet-demon
```

### Managing Applications

Get a list of applications:

```bash
phantom-fleet list
```

Stop all applications:

```bash
phantom-fleet stopAll
```

Stop an application with a specific number:

```bash
phantom-fleet stop N
```

Remove all applications:

```bash
phantom-fleet removeAll
```

Remove an application with a specific number:

```bash
phantom-fleet remove N
```

### Starting Applications from Configuration

To start applications defined in a configuration file, run the following command:

```bash
phantom-fleet start apps.json
```

## Collaboration

As mentioned earlier, this package is open to collaboration and improvements. If you encounter any issues or have
suggestions for optimizing Docker processes and resource savings, feel free to contribute to the project.

Let's work together to make Phantom Fleet even better!

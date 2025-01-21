module.exports = {
    services: {
        puml: {
            baseDir: './puml',
            interface: {
                "/puml": { path: '/puml', port: 3000, protocol:"http"},
            },
            deployments: {
                container: {
                    image: 'madajaju/ailtire-puml:latest',
                    volumes: {
                    },
                    environment: {
                    },
                },
                external: {
                    baseDir: './puml',
                    command: 'npm start',
                    url: 'http://localhost:3000',
                }
            },
            policies: {
                accessControl: {
                    authentication: {},
                    rateLimit: {}
                },
                retry: {
                    maxRetries: 5,
                    backoffStrategy: 'exponential',
                },
                scaling: {
                    min: 0,
                    max: 5,
                },
                timeout: {
                    requestTimeout: 5000
                },
                logging: {
                    level: 'info',
                },
                security: {
                }
            },
            environment: {
            },
        },
    },
    policies: {

    },
    interface: {
        ports: {
            3000: 3000,
        }
    },
    data: {

    },
    networks: {

    }
}

---
layout: default
title: Deployment
permalink: deployment
has_children: false
---

# Deployment

The deployment strategy for the application is defined in the deploy directory in the applications api directory and all
of the package directories. The Ailtire Framework uses docker-compose file format to describe the design of the
deployment of the application. The actual deployment of the application can use k8s or docker swarm depending on your
configuration. Currently, The default engine to deploy and manage the application is docker swarm. Additional frameworks
and tools will be supported in the future.

## Directory layout

The application directory has a deployment strategy "./api/deploy" and each package has a deploy directory in its root
base dir. The following is the layout of the deploy structure.

```shell
deploy
   mservice1 - Microservice definition for mservice1
     Dockerfile - image definition for the microservice
     package.json - package file for the nodejs application
     server.js - entry point for the nodejs application implementing the microservice.
   mservice2 - Microservice definition for mservice1
     ...
   mservice3 - Microservice definition for mservice1
     ...
   build.js - Build script for containers
   deploy.js - Deployment defintion of the stack defined in the docker-compose.yaml file.
   docker-compose.yaml - Definition of the stack of micro-services, networks, and storage.
```

### docker-compose.yaml

The docker-compose file format is used for the description of the stack for package. This includes sub packages as well.
The docker-compose file uses a common set of conventions to define the stack's substacks, services, and networks. In the
following example the applications deploy stack definition has 2 microservices and one substack.

* Application: myapp
* Top Package: MyPackage
* Micro Services: mservice1 mservice2

```yaml
version: "3.7"
services:
  mypackage:
    image: myapp-mypackage:latest
    stop_grace_period: 1m
    stop_signal: SIGINT
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 1
      labels:
        - traefik.tags=${AILTIRE_APPNAME}_myapp_family
        - traefik.enable=true
        - traefik.docker.network=${AILTIRE_APPNAME}_myapp_family
        - traefik.http.services.mypackage.loadbalancer.server.port=3000
        - traefik.http.routers.mypackage_http.rule=PathPrefix(`/mypackage`)
        - traefik.http.routers.mypackage_http.service=mypackage
        - traefik.http.routers.mypackage_http.entrypoints=http
    environment:
      - AILTIRE_STACKNAME={{.Service.Name}}-{{.Task.Slot}}
      - AILTIRE_PARENT=${AILTIRE_STACKNAME}
      - AILTIRE_PARENTHOST=${AILTIRE_PARENTHOST}
      - AILTIRE_APPNAME=${AILTIRE_APPNAME}
      - AILTIRE_PARENT_NETWORK=${AILTIRE_APPNAME}_myapp_family
      - EDGEMERE_ADMIN_URL=portal:3000
    networks:
      - children
  mservice:
    image: myapp-mservice1:latest
    stop_grace_period: 1m
    stop_signal: SIGINT
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 1
      labels:
        - traefik.tags=${AILTIRE_APPNAME}_myapp_family
        - traefik.enable=true
        - traefik.docker.network=${AILTIRE_APPNAME}_myapp_family
        - traefik.http.services.mservice1.loadbalancer.server.port=3000
        - traefik.http.routers.mservice1_http.rule=PathPrefix(`/mservice1`)
        - traefik.http.routers.mservice1_http.service=mservice1
        - traefik.http.routers.mservice1_http.entrypoints=http
    environment:
      - AILTIRE_STACKNAME={{.Service.Name}}-{{.Task.Slot}}
      - AILTIRE_PARENT=${AILTIRE_STACKNAME}
      - AILTIRE_PARENTHOST=${AILTIRE_PARENTHOST}
      - AILTIRE_APPNAME=${AILTIRE_APPNAME}
      - AILTIRE_PARENT_NETWORK=${AILTIRE_APPNAME}_myapp_family
      - EDGEMERE_ADMIN_URL=portal:3000
    networks:
      - children
  mservice2:
    image: myapp-mservice2:latest
    stop_grace_period: 1m
    stop_signal: SIGINT
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 1
      labels:
        - traefik.tags=${AILTIRE_APPNAME}_myapp_family
        - traefik.enable=true
        - traefik.docker.network=${AILTIRE_APPNAME}_myapp_family
        - traefik.http.services.mservice2.loadbalancer.server.port=3000
        - traefik.http.routers.mservice2_http.rule=PathPrefix(`/mservice2`)
        - traefik.http.routers.mservice2_http.service=mservice1
        - traefik.http.routers.mservice2_http.entrypoints=http
    environment:
      - AILTIRE_STACKNAME={{.Service.Name}}-{{.Task.Slot}}
      - AILTIRE_PARENT=${AILTIRE_STACKNAME}
      - AILTIRE_PARENTHOST=${AILTIRE_PARENTHOST}
      - AILTIRE_APPNAME=${AILTIRE_APPNAME}
      - AILTIRE_PARENT_NETWORK=${AILTIRE_APPNAME}_myapp_family
    networks:
      - children
networks:
  children:
    driver: overlay
    attachable: true
    name: ${AILTIRE_APPNAME}_myapp_family
  sibling:
    driver: overlay
```

In this file you can see there are two major sections. services and networks. This is the base for the stack. Any
additional docker-compose attributes can be added see
[Docker-compose file format](https://docs.docker.com/compose/compose-file/) for more information.

### MircoService definition

Each microservice has the name of the microservice and the image name is the fully qualified name of the microservice
from the build of the application see [ailtire app build](cli-app-build) command for additional information. There is
additional information in the service like environment variables that are used to manage stacks of stacks and services.

#### Environment Variables

The environment variables all start with the prefix AILTIRE_.

* AILTIRE_PARENT - Parent stack name of the currently running stack. If this is the app stack this is will be empty
* AILTIRE_PARENTHOST - The Host that is running the Parent Stack. If this is the app stack this is empty.
* AILTIRE_APPNAME - The name of the application that is running this stack.
* AILTIRE_STACKNAME - The name of the stack currently running.
* AILTIRE_PARENT_NETWORK - The name of the parent network. Used for micro-segmentation meshes.

#### Labels

Labels are used to help define a routing paths for use with a network service meshes and routing name
[traefik](https://traefik.io/). These labels follow the standard
[traefik docker-compose](https://doc.traefik.io/traefik/providers/docker/#docker-swarm-mode) pattern for defining
routing paths for services in a docker stack. The following labels are used for each microservice definition.

```yaml
labels:
  - traefik.tags=${AILTIRE_APPNAME}_myapp_family
  - traefik.enable=true
  - traefik.docker.network=${AILTIRE_APPNAME}_myapp_family
  - traefik.http.services.mservice2.loadbalancer.server.port=3000
  - traefik.http.routers.mservice2_http.rule=PathPrefix(`/mservice2`)
  - traefik.http.routers.mservice2_http.service=mservice2
  - traefik.http.routers.mservice2_http.entrypoints=http
```

Here is a description of each label for the microservice.

* tags - Contains the network to manage. This limits the service discovery to only the microservices in the stack.
* enable - true. Enables service discovery and traffic management for this service.
* docker.network - network to scan for service discovery. Currently a work around for problems with tags.
* http.services.mservice2.loadbalancer.server.port - Contains the port that the service is running on.
* http.routers.mservice2_http.rule - This is the routing rule for the mservice. This means that accessing the service
  REST or web interface can be acchieved through http://localhost/mservice2
* http.routers.mservice2_http.service - Route /mservice2 to this service in docker.
* http.routers.mservice2_http.entrypoints - use the http protocol to access this service.

### Stack Definition (Application and Package)

Using the side-car pattern for containers, stacks are treated like a microservice themselves. In fact a single
container image is created for the whole application that basically can be scheduled as a service in a docker
swarm stack. This allows for systems to be integrated more easily. The same is true for each package and sub package
in the system architecture. Each package has its own deployment strategy which out of the box creates a stack
as defined by a docker-compose.yaml file. A container image with the docker-compose.yaml file and a very lightweight
applcation with a REST interface allows the stack to be deployed, killed and monitored just like another other
container in the system. Behind the covers it is actually managing several services in the docker swarm stack.
This enables complex architectures to be easily deployed in managed that might contain several hundred running containers.

This diagram shows the common services that are used in an application stack as well as the underlying package
stack mypackage.

![deployment](deployment.png)

You can see that we have a frontend service that acts as an api-gateway for access to the services in the stack.
Every call to the stack goes through the api-gateway and routed to appropriate service on the back end. The 
following services are used for an application stack.
* frontend - This uses the traefik service to manage the api-gateway and route http request to the appropriate service.
* doc - This serves up the documentation for the application using jekyll.
* web - This is the entry point for the web interface for the application simulation and rapid prototype.
* pubsub - This is the pubsub bus for websocket communication and event driven interface. Redis is currently used.
* admin - This service allow for the management of package stacks and services in the application stack.

The infrastructure that supports this aggregated service stack can be found in the application stack. The following
is the docker-compose definition of the application stack for myapp.
```yaml
services:
  admin:
    image: myapp:latest
    stop_grace_period: 1m
    stop_signal: SIGINT
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - AILTIRE_STACKNAME=${AILTIRE_APPNAME}
      - AILTIRE_PARENT=${AILTIRE_APPNAME}
      - AILTIRE_APPNAME=${AILTIRE_APPNAME}
    networks:
      children:
        aliases:
          - admin
    deploy:
      labels:
        - traefik.tags=_family
        - traefik.enable=true
        - traefik.docker.network=${AILTIRE_APPNAME}_family
        - traefik.http.services.admin.loadbalancer.server.port=3000
        - traefik.http.routers.admin.rule=PathPrefix(`/admin`)
        - traefik.http.routers.admin.service=admin
        - traefik.http.routers.admin.entrypoints=http
  mypackage:
    image: myapp-mypackage:latest
    stop_grace_period: 1m
    stop_signal: SIGINT
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    deploy:
      replicas: 1
    environment:
      - AILTIRE_STACKNAME={{.Service.Name}}-{{.Task.Slot}}
      - AILTIRE_PARENT=${AILTIRE_APPNAME}
      - AILTIRE_PARENTHOST=admin
      - AILTIRE_APPNAME=${AILTIRE_APPNAME}
    networks:
      - children
  pubsub:
    image: redis
    networks:
      children:
        aliases:
          - redis
      sibling:
        aliases:
          - redis
    deploy:
      labels:
        - traefik.tags=_family
        - traefik.enable=true
        - traefik.docker.network=${AILTIRE_APPNAME}_family
        - traefik.http.services.pubsub.loadbalancer.server.port=80
        - traefik.http.routers.pubsub_http.rule=PathPrefix(`/pubsub`)
        - traefik.http.routers.pubsub_http.service=pubsub
        - traefik.http.routers.pubsub_http.entrypoints=http
  frontend:
    image: traefik:latest
    command:
      - --api=true
      - --api.dashboard=true
      - --api.insecure=true
      - --api.debug=true
      - --log.level=DEBUG
      - --providers.docker=true
      - --providers.docker.swarmMode=true
      - --providers.docker.network=children
      - --providers.docker.exposedbydefault=false
      - --entrypoints.http.address=:80
      - --entrypoints.https.address=:443
      - --providers.docker.constraints=Label(`traefik.tags`,`_family`)
    ports:
      - '80:80'
      - '8080:8080'
      - '443:443'
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    networks:
      - children
networks:
  children:
    driver: overlay
    attachable: true
    name: ${AILTIRE_APPNAME}_family
  sibling:
    driver: overlay
```


#### Environment Variables

The environment variables all start with the prefix AILTIRE_.

* AILTIRE_PARENT - Parent stack name of the currently running stack. If this is the app stack this is will be empty
* AILTIRE_PARENTHOST - The Host that is running the Parent Stack. If this is the app stack this is empty.
* AILTIRE_APPNAME - The name of the application that is running this stack.
* AILTIRE_STACKNAME - The name of the stack currently running.
* AILTIRE_PARENT_NETWORK - The name of the parent network. Used for micro-segmentation meshes.

#### Labels

Labels are used to help define a routing paths for use with a network service meshes and routing name
[traefik](https://traefik.io/). These labels follow the standard
[traefik docker-compose](https://doc.traefik.io/traefik/providers/docker/#docker-swarm-mode) pattern for defining
routing paths for services in a docker stack. The following labels are used for each microservice definition.

```yaml
labels:
  - traefik.tags=${AILTIRE_APPNAME}_myapp_family
  - traefik.enable=true
  - traefik.docker.network=${AILTIRE_APPNAME}_myapp_family
  - traefik.http.services.mypackage.loadbalancer.server.port=3000
  - traefik.http.routers.mypackage_http.rule=PathPrefix(`/mypackage`)
  - traefik.http.routers.mypackage_http.service=mypackage
  - traefik.http.routers.mypackage_http.entrypoints=http
```

Here is a description of each label for the microservice.

* tags - Contains the network to manage. This limits the service discovery to only the microservices in the stack.
* enable - true. Enables service discovery and traffic management for this service.
* docker.network - network to scan for service discovery. Currently a work around for problems with tags.
* http.services.mypackage.loadbalancer.server.port - Contains the port that the service is running on.
* http.routers.mypackage_http.rule - This is the routing rule for the mservice. This means that accessing the service
  REST or web interface can be acchieved through http://localhost/mypackage
* http.routers.mypackage_http.service - Route /mypackage to this service in docker.
* http.routers.mypackage_http.entrypoints - use the http protocol to access this service.


## See Also
* [ailtire app build](cli-app-build)
* [ailtire app install](cli-app-install)
* [ailtire app uninstall](cli-app-uninstall)
* [ailtire app status](cli-app-status)
* [ailtire package build](cli-package-build)
* [ailtire package install](cli-package-install)
* [ailtire package uninstall](cli-package-uninstall)
* [Directory Structure](directory)

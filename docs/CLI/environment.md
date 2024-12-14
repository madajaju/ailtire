---
layout: default
title: ailtire environment
permalink: cli-environment
parent: Command Line Interface
---

# ailtire environment

Manage and retrieve information about environments.

## Synopsis

```shell
ailtire environment <command> [args]
ailtire environment get
ailtire environment list
```

## Description

The `environment` command provides tools to manage and query information about environments within the `ailtire` framework.  
It includes support for retrieving specific environment details and listing all available environments.

## Commands

### `get`
- **Usage**:
  ```shell
  ailtire environment get
  ```
- **Description**:
  Retrieves detailed information about a specific environment.

---

### `list`
- **Usage**:
  ```shell
  ailtire environment list
  ```
- **Description**:
  Lists all environments currently available within the system.

## Examples

### Example 1: Get details of a specific environment
```shell
ailtire environment get
```

### Example 2: List all environments
```shell
ailtire environment list
```

---

## Notes

- The `environment` command is used to manage environments, enabling you to retrieve information or list available environments.
- Use `list` to get an overview of all environments.
- Use `get` to retrieve specific information about an individual environment.

---

See the [Command Line Interface](../Command%20Line%20Interface) for more command documentation.
---
layout: default
title: ailtire deployment
permalink: cli-deployment
parent: Command Line Interface
---

# ailtire deployment

Manage and retrieve information about deployments, including both logical and physical deployments.

## Synopsis

```shell
ailtire deployment <command> [args]
ailtire deployment get
ailtire deployment list
ailtire deployment physical
```

## Description

The `deployment` command provides tools to query and list deployments within the `ailtire` framework.  
It includes support for retrieving specific information about deployments, listing logical deployments, and listing physical deployment information.

## Commands

### `get`
- **Usage**:
  ```shell
  ailtire deployment get
  ```
- **Description**:
  Retrieves information about an individual deployment.

---

### `list`
- **Usage**:
  ```shell
  ailtire deployment list
  ```
- **Description**:
  Lists all logical deployments within the system.

---

### `physical`
- **Usage**:
  ```shell
  ailtire deployment physical
  ```
- **Description**:
  Lists all the physical deployments in the current context. This provides detailed information about the physical deployment instances.

## Examples

### Example 1: Get a specific deployment
```shell
ailtire deployment get
```

### Example 2: List all logical deployments
```shell
ailtire deployment list
```

### Example 3: List all physical deployments
```shell
ailtire deployment physical
```

---

## Notes

- The `deployment` command is primarily focused on querying deployment information both at a logical (definition) and physical (instance) level.
- Use `list` to get an overview of all logical deployments.
- Use `physical` to query all physical deployment instances currently available.

---

See the [Command Line Interface](commandline) for more command documentation.
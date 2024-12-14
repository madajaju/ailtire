---
layout: default
title: ailtire device
permalink: cli-device
parent: Command Line Interface
---

# ailtire device

Manage and retrieve information about devices.

## Synopsis

```shell
ailtire device <command> [args]
ailtire device get
ailtire device list
```

## Description

The `device` command provides tools to manage and query information about devices within the `ailtire` framework.  
It includes support for retrieving specific device information and listing all devices.

## Commands

### `get`
- **Usage**:
  ```shell
  ailtire device get
  ```
- **Description**:
  Retrieves detailed information about an individual device.

---

### `list`
- **Usage**:
  ```shell
  ailtire device list
  ```
- **Description**:
  Lists all devices currently available in the system.

## Examples

### Example 1: Get a specific device
```shell
ailtire device get
```

### Example 2: List all devices
```shell
ailtire device list
```

---

## Notes

- The `device` command is focused on querying and listing device-related data.
- Use `list` to fetch a complete overview of all devices.
- Use `get` to retrieve detailed information about an individual device.

---

See the [Command Line Interface](../Command%20Line%20Interface) for more command documentation.
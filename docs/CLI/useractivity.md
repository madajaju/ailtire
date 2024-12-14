---
layout: default
title: ailtire useractivity
permalink: cli-useractivity
parent: Command Line Interface
---

# ailtire useractivity

Manage and interact with user activities, including retrieving and updating their status.

## Synopsis

```shell
ailtire useractivity <command> [args]
ailtire useractivity complete --id <string>
ailtire useractivity get --id <string>
ailtire useractivity list
```

## Description

The `useractivity` command provides tools to work with user activities within the system.  
It allows you to retrieve, update, and list user activities.

## Commands

### `complete`
- **Usage**:
  ```shell
  ailtire useractivity complete --id <string>
  ```
- **Description**:
  Marks a specified user activity as complete based on its ID.

---

### `get`
- **Usage**:
  ```shell
  ailtire useractivity get --id <string>
  ```
- **Description**:
  Retrieves detailed information about a specific user activity using its ID.

---

### `list`
- **Usage**:
  ```shell
  ailtire useractivity list
  ```
- **Description**:
  Lists all user activities currently stored in the system.

## Examples

### Example 1: Complete a user activity
```shell
ailtire useractivity complete --id "activity123"
```

### Example 2: Get details for a specific user activity
```shell
ailtire useractivity get --id "activity123"
```

### Example 3: List all user activities
```shell
ailtire useractivity list
```

---

## Notes

- Use the `complete` command to mark user activities as finished based on their unique identifiers.
- The `get` command provides a detailed view of a specific user activity.
- The `list` command offers an overview of all activities stored or tracked in the system.

---

See the [Command Line Interface](../Command%20Line%20Interface) for more command documentation.
---
layout: default
title: ailtire note
permalink: cli-note
parent: Command Line Interface
---

# ailtire note

Manage notes and items associated with the architecture, including operations like creation, updates, and accepting/rejecting items for artifact generation.

## Synopsis

```shell
ailtire note <command> [args]
ailtire note acceptItems --note <string> --items <string>
ailtire note generate --prompt <string>
ailtire note get --id <string>
ailtire note list --json <undefined>
ailtire note rejectItems --note <string> --items <string>
ailtire note update --id <string>
```

## Description

The `note` command provides tools to manage notes and related operations for artifact generation in the architecture. Users can create, update, retrieve, and list notes. Additionally, it supports accepting or rejecting items for artifact generation as part of the architectural design process.

## Commands

### `acceptItems`
- **Usage**:
  ```shell
  ailtire note acceptItems --note <string> --items <string>
  ```
- **Description**:
  Accepts specific items associated with a note for artifact generation within the architecture.

---

### `generate`
- **Usage**:
  ```shell
  ailtire note generate --prompt <string>
  ```
- **Description**:
  Generates items in the architecture based on the provided prompt.

---

### `get`
- **Usage**:
  ```shell
  ailtire note get --id <string>
  ```
- **Description**:
  Retrieves detailed information about a specific note using its ID.

---

### `list`
- **Usage**:
  ```shell
  ailtire note list --json <undefined>
  ```
- **Description**:
  Lists all notes in the system, optionally outputting the result in JSON format.

---

### `rejectItems`
- **Usage**:
  ```shell
  ailtire note rejectItems --note <string> --items <string>
  ```
- **Description**:
  Rejects specific items associated with a note, preventing their usage in artifact generation within the architecture.

---

### `update`
- **Usage**:
  ```shell
  ailtire note update --id <string>
  ```
- **Description**:
  Updates the information of a specific note using its ID.

## Examples

### Example 1: Accept items for a note
```shell
ailtire note acceptItems --note "note123" --items "item1,item2,item3"
```

### Example 2: Generate architectural items
```shell
ailtire note generate --prompt "Create architecture components for the design"
```

### Example 3: Get a specific note by ID
```shell
ailtire note get --id "note123"
```

### Example 4: List all notes in JSON format
```shell
ailtire note list --json
```

### Example 5: Reject items for a note
```shell
ailtire note rejectItems --note "note123" --items "item4,item5"
```

### Example 6: Update a note
```shell
ailtire note update --id "note123"
```

---

## Notes

- The `acceptItems` and `rejectItems` commands allow for fine-grained control over artifact generation by managing associated items.
- Use the `generate` command to dynamically generate new architecture items with a specified prompt.
- The `list` command outputs all notes and supports JSON formatting for easier integration with other tools.
- Ensure accurate IDs are provided when using the `get` and `update` commands for notes.

---

See the [Command Line Interface](../Command%20Line%20Interface) for more command documentation.
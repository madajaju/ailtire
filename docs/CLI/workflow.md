---
layout: default
title: ailtire workflow
permalink: cli-workflow
parent: Command Line Interface
---

# ailtire workflow

Manage workflows, including their creation, retrieval, launching, and visualization.

## Synopsis

```shell
ailtire workflow <command> [args]
ailtire workflow create --name <string> --package <string>
ailtire workflow generate --id <string> --target <string>
ailtire workflow get --id <string>
ailtire workflow instance --id <string>
ailtire workflow instances
ailtire workflow launch --id <string>
ailtire workflow list
ailtire workflow uml --id <string>
ailtire workflow update --id <string>
```

## Description

The `workflow` command provides tools to create, manage, and retrieve workflows and their associated instances. It supports generating outputs, visualizing workflows, and launching workflows in the context of specific use cases.

## Commands

### `create`
- **Usage**:
  ```shell
  ailtire workflow create --name <string> --package <string>
  ```
- **Description**:
  Creates a new workflow with the specified name and package.

---

### `generate`
- **Usage**:
  ```shell
  ailtire workflow generate --id <string> --target <string>
  ```
- **Description**:
  Generates a specified target output for the workflow associated with the provided ID.

---

### `get`
- **Usage**:
  ```shell
  ailtire workflow get --id <string>
  ```
- **Description**:
  Retrieves detailed information about a specific workflow using its ID.

---

### `instance`
- **Usage**:
  ```shell
  ailtire workflow instance --id <string>
  ```
- **Description**:
  Returns a single workflow instance based on the specified workflow ID.

---

### `instances`
- **Usage**:
  ```shell
  ailtire workflow instances
  ```
- **Description**:
  Returns all workflow instances available in the system.

---

### `launch`
- **Usage**:
  ```shell
  ailtire workflow launch --id <string>
  ```
- **Description**:
  Launches a workflow within a specific use case using the specified workflow ID.

---

### `list`
- **Usage**:
  ```shell
  ailtire workflow list
  ```
- **Description**:
  Lists all workflows present in the system.

---

### `uml`
- **Usage**:
  ```shell
  ailtire workflow uml --id <string>
  ```
- **Description**:
  Generates a PlantUML diagram representation of the workflow associated with the specified ID.

---

### `update`
- **Usage**:
  ```shell
  ailtire workflow update --id <string>
  ```
- **Description**:
  Updates the details of a specific workflow using its ID.

## Examples

### Example 1: Create a workflow
```shell
ailtire workflow create --name "MyWorkflow" --package "com.example"
```

### Example 2: Generate target output for a workflow
```shell
ailtire workflow generate --id "workflow123" --target "artifact"
```

### Example 3: Get details of a workflow
```shell
ailtire workflow get --id "workflow123"
```

### Example 4: Retrieve a specific workflow instance
```shell
ailtire workflow instance --id "workflow123"
```

### Example 5: Get all workflow instances
```shell
ailtire workflow instances
```

### Example 6: Launch a workflow for a use case
```shell
ailtire workflow launch --id "workflow123"
```

### Example 7: List all workflows
```shell
ailtire workflow list
```

### Example 8: Generate a UML diagram for a workflow
```shell
ailtire workflow uml --id "workflow123"
```

### Example 9: Update a workflow
```shell
ailtire workflow update --id "workflow123"
```

---

## Notes

- Use the `create` command to define a new workflow with a meaningful name and package location.
- The `launch` command executes workflows within specified use cases, which is useful for dynamic or on-demand processes.
- The `instances` and `instance` commands are invaluable for managing workflow execution records.
- The `uml` command provides a PlantUML diagram, useful for visualization or documentation purposes.
- Always ensure proper IDs are passed for commands like `generate`, `get`, `update`, `launch`, and `uml`.

---

See the [Command Line Interface](../Command%20Line%20Interface) for more command documentation.
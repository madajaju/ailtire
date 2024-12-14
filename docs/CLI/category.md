---
layout: default
title: ailtire category
permalink: cli-category
parent: Command Line Interface
---

# ailtire category

Manage ailtire categories and workflows. This includes generating, retrieving, listing, and updating categories or workflows.

## Synopsis

```shell
ailtire category <command> [args]
ailtire category generate --id "categoryId" --target "targetName"
ailtire category get --id "categoryId"
ailtire category list
ailtire category uml --id "workflowId"
ailtire category update --id "workflowId"
```

## Description

The `category` command provides capabilities to categorize workflows and categories within the `ailtire` framework.  
It supports generating new categories, retrieving details, listing workflows, creating UML diagrams, and updating categories.  
This command is versatile for managing the logical structuring of workflows and categories.

## Commands

### `generate`
- **Usage**:
  ```shell
  ailtire category generate --id <string> --target <string>
  ```
- **Description**:
  Generates a new category with the provided `id` and `target`. The `target` specifies the output location or association.

---

### `get`
- **Usage**:
  ```shell
  ailtire category get --id <string>
  ```
- **Description**:
  Fetches and retrieves details of a category specified by the `id`.

---

### `list`
- **Usage**:
  ```shell
  ailtire category list
  ```
- **Description**:
  Lists all the workflows present in the current context. Useful for getting an overview of available workflows.

---

### `uml`
- **Usage**:
  ```shell
  ailtire category uml --id <string>
  ```
- **Description**:
  Generates a PlantUML diagram for the workflow identified by the `id`. This diagram helps visualize the workflows in a category.

---

### `update`
- **Usage**:
  ```shell
  ailtire category update --id <string>
  ```
- **Description**:
  Updates a category identified by the `id`. The update modifies the existing category based on the provided input values.

## Examples

### Example 1: Generate a category
```shell
ailtire category generate --id "my-category-id" --target "target-name"
```

### Example 2: Get a specific category
```shell
ailtire category get --id "my-category-id"
```

### Example 3: List all workflows
```shell
ailtire category list
```

### Example 4: Create a UML diagram for a category
```shell
ailtire category uml --id "workflow-id"
```

### Example 5: Update a category
```shell
ailtire category update --id "workflow-id"
```

## Notes

- The `category` command is primarily focused on managing workflows and categories for logical structuring and visualization.
- The `uml` subcommand requires PlantUML integration for generating diagrams.

---

See the [Command Line Interface](../commandline) for more command documentation.
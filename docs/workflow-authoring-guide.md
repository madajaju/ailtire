# Ailtire workflow authoring guide

Use this guide when writing a workflow definition for people or AI. A workflow is a versioned JavaScript object. Its activities describe work, dependencies describe completion ordering, triggers describe event or condition readiness, and handlers connect external events to actions.

The complete example is [ComprehensiveWorkflow.js](examples/ComprehensiveWorkflow.js).

## Definition checklist

Every workflow should have:

- `name`, `version`, and a useful `description`.
- Explicit `inputs` and `outputs`, with `type`, `required`, and `description` where applicable.
- Activities with stable names, a `type`, an implementation `ref`, and declared `inputs`, `outputs`, and `emits`.
- `dependencies` when an activity must wait for named activities to complete.
- `triggers` when an activity should react to an event. Use `mode: 'and'` when every listed event is required.
- `handlers` when external events should start an activity action.
- `lifecycle` for persistent watchers, retry/timeout policy, or a clear stop condition.

## Rules for dependencies and events

Use a dependency for workflow completion ordering. For example, `publish` depends on `validate`, even if both activities also react to events. Use a trigger for event matching. A dependency does not replace an event trigger, and an event trigger does not guarantee that a prior step completed.

Use input references consistently:

```js
inputs: {
    directory: '$inputs.directory',
    source: '$event.source',
    analyzedTitle: '$steps.analyze.outputs.title',
    sharedValue: '$context.sharedValue'
}
```

Keep event payloads small and explicit. Every emitted event should document its payload in `eventTypes` when the workflow is event driven.

## Conditional execution

Use `guard` or `condition` on an event trigger for a payload-level condition:

```js
triggers: [{
    events: ['asset.created'],
    guard: "payload.kind === 'lecture' && payload.durationSeconds > 60"
}]
```

Use an activity policy with `triggerMode: 'condition'` when the condition belongs to the activity policy and receives the activity instance, trigger state, and event. Use `lifecycle.stopWhen` for stopping a long-running activity or watcher. A conditional path usually means two activities listen for the same event with mutually exclusive guards.

## Human activities

Use `type: 'human'` and provide a clear `humanRequest.prompt`. State what the person must do and what event or confirmation completes the activity. Keep the next machine activity dependent on the human activity or its completion event.

## Writing guidance for AI

Before generating code, ask for the workflow goal, required inputs, final outputs, external events, human decisions, retry behavior, and stop conditions. Then produce a step table with one row per activity. Give every row a stable name, one implementation reference, dependencies, inputs, outputs, and emitted events. Check that every dependency names an existing activity, every `$steps.name...` reference points to a real step, every handler action points to a real action, and every event name is spelled consistently.

Avoid hidden ordering, implicit global state, duplicate handlers, unbounded persistent activities, and guards that mix unrelated business rules. Prefer explicit dependencies, small event payloads, idempotent activities, and descriptions that explain the business result.

---
name: embed-javascript-events-api
description: This skill enables agents to assist users in implementing and troubleshooting interactive communication between a host application and an embedded Looker iframe using JavaScript events.
---

# Looker Embed JavaScript Events

This skill enables agents to assist users in implementing and troubleshooting interactive communication between a host application and an embedded Looker iframe using JavaScript events.

## Overview
Looker embedding uses the HTML5 `postMessage` API to pass messages between the host page and the Looker iframe. This allows for:
- **Event Monitoring**: Detecting when a dashboard starts/finishes running, when filters change, or when a user navigates.
- **Bi-directional Control**: Sending commands (actions) from the host app into Looker to trigger runs, update filters, or change layouts.

## 1. Listening for Events
The host application must listen for `message` events on the `window` object.

### Implementation Pattern
```javascript
window.addEventListener("message", function (event) {
  // 1. ALWAYS verify the origin for security
  if (event.origin !== "https://your_company.looker.com") return;

  // 2. Verify the source is the Looker iframe
  const lookerIframe = document.getElementById("looker-embed");
  if (event.source !== lookerIframe.contentWindow) return;

  // 3. Parse and handle the event
  const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
  console.log("Looker Event:", data.type, data);
});
```

## 2. Event Type Reference

### Dashboard Events
- **`dashboard:loaded`**: Fired when the dashboard metadata is loaded (before queries run).
- **`dashboard:run:start`**: Fired when tiles begin querying for data.
- **`dashboard:run:complete`**: Fired when all tiles have finished loading. Includes `dashboard.options` (layout/elements).
- **`dashboard:filters:update`**: Fired when a user changes filters within the dashboard.
- **`dashboard:tile:view`**: Fired when a user clicks "View Original Look" on a tile. Cancellable.
- **`dashboard:tile:merge`**: Fired when a user clicks "Edit Merged Query". Cancellable.

### Look & Explore Events
- **`look:ready`**: Fired when a Look begins to load.
- **`look:run:start` / `look:run:complete`**: Lifecycle of a Look query.
- **`explore:run:start` / `explore:run:complete`**: Lifecycle of an Explore query.
- **`explore:state:changed`**: Fired when the Explore URL/state changes (e.g., field selection).

### Page & System Events
- **`page:changed`**: Fired when navigating between content types (e.g., from Dashboard to Look).
- **`page:properties:changed`**: Fired when the iframe height changes (Dashboards only).
- **`session:expired`**: Fired when the user's session ends.
- **`env:client:dialog`**: Fired when a Looker dialog (like a drill) is opened.

## 3. Sending Actions to Looker
Actions are sent from the host app to Looker using `postMessage`.

### Implementation Pattern
```javascript
const sendLookerAction = (action) => {
  const iframe = document.getElementById("looker-embed");
  iframe.contentWindow.postMessage(JSON.stringify(action), "https://your_company.looker.com");
};

// Example: Triggering a dashboard run
sendLookerAction({ type: "dashboard:run" });

// Example: Updating filters
sendLookerAction({
  type: "dashboard:filters:update",
  filters: { "State": "California", "Date": "Last 7 Days" }
});
```

### Common Actions
- **`dashboard:run` / `look:run` / `explore:run`**: Force a refresh of the content.
- **`dashboard:load`**: Load a different dashboard ID in the same iframe.
- **`dashboard:options:set`**: Programmatically change tile visibility or layout.
- **`env:host:scroll`**: Pass the host's scroll position to Looker for proper dialog positioning.

## 4. Using the Embed SDK (Recommended)
While manual `postMessage` handling works, the **Looker Embed SDK** abstracts this complexity and provides a more idiomatic interface.

### Initializing a Connection
```javascript
import { LookerEmbedSDK } from '@looker/embed-sdk';

LookerEmbedSDK.createDashboardWithId(123)
  .appendTo('#container')
  .on('dashboard:run:complete', (e) => console.log('Finished!', e))
  .build()
  .connect()
  .then((dashboard) => {
    // 'dashboard' implements ILookerConnection
    // Trigger a run
    dashboard.send('dashboard:run');
  })
  .catch(console.error);
```

### Sending Actions via `ILookerConnection.send`
The `send` method is a low-level way to trigger actions within the Looker iframe. It is available on all connection types (Dashboards, Explores, Looks).

- **Signature**: `send(message: string, params?: any): void`
- **When to use**: Use `send` to dispatch any supported message to the Looker host when a high-level helper method isn't available.

```javascript
// Example: Updating filters
dashboard.send('dashboard:filters:update', {
  filters: { 'State': 'California' }
});

// Example: Force a run
dashboard.send('dashboard:run');
```

### Receiving Data via `sendAndReceive`
If you need a response back from the embedded content, use `sendAndReceive`.

- **Signature**: `sendAndReceive(message: string, params?: any): Promise<any>`

```javascript
dashboard.sendAndReceive('dashboard:options')
  .then((options) => console.log('Dashboard Options:', options));
```

## 5. Troubleshooting & Best Practices
- **Origin Security**: Always check `event.origin` to prevent Cross-Site Scripting (XSS).
- **JSON Parsing**: Older Looker versions might send stringified JSON, while newer ones might send objects. Use a robust parser.
- **Cancellable Events**: Events like `dashboard:tile:view` can be cancelled by returning `{ cancel: true }` in some SDK implementations to override default behavior.
- **Race Conditions**: Ensure the iframe has sent `page:changed` or a similar "ready" event before sending the first action.

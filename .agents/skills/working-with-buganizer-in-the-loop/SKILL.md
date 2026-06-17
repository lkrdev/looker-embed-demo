---
name: working-with-buganizer-in-the-loop
description: Strict workflow and interactive loop guidelines for searching, diagnosing, implementing, and closing Buganizer subtasks in partnership with the user.
---

# Working with Buganizer in the Loop

This skill enforces a collaborative, in-the-loop workflow whenever the developer is tasked with resolving a batch of Buganizer issues or subtasks. It prioritizes communication, explicit approvals, and preventing premature actions.

---

## The Workflow Loop

Follow these steps sequentially for every batch of Buganizer issues:

### 1. Fetch and Filter
* **Search**: Retrieve all subtasks under the requested parent bug ID or search query using `get_bugs` (set `maxResults` to a high number, e.g. 50, to avoid missing items).
* **Filter**: Extract the subtasks matching:
  * **Assignee**: Scoped to the user (e.g., `me`).
  * **Priority**: High priority (e.g., `P0` and `P1`).
  * **Status**: Open / assigned (exclude already resolved/fixed tasks).
* **List**: Present the filtered list of tasks to the user, identifying them by ID and title.

### 2. Announce the Active Task
* **Rule**: **NEVER** start researching or editing files silently.
* **Action**: Clearly announce which task/bug ID you are starting work on next.
* **Render**: Call `render_issue` on the Buganizer ID to read the full description and comments. Do not make assumptions about the requirements without reading the actual issue.

### 3. Implement & Validate
* **Surgical Edits**: Make the minimal correct code changes required to solve the specific bug.
* **Test**: Proactively run unit tests (e.g., `pnpm test`) to ensure no regressions were introduced.

### 4. Interactive Acceptance (CRITICAL)
* **Show Diff**: Present the changes (in git diff format) to the user.
* **Rule**: **DO NOT** mark the bug as fixed, commit, or push until the user explicitly accepts the implementation.
* **Ask**: Explicitly ask the user for approval to commit, push, and close the bug.

### 5. Push & Close
* Once approved by the user:
  1. Stage the changes.
  2. Write a clear, descriptive commit message.
  3. Commit and push the branch.
  4. Call the `update_issue_status` tool to mark the issue as `FIXED`.
  5. State that it is closed and announce the next task on the list.

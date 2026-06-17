---
name: meep-testing-generation
description: Standards, workflows, and helper scripts for generating unit tests and mock data to test the Multi-Explore Experience Pattern (MEEP) in multiExploreUtils.ts.
---

# Instructions

## 1. Overview

This skill tracks the iterative generation and maintenance of test cases and mock data for the Multi-Explore Experience Pattern (MEEP). 

As we iterate on MEEP functionality (such as field layering, group relabeling, timeline linking, and exclusions), we follow a recurring workflow to update our mock Explores and write automated Jest unit tests.

### Core Testing Files
1.  **LookML Model**: [meep_test.model.lkml](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/lookml/models/meep_test.model.lkml) - Contains the raw LookML Explore definitions used for testing.
2.  **Implementation**: [multiExploreUtils.ts](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/frontend/src/utils/multiExploreUtils.ts) - The core frontend logic that processes Explores, dimensions, and measures.
3.  **Test Suite**: [multiExploreUtils.test.ts](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/frontend/src/utils/multiExploreUtils.test.ts) - The Jest unit test suite covering MEEP features.
4.  **Mock Data**: [mockExplores.ts](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/frontend/src/utils/mockExplores.ts) - The generated TypeScript array of `ILookmlModelExplore` objects.

## 2. Workflow: Regenerating Mock Explores

Whenever changes are made to `meep_test.model.lkml` or underlying LookML views, we must regenerate the mock Explores in `mockExplores.ts`.

### Script Reference
We maintain MCP executable Python scripts in the `./scripts` folder. Each script contains exactly one code block designed to be run via the `@mcp:lkr_dev_cli_codemode:run_python_code` tool.

*   **Script**: [fetch_meep_test_explores.md](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/.agents/skills/meep-testing-generation/scripts/fetch_meep_test_explores.md) - Refreshes mock explores.
*   **Script**: [test_json_bi.md](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/.agents/skills/meep-testing-generation/scripts/test_json_bi.md) - Runs sample Looker queries with the `json_bi` output format to inspect row and pivot metadata.

### Execution Steps
To refresh the mock Explores:
1.  Open [fetch_meep_test_explores.md](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/.agents/skills/meep-testing-generation/scripts/fetch_meep_test_explores.md) and extract the Python code block.
2.  Run the code via `call_mcp_tool` using the `lkr_dev_cli_codemode` server and `run_python_code` tool.
3.  Copy the returned TypeScript code directly into [mockExplores.ts](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/frontend/src/utils/mockExplores.ts).

To test query execution and check `json_bi` formats:
1.  Open [test_json_bi.md](file:///usr/local/google/home/bryanweber/lkrdev/looker-embed-demo/.agents/skills/meep-testing-generation/scripts/test_json_bi.md) and extract the Python code block.
2.  Run the code via `call_mcp_tool` with the `lkr_dev_cli_codemode` server and `run_python_code` tool.

## 3. Test Case Strategy

We will build unit tests in `multiExploreUtils.test.ts` and `meepQueryBuilder.test.ts`. Specifically, for client-side queries merging (full outer joining on timelines/dimensions/pivots), we mock standard Looker `json_bi` response objects and assert that `mergeMeepResults` correctly joins them on overlapping keys.


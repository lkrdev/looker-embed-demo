import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path
from typing import Optional

REGISTRY_FILE = Path(__file__).parent / "modules_registry.json"
REPO_ROOT = Path(__file__).parent.parent
MODULES_DIR = REPO_ROOT / ".modules"
ENV_FILE = REPO_ROOT / ".env"


def load_registry():
    if not REGISTRY_FILE.exists():
        print(f"Error: Registry file not found at {REGISTRY_FILE}", file=sys.stderr)
        sys.exit(1)
    with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def update_env_file(env_path: Path, new_vars: dict):
    """Updates or appends key-value pairs in the .env file."""
    lines = []
    existing_keys = set()

    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped and not stripped.startswith("#") and "=" in stripped:
                    key = stripped.split("=", 1)[0].strip()
                    if key in new_vars:
                        lines.append(f"{key}={new_vars[key]}\n")
                        existing_keys.add(key)
                        continue
                lines.append(line)

    for key, val in new_vars.items():
        if key not in existing_keys and val is not None:
            lines.append(f"{key}={val}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"\nSuccessfully updated {env_path} with optional module configuration:")
    for key, val in new_vars.items():
        if val is not None:
            print(f"  {key}={val}")


def prompt_choice(question: str, valid_choices: list, default: Optional[str] = None) -> str:
    prompt_str = f"{question} [{'/'.join(valid_choices)}]"
    if default:
        prompt_str += f" (default: {default})"
    prompt_str += ": "
    while True:
        choice = input(prompt_str).strip()
        if not choice and default:
            return default
        if choice in valid_choices:
            return choice
        print(f"Invalid input. Please enter one of: {', '.join(valid_choices)}")


def prompt_input(question: str, default: Optional[str] = None, required: bool = True) -> str:

    prompt_str = question
    if default:
        prompt_str += f" [default: {default}]"
    prompt_str += ": "
    while True:
        val = input(prompt_str).strip()
        if not val and default:
            return default
        if val or not required:
            return val
        print("This value is required.")


def run_install(module_id: str):
    registry = load_registry()
    if module_id not in registry:
        print(f"Error: Module '{module_id}' not found in registry.", file=sys.stderr)
        sys.exit(1)

    mod = registry[module_id]
    print(f"\n=== Installing Optional Module: {mod['name']} ===")
    print(mod["description"])
    print("-" * 50)

    confirm = prompt_choice("Would you like to enable and install this module?", ["y", "n"], default="y")
    if confirm == "n":
        print("Installation aborted.")
        sys.exit(0)

    # 1. Select Agent Types
    print("\nAvailable Agent Types:")
    agent_types_meta = mod["agent_types"]
    types_list = list(agent_types_meta.keys())
    for idx, key in enumerate(types_list, 1):
        print(f"  [{idx}] {agent_types_meta[key]['name']}")
    print(f"  [{len(types_list) + 1}] All of the above")

    selection = prompt_input(
        f"Select agent type(s) to configure (comma-separated numbers 1-{len(types_list)+1})",
        default="4"
    )
    selected_keys = []
    for s in selection.split(","):
        s = s.strip()
        if s == str(len(types_list) + 1):
            selected_keys = types_list.copy()
            break
        elif s.isdigit() and 1 <= int(s) <= len(types_list):
            key = types_list[int(s) - 1]
            if key not in selected_keys:
                selected_keys.append(key)

    if not selected_keys:
        print("No valid agent types selected. Aborting.")
        sys.exit(1)

    print("\nSelected agent types to configure:", ", ".join(selected_keys))

    # 2. GCP Configuration
    gcp_project = os.getenv("GCP_PROJECT_ID") or prompt_input("Enter GCP_PROJECT_ID", default="my-gcp-project")
    gcp_region = os.getenv("GCP_REGION") or prompt_input("Enter GCP_REGION", default="us-central1")

    # 3. BYOA vs Deploy New
    print("\nInstallation Mode:")
    print("  [1] BYOA (Use existing deployed Agent IDs)")
    print("  [2] Deploy New (Automated git clone and run root ./deploy.sh)")
    mode = prompt_choice("Select installation mode", ["1", "2"], default="1")

    new_env_vars = {
        "ENABLE_MODULE_ADK_AGENT": "true",
        "GCP_PROJECT_ID": gcp_project,
        "GCP_REGION": gcp_region,
    }

    if mode == "1":
        # BYOA
        print("\n--- BYOA Mode: Enter Existing Agent IDs ---")
        for key in selected_keys:
            meta = agent_types_meta[key]
            env_var_name = meta["env_var"]
            val = prompt_input(f"Enter ID for {meta['name']} ({env_var_name})", required=True)
            new_env_vars[env_var_name] = val
    else:
        # Deploy New
        print("\n--- Automated Remote Deployment Mode ---")
        target_branch = prompt_input("Enter target Git branch to clone", default=mod.get("default_branch", "main"))
        repo_url = mod["repository_url"]
        clone_dir = MODULES_DIR / module_id

        if clone_dir.exists():
            print(f"Removing existing clone at {clone_dir}...")
            shutil.rmtree(clone_dir, ignore_errors=True)

        MODULES_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Cloning {repo_url} (branch: {target_branch}) into {clone_dir}...")
        try:
            subprocess.run(
                ["git", "clone", "--branch", target_branch, "--depth", "1", repo_url, str(clone_dir)],
                check=True
            )
        except subprocess.CalledProcessError as e:
            print(f"Error cloning repository: {e}", file=sys.stderr)
            sys.exit(1)

        deploy_script = clone_dir / mod["deploy_script"].lstrip("./")
        if not deploy_script.exists():
            print(f"Error: Deploy script not found at {deploy_script}", file=sys.stderr)
            sys.exit(1)

        print(f"\nExecuting {deploy_script}...")
        deploy_env = os.environ.copy()
        deploy_env["GCP_PROJECT_ID"] = gcp_project
        deploy_env["GCP_REGION"] = gcp_region
        deploy_env["SELECTED_AGENT_TYPES"] = ",".join(selected_keys)
        for key in selected_keys:
            deploy_env[f"DEPLOY_{key.upper()}"] = "true"

        try:
            # Execute deploy script in the root of the cloned directory
            subprocess.run(
                [str(deploy_script)],
                cwd=str(clone_dir),
                env=deploy_env,
                check=True
            )
        except subprocess.CalledProcessError as e:
            print(f"Error executing deploy script: {e}", file=sys.stderr)
            sys.exit(1)

        # Try to read generated IDs from an output file in clone_dir (e.g. .env or agent_ids.env)
        output_env = clone_dir / ".env"
        found_ids = {}
        if output_env.exists():
            with open(output_env, "r", encoding="utf-8") as f:
                for line in f:
                    stripped = line.strip()
                    if "=" in stripped and not stripped.startswith("#"):
                        k, v = stripped.split("=", 1)
                        found_ids[k.strip()] = v.strip()

        print("\n--- Retrieving Deployed Agent IDs ---")
        for key in selected_keys:
            meta = agent_types_meta[key]
            env_var_name = meta["env_var"]
            if env_var_name in found_ids and found_ids[env_var_name]:
                print(f"Found {env_var_name} from deploy output: {found_ids[env_var_name]}")
                new_env_vars[env_var_name] = found_ids[env_var_name]
            else:
                val = prompt_input(f"Please confirm/enter the generated ID for {meta['name']} ({env_var_name})", required=True)
                new_env_vars[env_var_name] = val

    # 4. Save to .env
    update_env_file(ENV_FILE, new_env_vars)
    print("\nOptional module setup complete!")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Install and configure optional Looker Embed Demo modules.")
    parser.add_argument("--module", required=True, help="ID of the module to install (e.g., adk_agent)")
    args = parser.parse_args()
    run_install(args.module)

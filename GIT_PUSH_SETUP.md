# Git Push Authentication Setup

## Problem

When trying to push commits using `git push`, you may encounter this error:

```
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/fernandogarzaaa/appforge/'
```

## Root Cause

The repository's git configuration uses a credential helper that requires the `GITHUB_TOKEN` environment variable to be set. Without this token, git cannot authenticate with GitHub and push operations fail.

## Solution Options

### Option 1: Set GITHUB_TOKEN Environment Variable (Recommended for CI/CD)

1. Generate a Personal Access Token (PAT) on GitHub:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Select scopes: at minimum `repo` (Full control of private repositories)
   - Generate and copy the token

2. Set the environment variable:
   ```bash
   export GITHUB_TOKEN="your_token_here"
   ```

3. For permanent setup, add to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.):
   ```bash
   echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
   source ~/.bashrc
   ```

### Option 2: Use SSH Instead of HTTPS

1. Set up SSH keys if you haven't already:
   - Follow [GitHub's SSH key guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

2. Change the remote URL to use SSH:
   ```bash
   git remote set-url origin git@github.com:fernandogarzaaa/appforge.git
   ```

3. Verify the change:
   ```bash
   git remote -v
   ```

### Option 3: Use Git Credential Manager

1. Install Git Credential Manager:
   - [Download and install](https://github.com/git-ecosystem/git-credential-manager)

2. Remove the current credential helper:
   ```bash
   git config --unset credential.helper
   ```

3. Git Credential Manager will prompt for credentials on first push

### Option 4: Use GitHub CLI (gh)

1. Install GitHub CLI:
   - [Installation guide](https://cli.github.com/)

2. Authenticate:
   ```bash
   gh auth login
   ```

3. Configure git to use gh:
   ```bash
   gh auth setup-git
   ```

## Testing Your Setup

After setting up authentication, test with:

```bash
# Make a small change
echo "# Test" > test.txt
git add test.txt
git commit -m "Test commit"
git push

# Clean up if successful
git reset --soft HEAD~1
git restore --staged test.txt
rm test.txt
```

## For GitHub Actions / CI/CD

GitHub Actions automatically provides `GITHUB_TOKEN` in the workflow environment. No additional setup is needed for automated workflows.

In your workflow file, the token is available as `${{ secrets.GITHUB_TOKEN }}` or `${{ github.token }}`.

## Current Git Configuration

The repository uses this credential helper configuration:
```
[credential]
    username = copilot-swe-agent[bot]
    helper = "!f() { test \"$1\" = get && echo \"password=$GITHUB_TOKEN\"; }; f"
```

This helper reads the `GITHUB_TOKEN` environment variable for authentication.

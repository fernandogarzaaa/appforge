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
   export GITHUB_TOKEN="your_personal_access_token_here"
   ```

3. **SECURITY WARNING**: Storing tokens in shell profile files exposes them in plaintext.
   For permanent setup, consider these options:

   **Option A (Less Secure)**: Add to shell profile with restricted permissions
   ```bash
   echo 'export GITHUB_TOKEN="your_token_here"' >> ~/.bashrc
   chmod 600 ~/.bashrc  # Restrict file permissions
   source ~/.bashrc
   ```
   
   **Note**: This provides basic protection but is NOT foolproof on multi-user systems.
   Other users may still access the token through backups or if directory permissions allow it.

   **Option B (More Secure)**: Use a credential manager or password manager to store tokens
   - Consider using Git Credential Manager (Option 3 below)
   - Or use a password manager and manually set the variable when needed
   - **Strongly recommended** for shared or multi-user environments

### Option 2: Use SSH Instead of HTTPS

1. Set up SSH keys if you haven't already:
   - Follow [GitHub's SSH key guide](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)

2. Change the remote URL to use SSH:
   ```bash
   # Replace with your actual repository path
   git remote set-url origin git@github.com:USERNAME/REPOSITORY.git
   
   # For this repository specifically:
   # git remote set-url origin git@github.com:fernandogarzaaa/appforge.git
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

# IMPORTANT: Only run cleanup if push SUCCEEDED
# Check git log first to verify you're resetting the correct commit
git log --oneline -3

# If test push was successful, clean up:
git reset --soft HEAD~1
git restore --staged test.txt
rm test.txt
```

**WARNING**: Do not run the cleanup commands if the push failed, as you might lose actual work.

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

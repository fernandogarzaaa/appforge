#!/usr/bin/env bash

# Git Authentication Checker
# This script helps diagnose git push authentication issues

echo "======================================="
echo "Git Authentication Diagnostic Tool"
echo "======================================="
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ ERROR: Not a git repository"
    echo "   Please run this script from within a git repository"
    echo ""
    exit 1
fi

# Function to check for SSH keys
check_ssh_keys() {
    if [ -f ~/.ssh/id_rsa ] || [ -f ~/.ssh/id_ed25519 ] || [ -f ~/.ssh/id_ecdsa ] || [ -f ~/.ssh/id_dsa ]; then
        return 0  # Keys found
    fi
    return 1  # No keys found
}

# Check if GITHUB_TOKEN is set
echo "1. Checking GITHUB_TOKEN environment variable..."
if [ -z "$GITHUB_TOKEN" ]; then
    echo "   ❌ GITHUB_TOKEN is NOT set"
    echo "   This is likely why git push fails"
else
    echo "   ✅ GITHUB_TOKEN is set"
fi
echo ""

# Check git remote configuration
echo "2. Checking git remote configuration..."
REMOTE_URL=$(git config --get remote.origin.url)
echo "   Remote URL: $REMOTE_URL"

if [[ $REMOTE_URL == git@github.com* ]]; then
    echo "   ✅ Using SSH protocol"
    echo "   Authentication: SSH keys"
elif [[ $REMOTE_URL == https://github.com* ]]; then
    echo "   ℹ️  Using HTTPS protocol"
    echo "   Authentication: Token or credentials required"
else
    echo "   ⚠️  Unknown protocol"
fi
echo ""

# Check credential helper
echo "3. Checking git credential helper..."
CRED_HELPER=$(git config --get credential.helper)
if [ -z "$CRED_HELPER" ]; then
    echo "   ❌ No credential helper configured"
else
    echo "   ✅ Credential helper: $CRED_HELPER"
fi
echo ""

# Check if SSH keys are available
echo "4. Checking SSH keys..."
if check_ssh_keys; then
    echo "   ✅ SSH keys found"
else
    echo "   ❌ No SSH keys found"
fi
echo ""

# Check if GitHub CLI is installed and authenticated
echo "5. Checking GitHub CLI (gh)..."
if command -v gh &> /dev/null; then
    echo "   ✅ GitHub CLI is installed"
    if gh auth status &> /dev/null; then
        echo "   ✅ GitHub CLI is authenticated"
    else
        echo "   ❌ GitHub CLI is not authenticated"
    fi
else
    echo "   ❌ GitHub CLI is not installed"
fi
echo ""

# Summary and recommendations
echo "======================================="
echo "Summary and Recommendations"
echo "======================================="
echo ""

if [[ $REMOTE_URL == https://github.com* ]] && [ -z "$GITHUB_TOKEN" ]; then
    echo "⚠️  ISSUE DETECTED: Using HTTPS but GITHUB_TOKEN is not set"
    echo ""
    echo "Recommended solutions (choose one):"
    echo ""
    echo "A. Set GITHUB_TOKEN environment variable:"
    echo "   export GITHUB_TOKEN='your_token_here'"
    echo ""
    echo "B. Switch to SSH authentication:"
    # Extract repo info from REMOTE_URL more robustly
    REPO_PATH=$(echo "$REMOTE_URL" | sed -E 's|https?://[^/]+/||' | sed 's|\.git$||')
    if [ -n "$REPO_PATH" ]; then
        echo "   git remote set-url origin git@github.com:${REPO_PATH}.git"
    else
        echo "   git remote set-url origin git@github.com:USERNAME/REPOSITORY.git"
    fi
    echo ""
    echo "C. Use GitHub CLI:"
    echo "   gh auth login"
    echo "   gh auth setup-git"
    echo ""
    echo "See GIT_PUSH_SETUP.md for detailed instructions"
elif [[ $REMOTE_URL == git@github.com* ]] && ! check_ssh_keys; then
    echo "⚠️  ISSUE DETECTED: Using SSH but no SSH keys found"
    echo ""
    echo "Recommended solution:"
    echo "   Set up SSH keys following: https://docs.github.com/en/authentication/connecting-to-github-with-ssh"
else
    echo "✅ Git authentication appears to be configured correctly"
fi
echo ""

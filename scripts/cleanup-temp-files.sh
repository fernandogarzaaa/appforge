#!/bin/bash
# cleanup-temp-files.sh
# Script to clean up temporary files from the repository

set -e

echo "🧹 AppForge Repository Cleanup Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Count files before cleanup
echo -e "${YELLOW}Counting temporary files...${NC}"
TEMP_COUNT=$(find . -maxdepth 1 -type f   -name "*.txt" -o -name "*.log" -o   -name "debug_*" -o -name "fail_log_*" -o   -name "final_scan_*" -o -name "qaswarm_*" -o   -name "typecheck_report_*" -o -name "build_log_*" 2>/dev/null | wc -l)

echo "Found $TEMP_COUNT temporary files"

# Ask for confirmation
read -p "Do you want to remove these files? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled.${NC}"
    exit 0
fi

# Remove temporary files
echo -e "${YELLOW}Removing temporary files...${NC}"
find . -maxdepth 1 -type f   \( -name "*.txt" -o -name "*.log" -o      -name "debug_*" -o -name "fail_log_*" -o      -name "final_scan_*" -o -name "qaswarm_*" -o      -name "typecheck_report_*" -o -name "build_log_*" \)   -exec rm -f {} \;

# Move remaining logs to logs directory
echo -e "${YELLOW}Moving logs to logs/ directory...${NC}"
if [ -d "logs" ]; then
    mv *.log logs/ 2>/dev/null || true
fi

echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Review the changes with: git status"
echo "2. Commit with: git commit -am 'chore: clean up temporary files'"
echo "3. Push with: git push"

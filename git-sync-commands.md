# Git Sync Commands for Drahms Vision

## PowerShell Commands for GitHub Synchronization

### 1. Check Current Status
`powershell
git status
`
- Shows if you have uncommitted changes
- Shows if you're behind/ahead of remote
- **Example Output:** "Your branch is up to date with 'origin/master'"

### 2. See What Files Changed
`powershell
git diff
`
- Shows exactly what changed in your files
- Displays line-by-line differences
- Press q to exit the diff view

### 3. Add All Changes
`powershell
git add .
`
- Stages all modified files for commit
- Use git add filename to add specific files
- Use git add -A to add all changes including deletions

### 4. Commit Changes
`powershell
git commit -m "Your commit message here"
`
- Creates a commit with your changes
- Write descriptive commit messages
- **Examples:**
  - git commit -m "Fix JavaScript errors"
  - git commit -m "Update interface design"
  - git commit -m "Add new camera features"

### 5. Push to GitHub
`powershell
git push origin master
`
- Uploads your commits to GitHub
- Makes changes available to others
- Use git push -u origin master for first-time push

### 6. Pull from GitHub
`powershell
git pull origin master
`
- Downloads any changes from GitHub
- Updates your local files with remote changes
- Use this before making local changes

### 7. Check Remote URL
`powershell
git remote -v
`
- Shows which GitHub repository you're connected to
- Displays fetch and push URLs
- **Example Output:** origin  https://github.com/solshaskie/Drahms-Vision.git (fetch)

---

## Quick Sync Workflow

### Complete Sync Process:
`powershell
# 1. Check what changed
git status

# 2. Add changes
git add .

# 3. Commit changes
git commit -m "Description of changes"

# 4. Push to GitHub
git push origin master
`

### One-Line Sync (if you're sure about changes):
`powershell
git add . && git commit -m "Update files" && git push origin master
`

---

## Additional Useful Commands

### View Commit History:
`powershell
git log --oneline
`

### Check Branch:
`powershell
git branch
`

### Switch Branches:
`powershell
git checkout branch-name
`

### Create New Branch:
`powershell
git checkout -b new-branch-name
`

### Discard Local Changes:
`powershell
git checkout -- filename
`

### Reset to Last Commit:
`powershell
git reset --hard HEAD
`

---

## GitHub Desktop Alternative

If you prefer a visual interface:
1. Open GitHub Desktop
2. Review changes in the left panel
3. Write commit message
4. Click "Commit to main"
5. Click "Push origin"

---

## Drahms Vision Repository Info

- **Local Path:** C:\Users\Ashley\Drahms-Vision
- **GitHub URL:** https://github.com/solshaskie/Drahms-Vision
- **Branch:** master
- **Status:** Up to date with remote

---

*Last Updated: August 22, 2025*
*For Drahms Vision Astronomy Camera System*

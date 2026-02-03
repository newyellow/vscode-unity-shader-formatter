# Packaging and Publishing (VS Code Marketplace)

## 1) Update the version
Edit `package.json` and bump the `version` using semver:
- Patch: `1.0.1` → `1.0.2` (bug fixes)
- Minor: `1.0.1` → `1.1.0` (new features)
- Major: `1.0.1` → `2.0.0` (breaking changes)

## 2) Install vsce (one-time)
```bash
npm install -g @vscode/vsce
```

## 3) Build the extension
```bash
npm install
npm run compile
```

## 4) Package a .vsix (optional but recommended)
```bash
vsce package
```
This produces a `.vsix` file that you can install locally:
```bash
code --install-extension <your-file>.vsix
```

## 5) Publish to the Marketplace
First-time setup:
- Create a Publisher in the VS Code Marketplace.
- Create a Personal Access Token (PAT) in Azure DevOps.
- Login once:
```bash
vsce login <publisher-name>
```

Publish:
```bash
vsce publish
```

Or publish and bump version automatically:
```bash
vsce publish patch
vsce publish minor
vsce publish major
```

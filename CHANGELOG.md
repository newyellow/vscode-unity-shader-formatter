# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]
- Added a local Node-based test runner under `_localTest` to format test files without packaging the extension.
- Refactored the formatter into a shared module and streamlined the formatting pipeline for maintainability.
- Improved operator spacing rules for compound operators, unary signs, comment slashes, and dot member access.
- Added bracket and generic handling for `[]` and `< >` with context-aware spacing.
- Indented single-line control statements (`if`, `else if`, `else`, `for`) when braces are omitted.

## [1.0.1] - 2025-12-21
- Initial public release.

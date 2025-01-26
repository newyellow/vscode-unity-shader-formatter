import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    // Create output channel for logging
    const outputChannel = vscode.window.createOutputChannel('Unity Shader Formatter');

    // Register formatter for Unity ShaderLab shaders
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            { language: 'UnityShader' },
            {
                provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                    const edits: vscode.TextEdit[] = [];
                    const fileName = document.fileName;
                    const fileExtension = fileName.split('.').pop();
                    const text = document.getText();

                    // Debug logging
                    outputChannel.appendLine(`Formatting Unity ShaderLab file: ${fileName}`);
                    outputChannel.appendLine(`File extension: ${fileExtension}`);
                    outputChannel.appendLine(`Document language ID: ${document.languageId}`);

                    if (fileExtension === 'compute') {
                        const formattedText = formatUnityComputeShader(text);
                        if (formattedText !== text) {
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(text.length)
                            );
                            edits.push(vscode.TextEdit.replace(fullRange, formattedText));
                        }
                    }
                    else // .shader
                    {
                        const formattedText = formatUnityShaderlabShader(text);
                        if (formattedText !== text) {
                            const fullRange = new vscode.Range(
                                document.positionAt(0),
                                document.positionAt(text.length)
                            );
                            edits.push(vscode.TextEdit.replace(fullRange, formattedText));
                        }
                    }

                    return edits;
                }
            }
        )
    );

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            { language: 'unity-shaderlab-shader' },
            {
                provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                    const edits: vscode.TextEdit[] = [];
                    const text = document.getText();

                    const formattedText = formatUnityShaderlabShader(text);

                    if (formattedText !== text) {
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(text.length)
                        );
                        edits.push(vscode.TextEdit.replace(fullRange, formattedText));
                    }

                    return edits;
                }
            }
        )
    );

    // Register formatter for Unity Compute shaders
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider(
            { language: 'unity-compute-shader' },
            {
                provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                    const edits: vscode.TextEdit[] = [];
                    const text = document.getText();

                    const formattedText = formatUnityComputeShader(text);

                    if (formattedText !== text) {
                        const fullRange = new vscode.Range(
                            document.positionAt(0),
                            document.positionAt(text.length)
                        );
                        edits.push(vscode.TextEdit.replace(fullRange, formattedText));
                    }

                    return edits;
                }
            }
        )
    );
}

function formatUnityComputeShader(text: string): string {
    let lines = text.split(/\r?\n/);
    let formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = vscode.window.activeTextEditor?.options.tabSize as number || 4;
    const useSpaces = vscode.window.activeTextEditor?.options.insertSpaces as boolean || true;
    const indent = useSpaces ? ' '.repeat(indentSize) : '\t';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (line.length === 0) {
            formattedLines.push('');
            continue;
        }

        // Don't indent preprocessor directives and kernel declarations
        if (line.startsWith('#') || line.startsWith('[numthreads')) {
            formattedLines.push(line);
            continue;
        }

        // handling comments
        if (line.startsWith("//")) {
            formattedLines.push(indent.repeat(Math.max(0, indentLevel)) + line);
            continue;
        }

        // Handle braces
        if (line === '{') {
            formattedLines.push(indent.repeat(Math.max(0, indentLevel)) + line);
            indentLevel++;
            continue;
        } else if (line === '}' || line === '};') {
            indentLevel = Math.max(0, indentLevel - 1);
            formattedLines.push(indent.repeat(indentLevel) + line);
            continue;
        }



        // Fix operator spacing
        if (!line.startsWith('#')) {
            // Array to hold the found strings
            let stringPlaceholders: string[] = [];

            // Regular expression to find strings and replace them with placeholders
            line = line.replace(/"([^"]+)"/g, (match) => {
                stringPlaceholders.push(match); // Store the found string
                return `@str${stringPlaceholders.length}@`; // Replace with placeholder
            });

            if (!line.includes('<') || !line.includes('>')) {
                line = line
                    .replace(/(?<![=+\-*/<>!&|^%])([=+\-*/<>!&|^%])(?![=+\-*/<>!&|^%])/g, ' $1 ')
                    .replace(/([=+\-*<>!&|^%]{2})/g, ' $1 ')
                    .replace(/\s*([,;])\s*/g, '$1 ')
                    .replace(/\s*:\s*/g, ' : ')
                    .replace(/\(\s+/g, '(')
                    .replace(/\s+\)/g, ')')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Restore the original strings from placeholders
            stringPlaceholders.forEach((str, index) => {
                line = line.replace(`@str${index + 1}@`, str);
            });

            // if both includes
            if (line.includes('{') && line.includes('}')) {

                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                    formattedLines.push(indent.repeat(indentLevel) + line);
                    indentLevel++; // makes it unchange in the result
                }
                else {
                    formattedLines.push(indent.repeat(indentLevel) + line);
                }
            }
            else if (line.includes('{')) {
                formattedLines.push(indent.repeat(indentLevel) + line);
                indentLevel++;
            }
            else if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
                formattedLines.push(indent.repeat(indentLevel) + line);
            }
            else {
                formattedLines.push(indent.repeat(indentLevel) + line);
            }
        }
        else {
            formattedLines.push(indent.repeat(indentLevel) + line);
        }
    }

    return formattedLines.join('\n');
}

function formatUnityShaderlabShader(text: string): string {
    let lines = text.split(/\r?\n/);
    let formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = vscode.window.activeTextEditor?.options.tabSize as number || 4;
    const useSpaces = vscode.window.activeTextEditor?.options.insertSpaces as boolean || true;
    const indent = useSpaces ? ' '.repeat(indentSize) : '\t';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (line.length === 0) {
            formattedLines.push('');
            continue;
        }

        // Handle braces
        if (line === '{') {
            formattedLines.push(indent.repeat(Math.max(0, indentLevel)) + line);
            indentLevel++;
            continue;
        } else if (line === '}' || line === '};') {
            indentLevel = Math.max(0, indentLevel - 1);
            formattedLines.push(indent.repeat(indentLevel) + line);
            continue;
        }

        // Fix operator spacing
        if (!line.startsWith('#')) {
            // Array to hold the found strings
            let stringPlaceholders: string[] = [];

            // Regular expression to find strings and replace them with placeholders
            line = line.replace(/"([^"]+)"/g, (match) => {
                stringPlaceholders.push(match); // Store the found string
                return `@str${stringPlaceholders.length}@`; // Replace with placeholder
            });

            if (!line.includes('<') || !line.includes('>')) {
                line = line
                    .replace(/(?<![=+\-*/<>!&|^%])([=+\-*/<>!&|^%])(?![=+\-*/<>!&|^%])/g, ' $1 ')
                    .replace(/([=+\-*<>!&|^%]{2})/g, ' $1 ')
                    .replace(/\s*([,;])\s*/g, '$1 ')
                    .replace(/\s*:\s*/g, ' : ')
                    .replace(/\(\s+/g, '(')
                    .replace(/\s+\)/g, ')')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            // Restore the original strings from placeholders
            stringPlaceholders.forEach((str, index) => {
                line = line.replace(`@str${index + 1}@`, str);
            });

            // if both includes
            if (line.includes('{') && line.includes('}')) {

                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                    formattedLines.push(indent.repeat(indentLevel) + line);
                    indentLevel++; // makes it unchange in the result
                }
                else {
                    formattedLines.push(indent.repeat(indentLevel) + line);
                }
            }
            else if (line.includes('{')) {
                formattedLines.push(indent.repeat(indentLevel) + line);
                indentLevel++;
            }
            else if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
                formattedLines.push(indent.repeat(indentLevel) + line);
            }
            else {
                formattedLines.push(indent.repeat(indentLevel) + line);
            }
        }
        else {
            formattedLines.push(indent.repeat(indentLevel) + line);
        }
    }

    return formattedLines.join('\n');
}

export function deactivate() { } 
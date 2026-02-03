import * as vscode from 'vscode';
import {
    formatUnityComputeShader,
    formatUnityShaderlabShader,
    FormatterOptions
} from './formatter';

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

                    const formatOptions = getFormatterOptions();

                    if (fileExtension === 'compute') {
                        const formattedText = formatUnityComputeShader(text, formatOptions);
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
                        const formattedText = formatUnityShaderlabShader(text, formatOptions);
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

                    const formattedText = formatUnityShaderlabShader(text, getFormatterOptions());

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

                    const formattedText = formatUnityComputeShader(text, getFormatterOptions());

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

function getFormatterOptions(): FormatterOptions {
    const editor = vscode.window.activeTextEditor;
    const indentSize = typeof editor?.options.tabSize === 'number' ? editor.options.tabSize : 4;
    const useSpaces = typeof editor?.options.insertSpaces === 'boolean' ? editor.options.insertSpaces : true;

    return {
        indentSize,
        useSpaces
    };
}

export function deactivate() { } 

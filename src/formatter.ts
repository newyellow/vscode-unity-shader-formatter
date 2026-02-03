export interface FormatterOptions {
    indentSize?: number;
    useSpaces?: boolean;
}

interface FormatConfig {
    isPassthroughLine?: (line: string) => boolean;
}

function getIndent(options?: FormatterOptions): string {
    const indentSize = options?.indentSize ?? 4;
    const useSpaces = options?.useSpaces ?? true;
    return useSpaces ? ' '.repeat(indentSize) : '\t';
}

function trimEndSpaces(value: string): string {
    let end = value.length;
    while (end > 0 && value[end - 1] === ' ') {
        end--;
    }
    return value.slice(0, end);
}

function getPrevNonSpace(value: string): string | null {
    for (let i = value.length - 1; i >= 0; i--) {
        if (value[i] !== ' ') {
            return value[i];
        }
    }
    return null;
}

function isLetterOrDigit(value: string): boolean {
    return /[A-Za-z0-9_]/.test(value);
}

function isUnaryContext(prevChar: string | null): boolean {
    if (prevChar === null) {
        return true;
    }
    return /[=([{,;:+\-*/%<>!&|^]/.test(prevChar);
}

function getNextNonEmptyLine(lines: string[], startIndex: number): string | null {
    for (let i = startIndex + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.length > 0) {
            return trimmed;
        }
    }
    return null;
}

function isControlStatement(line: string): boolean {
    return /^(?:if|else\s+if|else|for)\b/.test(line);
}

function shouldIndentNextLine(line: string, nextNonEmptyLine: string | null): boolean {
    if (!isControlStatement(line)) {
        return false;
    }
    if (line.includes('{') || line.includes('}')) {
        return false;
    }
    if (!nextNonEmptyLine) {
        return false;
    }
    return !nextNonEmptyLine.startsWith('{');
}

function protectStringLiterals(line: string): { line: string; placeholders: string[] } {
    const placeholders: string[] = [];
    const protectedLine = line.replace(/"([^"]+)"/g, (match) => {
        placeholders.push(match);
        return `@str${placeholders.length}@`;
    });
    return { line: protectedLine, placeholders };
}

function restoreStringLiterals(line: string, placeholders: string[]): string {
    let restored = line;
    placeholders.forEach((str, index) => {
        restored = restored.replace(`@str${index + 1}@`, str);
    });
    return restored;
}

function formatMathOperators(line: string): string {
    const operators = new Set(['+', '-', '*', '/']);
    let result = '';
    let i = 0;

    while (i < line.length) {
        const ch = line[i];
        if (!operators.has(ch)) {
            result += ch;
            i++;
            continue;
        }

        const prevNonSpace = getPrevNonSpace(result);
        let j = i + 1;
        while (j < line.length && line[j] === ' ') {
            j++;
        }
        const nextChar = j < line.length ? line[j] : '';
        if (ch === '/' && nextChar === '/') {
            result = trimEndSpaces(result);
            if (result.length > 0) {
                result += ' ';
            }
            result += '//';
            result += line.slice(j + 1);
            return result;
        }
        const isCompound = nextChar === '=';
        const isUnary = (ch === '+' || ch === '-')
            && (isLetterOrDigit(nextChar) || nextChar === '.')
            && isUnaryContext(prevNonSpace);

        if (isCompound) {
            result = trimEndSpaces(result);
            if (result.length > 0) {
                result += ' ';
            }
            result += ch + '=';
            result += ' ';
            i = j + 1;
            while (i < line.length && line[i] === ' ') {
                i++;
            }
            continue;
        }

        if (isUnary) {
            result = trimEndSpaces(result);
            if (result.length > 0) {
                result += ' ';
            }
            result += ch;
            i = j;
            continue;
        }

        result = trimEndSpaces(result);
        if (result.length > 0) {
            result += ' ';
        }
        result += ch;
        result += ' ';
        i++;
        while (i < line.length && line[i] === ' ') {
            i++;
        }
    }

    return result;
}

function trimBracketSpacing(line: string): string {
    let result = '';
    let i = 0;

    while (i < line.length) {
        const ch = line[i];
        if (ch === '[') {
            result = trimEndSpaces(result) + '[';
            i++;
            while (i < line.length && line[i] === ' ') {
                i++;
            }
            continue;
        }
        if (ch === ']') {
            result = trimEndSpaces(result) + ']';
            i++;
            while (i < line.length && line[i] === ' ') {
                i++;
            }
            continue;
        }
        if (ch === '<') {
            let j = i + 1;
            while (j < line.length && line[j] === ' ') {
                j++;
            }
            const nextChar = j < line.length ? line[j] : '';

            if (nextChar === '=') {
                result = trimEndSpaces(result);
                if (result.length > 0) {
                    result += ' ';
                }
                result += '<=';
                result += ' ';
                i = j + 1;
                while (i < line.length && line[i] === ' ') {
                    i++;
                }
                continue;
            }

            let k = j;
            let isGeneric = true;
            while (k < line.length) {
                const current = line[k];
                if (current === '>') {
                    break;
                }
                if (!isLetterOrDigit(current) && current !== ' ') {
                    isGeneric = false;
                    break;
                }
                k++;
            }
            if (isGeneric && k < line.length && line[k] === '>') {
                result = trimEndSpaces(result);
                const inner = line.slice(j, k).trim();
                result += '<' + inner + '>';
                i = k + 1;
                while (i < line.length && line[i] === ' ') {
                    i++;
                }
                if (i < line.length) {
                    result += ' ';
                }
                continue;
            }

            if (isLetterOrDigit(nextChar) || nextChar === '.') {
                result = trimEndSpaces(result);
                if (result.length > 0) {
                    result += ' ';
                }
                result += '<';
                result += ' ';
                i = j;
                continue;
            }
        }

        if (ch === '>') {
            let j = i + 1;
            while (j < line.length && line[j] === ' ') {
                j++;
            }
            const nextChar = j < line.length ? line[j] : '';

            if (nextChar === '=') {
                result = trimEndSpaces(result);
                if (result.length > 0) {
                    result += ' ';
                }
                result += '>=';
                result += ' ';
                i = j + 1;
                while (i < line.length && line[i] === ' ') {
                    i++;
                }
                continue;
            }

            if (isLetterOrDigit(nextChar) || nextChar === '.') {
                result = trimEndSpaces(result);
                if (result.length > 0) {
                    result += ' ';
                }
                result += '>';
                result += ' ';
                i = j;
                continue;
            }
        }
        result += ch;
        i++;
    }

    return result;
}

function normalizeSpacing(line: string): string {
    const { line: protectedLine, placeholders } = protectStringLiterals(line);
    let normalized = protectedLine;

    normalized = normalized
        .replace(/=\s+=/g, '==')
        .replace(/\/\s+\//g, '//')
        .replace(/\s*\.\s*/g, '.')
        .replace(/(\de|(?:^|[(+\-])[\t ]*)[\t ]*?([+\-])[\t ]*/g, '$1$2')
        .replace(/(?<![=!&|^%])([=!&|^%])(?![=!&|^%])/g, ' $1 ')
        .replace(/([=!&|^%]{2})/g, ' $1 ')
        .replace(/\s*([,;])\s*/g, '$1 ')
        .replace(/\s*:\s*/g, ' : ')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\s+/g, ' ')
        .trim();
    normalized = formatMathOperators(normalized);
    normalized = trimBracketSpacing(normalized);

    return restoreStringLiterals(normalized, placeholders);
}

function formatDocument(text: string, options: FormatterOptions | undefined, config: FormatConfig): string {
    const lines = text.split(/\r?\n/);
    const formattedLines: string[] = [];
    let indentLevel = 0;
    let pendingIndent = false;
    const indent = getIndent(options);

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Skip empty lines
        if (line.length === 0) {
            formattedLines.push('');
            continue;
        }

        // Passthrough lines (no indentation or spacing changes)
        if (config.isPassthroughLine?.(line)) {
            formattedLines.push(line);
            continue;
        }

        // handling comments
        if (line.startsWith("//")) {
            const extraIndent = pendingIndent ? 1 : 0;
            if (pendingIndent) {
                pendingIndent = false;
            }
            formattedLines.push(indent.repeat(Math.max(0, indentLevel + extraIndent)) + line);
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
            line = normalizeSpacing(line);

            // if both includes
            if (line.includes('{') && line.includes('}')) {
                if (line.startsWith('}')) {
                    indentLevel = Math.max(0, indentLevel - 1);
                    formattedLines.push(indent.repeat(indentLevel) + line);
                    indentLevel++; // makes it unchange in the result
                }
                else {
                    const extraIndent = pendingIndent ? 1 : 0;
                    if (pendingIndent) {
                        pendingIndent = false;
                    }
                    formattedLines.push(indent.repeat(indentLevel + extraIndent) + line);
                }
            }
            else if (line.includes('{')) {
                const extraIndent = pendingIndent ? 1 : 0;
                if (pendingIndent) {
                    pendingIndent = false;
                }
                formattedLines.push(indent.repeat(indentLevel + extraIndent) + line);
                indentLevel++;
            }
            else if (line.includes('}')) {
                indentLevel = Math.max(0, indentLevel - 1);
                formattedLines.push(indent.repeat(indentLevel) + line);
            }
            else {
                const extraIndent = pendingIndent ? 1 : 0;
                if (pendingIndent) {
                    pendingIndent = false;
                }
                formattedLines.push(indent.repeat(indentLevel + extraIndent) + line);
            }
        }
        else {
            const extraIndent = pendingIndent ? 1 : 0;
            if (pendingIndent) {
                pendingIndent = false;
            }
            formattedLines.push(indent.repeat(indentLevel + extraIndent) + line);
        }

        if (!pendingIndent) {
            const nextNonEmptyLine = getNextNonEmptyLine(lines, i);
            pendingIndent = shouldIndentNextLine(line, nextNonEmptyLine);
        }
    }

    return formattedLines.join('\n');
}

export function formatUnityComputeShader(text: string, options?: FormatterOptions): string {
    return formatDocument(text, options, {
        isPassthroughLine: (line) => line.startsWith('#') || line.startsWith('[numthreads')
    });
}

export function formatUnityShaderlabShader(text: string, options?: FormatterOptions): string {
    return formatDocument(text, options, {});
}

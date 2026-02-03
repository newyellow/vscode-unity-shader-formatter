export interface FormatterOptions {
    indentSize?: number;
    useSpaces?: boolean;
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
        if (ch === '<' || ch === '>') {
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
                result += ch + '=';
                result += ' ';
                i = j + 1;
                while (i < line.length && line[i] === ' ') {
                    i++;
                }
                continue;
            }

            if (ch === '<' && isLetterOrDigit(nextChar)) {
                let k = j;
                while (k < line.length && isLetterOrDigit(line[k])) {
                    k++;
                }
                let m = k;
                while (m < line.length && line[m] === ' ') {
                    m++;
                }
                if (m < line.length && line[m] === '>') {
                    result = trimEndSpaces(result);
                    result += '<' + line.slice(j, k) + '>';
                    i = m + 1;
                    if (i < line.length && line[i] !== ' ') {
                        result += ' ';
                    }
                    while (i < line.length && line[i] === ' ') {
                        i++;
                    }
                    continue;
                }
            }

            if (isLetterOrDigit(nextChar) || nextChar === '.') {
                result = trimEndSpaces(result);
                if (result.length > 0) {
                    result += ' ';
                }
                result += ch;
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

export function formatUnityComputeShader(text: string, options?: FormatterOptions): string {
    const lines = text.split(/\r?\n/);
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indent = getIndent(options);

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
            const stringPlaceholders: string[] = [];

            // Regular expression to find strings and replace them with placeholders
            line = line.replace(/"([^"]+)"/g, (match) => {
                stringPlaceholders.push(match); // Store the found string
                return `@str${stringPlaceholders.length}@`; // Replace with placeholder
            });

            if (!line.includes('<') || !line.includes('>')) {
                line = line
                    .replace(/=\s+=/g, '==')
                    .replace(/\/\s+\//g, '//')
                    .replace(/(\de|(?:^|[(+\-])[\t ]*)[\t ]*?([+\-])[\t ]*/g, '$1$2')
                    .replace(/(?<![=<>!&|^%])([=<>!&|^%])(?![=<>!&|^%])/g, ' $1 ')
                    .replace(/([=<>!&|^%]{2})/g, ' $1 ')
                    .replace(/\s*([,;])\s*/g, '$1 ')
                    .replace(/\s*:\s*/g, ' : ')
                    .replace(/\(\s+/g, '(')
                    .replace(/\s+\)/g, ')')
                    .replace(/\s+/g, ' ')
                    .trim();
                line = formatMathOperators(line);
                line = trimBracketSpacing(line);
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

export function formatUnityShaderlabShader(text: string, options?: FormatterOptions): string {
    const lines = text.split(/\r?\n/);
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indent = getIndent(options);

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
            const stringPlaceholders: string[] = [];

            // Regular expression to find strings and replace them with placeholders
            line = line.replace(/"([^"]+)"/g, (match) => {
                stringPlaceholders.push(match); // Store the found string
                return `@str${stringPlaceholders.length}@`; // Replace with placeholder
            });

            if (!line.includes('<') || !line.includes('>')) {
                line = line
                    .replace(/=\s+=/g, '==')
                    .replace(/\/\s+\//g, '//')
                    .replace(/(\de|(?:^|[(+\-])[\t ]*)[\t ]*?([+\-])[\t ]*/g, '$1$2')
                    .replace(/(?<![=<>!&|^%])([=<>!&|^%])(?![=<>!&|^%])/g, ' $1 ')
                    .replace(/([=<>!&|^%]{2})/g, ' $1 ')
                    .replace(/\s*([,;])\s*/g, '$1 ')
                    .replace(/\s*:\s*/g, ' : ')
                    .replace(/\(\s+/g, '(')
                    .replace(/\s+\)/g, ')')
                    .replace(/\s+/g, ' ')
                    .trim();
                line = formatMathOperators(line);
                line = trimBracketSpacing(line);
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

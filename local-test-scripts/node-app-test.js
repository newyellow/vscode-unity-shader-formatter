function processLine(line) {
    // Array to hold the found strings
    let stringPlaceholders = [];
    
    // Regular expression to find strings and replace them with placeholders
    line = line.replace(/"([^"]+)"/g, (match) => {
        stringPlaceholders.push(match); // Store the found string
        return `@str${stringPlaceholders.length}@`; // Replace with placeholder
    });

    // Check if the line contains both < and > to avoid adding spaces
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

    console.log(line);
}

processLine('includes "NY/+= e+helloWorld.h"');
processLine(" a=1+2-3*4");
processLine("a+=20;");
processLine("  // this is something");
processLine(" if(x>=y) { // this is something");
processLine(" if(y+3 <10);");
processLine(" else if (a==b) { // this is something that is not a comment");
processLine("  RWStructuredBuffer<Particle> bufferParticles;");

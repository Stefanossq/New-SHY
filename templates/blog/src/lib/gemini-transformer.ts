
/**
 * Utility functions for processing Gemini output.
 */

export function cleanMarkdown(text: string): string {
    // Remove code blocks wrappers if present
    return text.replace(/^\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
}

export function parseAIJSON(text: string): any {
    try {
        return JSON.parse(cleanMarkdown(text));
    } catch (e) {
        console.error("Failed to parse AI JSON", e);
        return null;
    }
}

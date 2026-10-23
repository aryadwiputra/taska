export function normalizeLegacyDocContent(content: string): string {
    if (!content || /<[a-z][\s\S]*>/i.test(content)) {
        return content.replace(/\n/g, '<br>');
    }

    const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .split(/\n{2,}/)
        .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
        .join('');
}

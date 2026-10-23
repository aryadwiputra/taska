export function normalizeLegacyDocContent(content: string): string {
    if (!content || /<[a-z][\s\S]*>/i.test(content)) {
        return content;
    }

    const escaped = content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return escaped
        .split(/\n{2,}/)
        .map(
            (block) =>
                `<p>${block
                    .split('\n')
                    .map((line) => line.trim() || '<br>')
                    .join('<br>')}</p>`,
        )
        .join('');
}

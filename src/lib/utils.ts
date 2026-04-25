/**
 * Removes all HTML tags and script tags from a string
 * @param html The string to sanitize
 * @returns Clean plain text
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    
    // 1. Remove script tags and their content
    let clean = html.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
    
    // 2. Remove all other HTML tags
    clean = clean.replace(/<[^>]+>/g, '');
    
    // 3. Decode common HTML entities
    clean = clean
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
        
    return clean.trim();
}

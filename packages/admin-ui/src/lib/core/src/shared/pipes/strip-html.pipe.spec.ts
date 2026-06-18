import { StripHtmlPipe } from './strip-html.pipe';

describe('StripHtmlPipe', () => {
    let pipe: StripHtmlPipe;

    beforeEach(() => {
        pipe = new StripHtmlPipe();
    });

    it('returns empty string for null/undefined/empty', () => {
        expect(pipe.transform(null)).toBe('');
        expect(pipe.transform(undefined)).toBe('');
        expect(pipe.transform('')).toBe('');
    });

    it('extracts text content from rich-text HTML', () => {
        expect(pipe.transform('<p>Main <strong>warehouse</strong></p>')).toBe('Main warehouse');
    });

    it('strips an XSS payload to its (empty) text content without executing it', () => {
        // #4488 — the img/onerror payload must not be rendered as markup.
        expect(pipe.transform('<img src=x onerror="alert(document.cookie)">')).toBe('');
    });

    it('keeps surrounding text while dropping the tag', () => {
        // Proves tags are removed but real text is preserved (not "empty for everything").
        expect(pipe.transform('Main <img src=x onerror="alert(1)"> warehouse')).toBe('Main  warehouse');
    });

    it('drops script content', () => {
        expect(pipe.transform('safe<script>alert(1)</script>')).toBe('safe');
    });

    it('drops style content', () => {
        expect(pipe.transform('safe<style>.x{color:red}</style>')).toBe('safe');
    });

    it('does not re-parse HTML entities as markup', () => {
        // Encoded entities decode to literal text, they are not re-interpreted as tags.
        expect(pipe.transform('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('<script>alert(1)</script>');
    });
});

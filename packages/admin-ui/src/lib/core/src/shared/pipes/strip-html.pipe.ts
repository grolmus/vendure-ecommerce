import { Pipe, PipeTransform } from '@angular/core';

/**
 * Extracts the plain-text content from an HTML string. Useful for previewing
 * rich-text fields (e.g. in list cells) without rendering the markup.
 *
 * Parsing is done with `DOMParser`, which produces an inert document: embedded
 * scripts are not executed and resources (e.g. `<img onerror>`) are not loaded,
 * so it is safe to pass untrusted HTML.
 *
 * Browser-only: relies on `DOMParser` (the Admin UI is a browser SPA).
 */
@Pipe({
    name: 'stripHtml',
    standalone: false,
})
export class StripHtmlPipe implements PipeTransform {
    transform(value?: string | null): string {
        if (!value) {
            return '';
        }
        const doc = new DOMParser().parseFromString(value, 'text/html');
        // Remove <script>/<style> so their source doesn't leak into the text
        // (textContent would otherwise include it). It is never executed.
        doc.body.querySelectorAll('script, style').forEach(el => el.remove());
        return doc.body.textContent ?? '';
    }
}

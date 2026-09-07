// Injects a "copy" button into every <pre class="file-tree"> block.
// The button copies the tree's plain text (without the button label and
// without the CSS-pseudo-element icons) to the clipboard.
//
// Call installFileTreeCopyButtons() after remark.create() has built the
// slide DOM. Safe to call multiple times: it skips blocks that already
// have a button (e.g. if remark re-renders).

// navigator.clipboard requires a secure context (https://, localhost,
// 127.0.0.1). When the talk is served from 0.0.0.0 or opened via file://
// the API is undefined, so we fall back to the legacy execCommand path.
function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        return navigator.clipboard.writeText(text);
    }
    return new Promise(function(resolve, reject) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
            var ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (ok) { resolve(); } else { reject(new Error('execCommand("copy") returned false')); }
        } catch (err) {
            document.body.removeChild(ta);
            reject(err);
        }
    });
}

// Feather-style outline icons, rendered as currentColor so CSS controls
// the stroke colour. viewBox is 24x24; CSS sizes them in em.
var CLIPBOARD_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="4" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>';
var CHECK_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>';
var ERROR_SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

function installFileTreeCopyButtons() {
    var blocks = document.querySelectorAll('pre.file-tree');
    blocks.forEach(function(pre) {
        if (pre.querySelector('.file-tree-copy')) return;

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'file-tree-copy';
        btn.innerHTML = CLIPBOARD_SVG;
        btn.setAttribute('aria-label', 'Copy directory tree to clipboard');
        btn.setAttribute('title', 'Copy to clipboard');

        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            event.preventDefault();

            // Clone the <pre>, drop the button, then read textContent so
            // the copied text does not include the icon glyphs.
            var clone = pre.cloneNode(true);
            var btnInClone = clone.querySelector('.file-tree-copy');
            if (btnInClone) btnInClone.remove();
            var text = clone.textContent.replace(/^\n+|\n+$/g, '') + '\n';

            copyTextToClipboard(text).then(function() {
                btn.innerHTML = CHECK_SVG;
                btn.classList.add('copied');
                btn.setAttribute('title', 'Copied!');
                setTimeout(function() {
                    btn.innerHTML = CLIPBOARD_SVG;
                    btn.classList.remove('copied');
                    btn.setAttribute('title', 'Copy to clipboard');
                }, 1500);
            }).catch(function(err) {
                console.error('file-tree copy failed:', err);
                btn.innerHTML = ERROR_SVG;
                btn.classList.add('error');
                btn.setAttribute('title', 'Copy failed (see console)');
                setTimeout(function() {
                    btn.innerHTML = CLIPBOARD_SVG;
                    btn.classList.remove('error');
                    btn.setAttribute('title', 'Copy to clipboard');
                }, 1500);
            });
        });

        pre.appendChild(btn);
    });
}

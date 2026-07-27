import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = join(process.cwd(), 'dist');
const outFile = process.argv[2] || join(process.cwd(), 'dist-single', 'give-take-standalone.html');

const html = readFileSync(join(distDir, 'index.html'), 'utf8');

const scriptMatch = html.match(/<script[^>]*src="\/assets\/([^"]+)"[^>]*><\/script>/);
const cssMatch = html.match(/<link[^>]*href="\/assets\/([^"]+)"[^>]*>/);

if (!scriptMatch || !cssMatch) {
  throw new Error('Could not find built script/css asset references in dist/index.html');
}

// Read as raw bytes (not utf8 strings) so base64 round-trips exactly, regardless of what
// byte sequences the minified output happens to contain.
const jsB64 = readFileSync(join(distDir, 'assets', scriptMatch[1])).toString('base64');
const cssB64 = readFileSync(join(distDir, 'assets', cssMatch[1])).toString('base64');

// Base64 can never contain "<", so embedding it as plain text is immune to any accidental
// "</script>"-like sequence inside the bundle prematurely closing the tag — unlike inlining
// the raw JS/CSS directly, which broke on exactly that.
const bootstrap = `
<script id="app-js-b64" type="text/plain">${jsB64}</script>
<script id="app-css-b64" type="text/plain">${cssB64}</script>
<script>
(function () {
  function b64ToUtf8(b64) {
    var binary = atob(b64);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder('utf-8').decode(bytes);
  }
  var css = b64ToUtf8(document.getElementById('app-css-b64').textContent);
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  // Set textContent directly (no Blob/object URL) so this doesn't depend on a host CSP
  // allowing blob: script sources — dynamically appended inline module scripts just work.
  var js = b64ToUtf8(document.getElementById('app-js-b64').textContent);
  var s = document.createElement('script');
  s.type = 'module';
  s.textContent = js;
  document.body.appendChild(s);
})();
</script>
`;

const inlined = html.replace(scriptMatch[0], '').replace(cssMatch[0], '').replace('</body>', `${bootstrap}\n  </body>`);

writeFileSync(outFile, inlined, 'utf8');
console.log('Wrote', outFile, `(${(inlined.length / 1024).toFixed(1)} KB)`);

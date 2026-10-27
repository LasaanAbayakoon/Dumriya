/** Copy text to the clipboard, falling back to execCommand on older WebViews. Throws on failure. */
export async function copyText(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      /* fall through to the legacy path (e.g. permission denied in an insecure context) */
    }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  const ok = typeof document.execCommand === 'function' && document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('Copy failed');
}

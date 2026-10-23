/**
 * Saves the brief's PDF from a click. The PDF takes a second or two to
 * render (longer on a cold start), and a bare download link gives no sign
 * of life meanwhile, so callers fetch it here and show progress. When the
 * fetch or the save fails, the PDF opens in the browser's viewer instead.
 */
export async function downloadBriefPdf(publicId: string): Promise<void> {
  const path = `/brief/${publicId}/pdf`;
  const follow = (href: string, filename?: string) => {
    const link = document.createElement('a');
    link.href = href;
    if (filename) link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`PDF ${response.status}`);
    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? 'Kyle-Anthony Hay - Brief.pdf';
    const url = URL.createObjectURL(blob);
    follow(url, filename);
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    console.error('brief: download failed, opening the PDF instead', error);
    follow(`${path}?inline=1`);
  }
}

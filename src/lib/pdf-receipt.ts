import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
GlobalWorkerOptions.workerSrc = workerUrl;
/** Render locally; original PDF, embedded links and document scripts are never sent/executed. */
export async function renderPdfReceipt(file: File): Promise<File> {
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
    enableXfa: false,
    maxImageSize: 16000000,
    canvasMaxAreaInBytes: 32000000,
    useSystemFonts: true,
  });
  const timer = window.setTimeout(() => void task.destroy(), 20000);
  const canvases: HTMLCanvasElement[] = [];
  try {
    const document = await task.promise;
    if (document.numPages > 3)
      throw new Error('PDF maksimal 3 halaman. Pisahkan dokumen sebelum mengunggah.');
    for (let i = 1; i <= document.numPages; i++) {
      const page = await document.getPage(i),
        natural = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(1000 / natural.width, 1500 / natural.height, 2),
      });
      const canvas = window.document.createElement('canvas');
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      await page.render({ canvas, viewport, annotationMode: 0, background: 'white' }).promise;
      canvases.push(canvas);
      page.cleanup();
    }
    const output = window.document.createElement('canvas');
    output.width = Math.max(...canvases.map((c) => c.width));
    output.height = canvases.reduce((n, c) => n + c.height, 0);
    const context = output.getContext('2d');
    if (!context) throw new Error('Browser tidak mendukung pratinjau PDF.');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, output.width, output.height);
    let y = 0;
    for (const canvas of canvases) {
      context.drawImage(canvas, 0, y);
      y += canvas.height;
      canvas.width = 0;
      canvas.height = 0;
    }
    const blob = await new Promise<Blob>((resolve, reject) =>
      output.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('PDF gagal dikonversi.'))),
        'image/jpeg',
        0.9,
      ),
    );
    output.width = 0;
    output.height = 0;
    return new File([blob], file.name.replace(/\.pdf$/i, '') + '.jpg', { type: 'image/jpeg' });
  } catch (error) {
    throw new Error(
      error instanceof Error && error.message.startsWith('PDF maksimal')
        ? error.message
        : 'PDF tidak dapat dibaca. Gunakan PDF tanpa password yang valid atau foto struk.',
    );
  } finally {
    window.clearTimeout(timer);
    for (const canvas of canvases) {
      canvas.width = 0;
      canvas.height = 0;
    }
    await task.destroy();
  }
}

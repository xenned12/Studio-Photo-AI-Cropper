import JSZip from 'jszip';
import { ImageItem } from '../types';

export function formatOutputFilename(
  originalName: string,
  template: string,
  ratioLabel: string,
  format: 'image/png' | 'image/jpeg' | 'image/webp'
): string {
  const baseName = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
  let ext = '.png';
  if (format === 'image/jpeg') ext = '.jpg';
  else if (format === 'image/webp') ext = '.webp';

  const result = (template || '{name}_cropped_{ratio}')
    .replace(/{name}/g, baseName)
    .replace(/{ratio}/g, ratioLabel.replace(/[:/]/g, '-'));

  return `${result}${ext}`;
}

export async function downloadBatchAsZip(
  items: ImageItem[],
  zipFilename: string = 'studio-cropped-photos.zip',
  template: string = '{name}_cropped_{ratio}',
  ratioLabel: string = 'crop'
): Promise<void> {
  const zip = new JSZip();
  const croppedItems = items.filter((item) => item.status === 'cropped' && item.croppedBlob);

  if (croppedItems.length === 0) {
    throw new Error('No cropped photos available to export');
  }

  for (let i = 0; i < croppedItems.length; i++) {
    const item = croppedItems[i];
    if (item.croppedBlob) {
      const filename = formatOutputFilename(
        item.name,
        template,
        ratioLabel,
        (item.croppedBlob.type as 'image/png' | 'image/jpeg' | 'image/webp') || 'image/png'
      );
      zip.file(filename, item.croppedBlob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(content);

  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

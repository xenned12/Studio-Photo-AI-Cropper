import JSZip from 'jszip';
import { ImageItem } from '../types';

/**
 * Downloads a batch of cropped images as a single zip archive
 */
export async function downloadBatchAsZip(
  items: ImageItem[],
  zipFilename: string = 'subject-cropped-photos.zip',
  onProgress?: (percent: number) => void
): Promise<void> {
  const zip = new JSZip();
  const folder = zip.folder('cropped_photos');

  const processedItems = items.filter((item) => item.croppedBlob && item.status === 'cropped');

  if (processedItems.length === 0) {
    throw new Error('No cropped images available to zip.');
  }

  let count = 0;
  for (const item of processedItems) {
    if (item.croppedBlob) {
      // Determine file extension
      let ext = '.jpg';
      if (item.croppedBlob.type === 'image/png') ext = '.png';
      else if (item.croppedBlob.type === 'image/webp') ext = '.webp';

      const baseName = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
      const fileName = `${baseName}${ext}`;

      folder?.file(fileName, item.croppedBlob);
      count++;
      if (onProgress) {
        onProgress(Math.round((count / processedItems.length) * 50));
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(50 + Math.round((metadata.percent / 100) * 50));
    }
  });

  // Trigger download
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = zipFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

import React, { useCallback, useEffect, useState } from 'react';
import { CropSettings, ImageItem } from './types';
import { Header } from './components/Header';
import { RatioSelector } from './components/RatioSelector';
import { DropZone } from './components/DropZone';
import { BatchGrid } from './components/BatchGrid';
import { SingleEditorModal } from './components/SingleEditorModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { detectHeadInImage } from './utils/faceDetector';
import { calculateCropRect, renderCroppedImage } from './utils/cropMath';
import { downloadBatchAsZip } from './utils/zipExport';
import { generateSamplePhotos } from './utils/sampleImages';
import { Zap, ShieldCheck, Cpu, ArrowLeftRight } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [editingItem, setEditingItem] = useState<ImageItem | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Master Crop Settings state
  const [cropSettings, setCropSettings] = useState<CropSettings>({
    ratioType: '3:5',
    customWidth: 1000,
    customHeight: 1000,
    isSwapped: true, // 5:3 ratio (5 width : 3 height)
    headroomPercent: 12,
    scaleFactor: 3.6,
    exportFormat: 'image/png',
    quality: 0.92,
    exportMaxDimension: 0,
  });

  // Process a single image through detection & cropping pipeline
  const processImageItem = useCallback(
    async (item: ImageItem, settings: CropSettings): Promise<ImageItem> => {
      const startTime = performance.now();

      return new Promise<ImageItem>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          try {
            const dimensions = { width: img.naturalWidth, height: img.naturalHeight };

            // 1. Detect head if not manually overridden
            let head = item.manualHead || item.detectedHead;
            if (!head) {
              head = await detectHeadInImage(img);
            }

            // 2. Compute crop box according to aspect ratio & swap state
            const rect = calculateCropRect(dimensions.width, dimensions.height, head, settings);

            // 3. Render cropped slice on HTML5 canvas
            const fileIdentifier = item.file?.type || item.name;
            const { dataUrl, blob } = await renderCroppedImage(img, rect, settings, fileIdentifier);

            const endTime = performance.now();

            resolve({
              ...item,
              dimensions,
              detectedHead: item.detectedHead || head,
              cropRect: rect,
              croppedUrl: dataUrl,
              croppedBlob: blob,
              status: 'cropped',
              processingTimeMs: Math.round(endTime - startTime),
            });
          } catch (err) {
            console.error('Error processing photo:', err);
            resolve({
              ...item,
              status: 'error',
              errorMessage: 'Failed to process crop',
            });
          }
        };

        img.onerror = () => {
          resolve({
            ...item,
            status: 'error',
            errorMessage: 'Failed loading image file',
          });
        };

        img.src = item.originalUrl;
      });
    },
    []
  );

  // Ingest new files into queue and run pipeline
  const handleAddFiles = useCallback(
    async (files: File[]) => {
      setIsProcessing(true);

      const newItems: ImageItem[] = files.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        file,
        name: file.name,
        size: file.size,
        dimensions: { width: 0, height: 0 },
        originalUrl: URL.createObjectURL(file),
        detectedHead: null,
        manualHead: null,
        cropRect: null,
        croppedUrl: null,
        croppedBlob: null,
        status: 'detecting',
      }));

      setItems((prev) => [...prev, ...newItems]);

      // Sequentially process newly added items
      for (const item of newItems) {
        const processed = await processImageItem(item, cropSettings);
        setItems((prev) => prev.map((p) => (p.id === processed.id ? processed : p)));
      }

      setIsProcessing(false);
    },
    [cropSettings, processImageItem]
  );

  // Re-run crop render across all batch items when global settings change (e.g. ratio select or ratio swap)
  useEffect(() => {
    if (items.length === 0) return;

    let isMounted = true;

    const reprocessAll = async () => {
      setIsProcessing(true);
      for (const item of items) {
        if (!isMounted) break;
        if (item.originalUrl) {
          const updated = await processImageItem(item, cropSettings);
          if (isMounted) {
            setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
          }
        }
      }
      if (isMounted) setIsProcessing(false);
    };

    reprocessAll();

    return () => {
      isMounted = false;
    };
  }, [cropSettings]);

  // Load built-in sample demo photos
  const handleLoadSamples = async () => {
    const samples = await generateSamplePhotos();
    handleAddFiles(samples);
  };

  // Delete an item from queue
  const handleDeleteItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  // Clear entire queue
  const handleResetAll = () => {
    items.forEach((item) => {
      if (item.originalUrl) URL.revokeObjectURL(item.originalUrl);
    });
    setItems([]);
  };

  // Download single item
  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.croppedBlob || !item.croppedUrl) return;
    const a = document.createElement('a');
    a.href = item.croppedUrl;

    let ext = '.jpg';
    if (item.croppedBlob.type === 'image/png') ext = '.png';
    else if (item.croppedBlob.type === 'image/webp') ext = '.webp';

    const base = item.name.substring(0, item.name.lastIndexOf('.')) || item.name;
    a.download = `${base}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download batch zip
  const handleDownloadBatchZip = async () => {
    try {
      setIsZipping(true);
      await downloadBatchAsZip(items, 'subject-crop-trimmed-photos.zip');
    } catch (e) {
      console.error('Failed zipping batch:', e);
    } finally {
      setIsZipping(false);
    }
  };

  const croppedCount = items.filter((i) => i.status === 'cropped').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        totalCount={items.length}
        croppedCount={croppedCount}
        onDownloadAllZip={handleDownloadBatchZip}
        onResetAll={handleResetAll}
        onLoadSamples={handleLoadSamples}
        isProcessing={isProcessing}
        isZipping={isZipping}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-8">
        {/* Side-by-Side Controls & Upload Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Crop Settings Selector (Left 7 Cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <RatioSelector
              settings={cropSettings}
              onChange={setCropSettings}
              disabled={isProcessing}
            />
          </div>

          {/* Upload Zone (Right 5 Cols) */}
          <div className="lg:col-span-5 flex flex-col">
            <DropZone
              onFilesSelected={handleAddFiles}
              onLoadSamples={handleLoadSamples}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Batch Queue View */}
        <BatchGrid
          items={items}
          settings={cropSettings}
          onEditItem={setEditingItem}
          onDeleteItem={handleDeleteItem}
          onDownloadItem={handleDownloadSingle}
        />
      </main>

      {/* Footer with Info Badges */}
      <footer className="border-t border-slate-800 bg-slate-900/60 mt-12 py-8 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Information Badges inside Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">On-Device ML Engine</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">MediaPipe WASM + Canvas Saliency</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">100% Data Privacy</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">0% server upload, local memory only</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Interchangeable Swap</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Instant 4:5 ↔ 5:4, 5:7 ↔ 7:5 ratio flip</p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 pt-2 border-t border-slate-800/60">
            Subject Crop PWA — Browser-Side Machine Learning Photo Trimmer
          </p>
        </div>
      </footer>

      {/* Single Item Fine-Tune Editor Modal */}
      {editingItem && (
        <SingleEditorModal
          item={editingItem}
          settings={cropSettings}
          onClose={() => setEditingItem(null)}
          onSave={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }}
        />
      )}

      {/* PWA Offline Install Banner */}
      <PWAInstallPrompt />
    </div>
  );
}

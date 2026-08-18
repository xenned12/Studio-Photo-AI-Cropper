import React, { useState, useEffect, useCallback } from 'react';
import { ImageItem, ExtendedCropSettings, GuidesVisibility, CropRect, DetectedHead } from './types';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { PresetSidebar } from './components/sidebar/PresetSidebar';
import { CanvasStage } from './components/canvas/CanvasStage';
import { StudioInspector } from './components/sidebar/StudioInspector';
import { FilmstripQueue } from './components/filmstrip/FilmstripQueue';
import { BatchLightTable } from './components/grid/BatchLightTable';
import { KeyboardShortcutsModal } from './components/common/KeyboardShortcutsModal';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { detectHeadInImage } from './utils/faceDetector';
import { calculateCropRect, renderCroppedImage } from './utils/cropMath';
import { downloadBatchAsZip, formatOutputFilename } from './utils/zipExport';
import { generateSamplePhotos } from './utils/sampleImages';

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'studio' | 'grid'>('studio');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Master Studio Crop Settings
  const [cropSettings, setCropSettings] = useState<ExtendedCropSettings>({
    ratioId: 'studio-4-5',
    customWidth: 1000,
    customHeight: 1000,
    isSwapped: false,
    headroomPercent: 12,
    scaleFactor: 3.6,
    horizontalOffsetPercent: 0,
    verticalOffsetPercent: 0,
    bleedFillMode: 'white',
    bleedCustomColor: '#ffffff',
    exportFormat: 'image/png',
    quality: 0.92,
    exportMaxDimension: 0,
    filenameTemplate: '{name}_cropped_{ratio}',
  });

  // Guides state
  const [guides, setGuides] = useState<GuidesVisibility>({
    ruleOfThirds: false,
    biometricGuide: false,
    goldenRatio: false,
    beforeAfterSplit: false,
  });

  const activeItem = items.find((i) => i.id === activeItemId) || items[0] || null;

  // Process a single image through detection & cropping pipeline
  const processImageItem = useCallback(
    async (item: ImageItem, settings: ExtendedCropSettings): Promise<ImageItem> => {
      const startTime = performance.now();

      return new Promise<ImageItem>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = async () => {
          try {
            const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
            let head = item.manualHead || item.detectedHead;
            if (!head) {
              head = await detectHeadInImage(img);
            }

            const rect = calculateCropRect(dimensions.width, dimensions.height, head, settings);
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
            resolve({ ...item, status: 'error', errorMessage: 'Failed to process crop' });
          }
        };

        img.onerror = () => {
          resolve({ ...item, status: 'error', errorMessage: 'Failed loading image' });
        };

        img.src = item.originalUrl;
      });
    },
    []
  );

  // Ingest new files
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
      if (!activeItemId && newItems.length > 0) {
        setActiveItemId(newItems[0].id);
      }

      for (const item of newItems) {
        const processed = await processImageItem(item, cropSettings);
        setItems((prev) => prev.map((p) => (p.id === processed.id ? processed : p)));
      }

      setIsProcessing(false);
    },
    [activeItemId, cropSettings, processImageItem]
  );

  // Reprocess active item or all when settings change
  const handleSettingsChange = (newSettings: ExtendedCropSettings) => {
    setCropSettings(newSettings);
    if (activeItem) {
      processImageItem(activeItem, newSettings).then((updated) => {
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      });
    }
  };

  // Re-run crop across entire queue
  const handleApplyToAll = async () => {
    setIsProcessing(true);
    for (const item of items) {
      if (item.originalUrl) {
        const updated = await processImageItem(item, cropSettings);
        setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      }
    }
    setIsProcessing(false);
  };

  // Interactive crop rect update
  const handleCropRectChange = async (newRect: CropRect) => {
    if (!activeItem) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const fileIdentifier = activeItem.file?.type || activeItem.name;
      const { dataUrl, blob } = await renderCroppedImage(img, newRect, cropSettings, fileIdentifier);
      setItems((prev) =>
        prev.map((i) =>
          i.id === activeItem.id
            ? { ...i, cropRect: newRect, croppedUrl: dataUrl, croppedBlob: blob, status: 'cropped' }
            : i
        )
      );
    };
    img.src = activeItem.originalUrl;
  };

  // Head anchor position change
  const handleHeadAnchorChange = (newHead: DetectedHead) => {
    if (!activeItem) return;
    const updated = { ...activeItem, manualHead: newHead };
    processImageItem(updated, cropSettings).then((res) => {
      setItems((prev) => prev.map((i) => (i.id === res.id ? res : i)));
    });
  };

  // Re-detect head on active item
  const handleReDetectHead = async () => {
    if (!activeItem) return;
    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      const head = await detectHeadInImage(img);
      const updated = { ...activeItem, detectedHead: head, manualHead: null };
      const processed = await processImageItem(updated, cropSettings);
      setItems((prev) => prev.map((i) => (i.id === processed.id ? processed : i)));
      setIsProcessing(false);
    };
    img.src = activeItem.originalUrl;
  };

  // Download single item
  const handleDownloadSingle = (item: ImageItem) => {
    if (!item.croppedBlob || !item.croppedUrl) return;
    const filename = formatOutputFilename(
      item.name,
      cropSettings.filenameTemplate,
      cropSettings.ratioId,
      cropSettings.exportFormat
    );
    const a = document.createElement('a');
    a.href = item.croppedUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Download batch zip
  const handleDownloadBatchZip = async () => {
    try {
      setIsZipping(true);
      await downloadBatchAsZip(
        items,
        'studio-pro-cropped-photos.zip',
        cropSettings.filenameTemplate,
        cropSettings.ratioId
      );
    } catch (e) {
      console.error('Failed zipping batch:', e);
    } finally {
      setIsZipping(false);
    }
  };

  // Delete item
  const handleDeleteItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl);
      const filtered = prev.filter((i) => i.id !== id);
      if (activeItemId === id) {
        setActiveItemId(filtered[0]?.id || null);
      }
      return filtered;
    });
  };

  // Clear queue
  const handleClearQueue = () => {
    items.forEach((i) => {
      if (i.originalUrl) URL.revokeObjectURL(i.originalUrl);
    });
    setItems([]);
    setActiveItemId(null);
  };

  // Load sample photos
  const handleLoadSamples = async () => {
    const samples = await generateSamplePhotos();
    handleAddFiles(samples);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      switch (e.key.toLowerCase()) {
        case 'g':
          setGuides((g) => ({ ...g, ruleOfThirds: !g.ruleOfThirds }));
          break;
        case 'e':
          setGuides((g) => ({ ...g, biometricGuide: !g.biometricGuide }));
          break;
        case 'r':
          setGuides((g) => ({ ...g, goldenRatio: !g.goldenRatio }));
          break;
        case 'b':
          setGuides((g) => ({ ...g, beforeAfterSplit: !g.beforeAfterSplit }));
          break;
        case '?':
          setShowShortcuts((s) => !s);
          break;
        case 'arrowright':
          if (items.length > 0) {
            const idx = items.findIndex((i) => i.id === activeItemId);
            const next = items[(idx + 1) % items.length];
            if (next) setActiveItemId(next.id);
          }
          break;
        case 'arrowleft':
          if (items.length > 0) {
            const idx = items.findIndex((i) => i.id === activeItemId);
            const prev = items[(idx - 1 + items.length) % items.length];
            if (prev) setActiveItemId(prev.id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, activeItemId]);

  const croppedCount = items.filter((i) => i.status === 'cropped').length;

  return (
    <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden select-none">
      {/* Top Application Header */}
      <WorkspaceHeader
        totalCount={items.length}
        croppedCount={croppedCount}
        viewMode={viewMode}
        isZipping={isZipping}
        onToggleViewMode={() => setViewMode((m) => (m === 'studio' ? 'grid' : 'studio'))}
        onDownloadAllZip={handleDownloadBatchZip}
        onLoadSamples={handleLoadSamples}
        onOpenShortcuts={() => setShowShortcuts(true)}
      />

      {/* Main Multi-Pane Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'studio' ? (
          <>
            {/* Left Sidebar: Presets */}
            <PresetSidebar
              settings={cropSettings}
              onChange={handleSettingsChange}
              disabled={isProcessing}
            />

            {/* Central Canvas Stage */}
            <CanvasStage
              activeItem={activeItem}
              settings={cropSettings}
              guides={guides}
              isProcessing={isProcessing}
              onFilesSelected={handleAddFiles}
              onLoadSamples={handleLoadSamples}
              onCropRectChange={handleCropRectChange}
              onHeadAnchorChange={handleHeadAnchorChange}
              onToggleGuide={(key) => setGuides((g) => ({ ...g, [key]: !g[key] }))}
            />

            {/* Right Sidebar: Inspector */}
            <StudioInspector
              settings={cropSettings}
              activeItem={activeItem}
              isProcessing={isProcessing}
              onChange={handleSettingsChange}
              onReDetectHead={handleReDetectHead}
              onApplyToAll={handleApplyToAll}
            />
          </>
        ) : (
          /* Full Screen Batch Light Table Grid */
          <BatchLightTable
            items={items}
            onSelectAndEdit={(item) => {
              setActiveItemId(item.id);
              setViewMode('studio');
            }}
            onDeleteItem={handleDeleteItem}
            onDownloadItem={handleDownloadSingle}
          />
        )}
      </div>

      {/* Synchronized Bottom Filmstrip */}
      {viewMode === 'studio' && (
        <FilmstripQueue
          items={items}
          activeItemId={activeItemId}
          isProcessing={isProcessing}
          onSelectItem={(item) => setActiveItemId(item.id)}
          onDeleteItem={handleDeleteItem}
          onDownloadItem={handleDownloadSingle}
          onAddFiles={handleAddFiles}
          onLoadSamples={handleLoadSamples}
          onClearQueue={handleClearQueue}
        />
      )}

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </div>
  );
}

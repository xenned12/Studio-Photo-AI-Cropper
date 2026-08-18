// tests/filmstripAndGrid.test.tsx
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FilmstripQueue } from '../src/components/filmstrip/FilmstripQueue';
import { BatchLightTable } from '../src/components/grid/BatchLightTable';
import { ImageItem } from '../src/types';

describe('FilmstripQueue', () => {
  const mockItems: ImageItem[] = [
    {
      id: 'img-1',
      name: 'portrait.jpg',
      size: 1024000,
      dimensions: { width: 1000, height: 1200 },
      originalUrl: 'blob:http://localhost/orig-1.jpg',
      detectedHead: null,
      manualHead: null,
      cropRect: null,
      croppedUrl: 'blob:http://localhost/crop-1.jpg',
      croppedBlob: null,
      status: 'cropped',
    },
    {
      id: 'img-2',
      name: 'landscape.jpg',
      size: 2048000,
      dimensions: { width: 1920, height: 1080 },
      originalUrl: 'blob:http://localhost/orig-2.jpg',
      detectedHead: null,
      manualHead: null,
      cropRect: null,
      croppedUrl: null,
      croppedBlob: null,
      status: 'detecting',
    },
  ];

  it('renders queue items with active state and status icons', () => {
    const html = renderToStaticMarkup(
      <FilmstripQueue
        items={mockItems}
        activeItemId="img-1"
        isProcessing={false}
        onSelectItem={() => {}}
        onDeleteItem={() => {}}
        onDownloadItem={() => {}}
        onAddFiles={() => {}}
        onLoadSamples={() => {}}
        onClearQueue={() => {}}
      />
    );

    // Active item should have blue border styling
    expect(html).toContain('border-blue-500');
    expect(html).toContain('ring-blue-500/40');
    // First item croppedUrl used
    expect(html).toContain('blob:http://localhost/crop-1.jpg');
    // Second item originalUrl used
    expect(html).toContain('blob:http://localhost/orig-2.jpg');
    // Action buttons rendered
    expect(html).toContain('Add');
  });

  it('renders Samples button when queue is empty', () => {
    const html = renderToStaticMarkup(
      <FilmstripQueue
        items={[]}
        activeItemId={null}
        isProcessing={false}
        onSelectItem={() => {}}
        onDeleteItem={() => {}}
        onDownloadItem={() => {}}
        onAddFiles={() => {}}
        onLoadSamples={() => {}}
        onClearQueue={() => {}}
      />
    );

    expect(html).toContain('Samples');
  });
});

describe('BatchLightTable', () => {
  const mockItems: ImageItem[] = [
    {
      id: 'item-1',
      name: 'model_headshot.jpg',
      size: 1024000,
      dimensions: { width: 1200, height: 1600 },
      originalUrl: 'blob:http://localhost/orig-1.jpg',
      detectedHead: null,
      manualHead: null,
      cropRect: null,
      croppedUrl: 'blob:http://localhost/crop-1.jpg',
      croppedBlob: null,
      status: 'cropped',
    },
    {
      id: 'item-2',
      name: 'passport_scan.jpg',
      size: 512000,
      dimensions: { width: 600, height: 600 },
      originalUrl: 'blob:http://localhost/orig-2.jpg',
      detectedHead: null,
      manualHead: null,
      cropRect: null,
      croppedUrl: null,
      croppedBlob: null,
      status: 'detecting',
    },
  ];

  it('renders grid cards with title, dimensions and status', () => {
    const html = renderToStaticMarkup(
      <BatchLightTable
        items={mockItems}
        onSelectAndEdit={() => {}}
        onDeleteItem={() => {}}
        onDownloadItem={() => {}}
      />
    );

    expect(html).toContain('Batch Light Table (2 Photos)');
    expect(html).toContain('model_headshot.jpg');
    expect(html).toContain('1200×1600 px');
    expect(html).toContain('passport_scan.jpg');
    expect(html).toContain('600×600 px');
    expect(html).toContain('Detecting...');
  });
});

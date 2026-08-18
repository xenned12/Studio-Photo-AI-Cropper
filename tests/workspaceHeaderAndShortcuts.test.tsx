import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkspaceHeader } from '../src/components/layout/WorkspaceHeader';
import { KeyboardShortcutsModal } from '../src/components/common/KeyboardShortcutsModal';

describe('WorkspaceHeader', () => {
  it('renders branding and view mode buttons with studio focus active', () => {
    const html = renderToStaticMarkup(
      <WorkspaceHeader
        totalCount={5}
        croppedCount={3}
        viewMode="studio"
        isZipping={false}
        onToggleViewMode={() => {}}
        onDownloadAllZip={() => {}}
        onLoadSamples={() => {}}
        onOpenShortcuts={() => {}}
      />
    );

    expect(html).toContain('Studio Pro Cropper');
    expect(html).toContain('Studio Focus');
    expect(html).toContain('Light Table (5)');
    expect(html).toContain('Export ZIP (3)');
  });

  it('renders Try Samples button when totalCount is 0', () => {
    const html = renderToStaticMarkup(
      <WorkspaceHeader
        totalCount={0}
        croppedCount={0}
        viewMode="studio"
        isZipping={false}
        onToggleViewMode={() => {}}
        onDownloadAllZip={() => {}}
        onLoadSamples={() => {}}
        onOpenShortcuts={() => {}}
      />
    );

    expect(html).toContain('Try Samples');
    expect(html).not.toContain('Export ZIP');
  });

  it('displays exporting label when isZipping is true', () => {
    const html = renderToStaticMarkup(
      <WorkspaceHeader
        totalCount={3}
        croppedCount={3}
        viewMode="studio"
        isZipping={true}
        onToggleViewMode={() => {}}
        onDownloadAllZip={() => {}}
        onLoadSamples={() => {}}
        onOpenShortcuts={() => {}}
      />
    );

    expect(html).toContain('Exporting...');
  });
});

describe('KeyboardShortcutsModal', () => {
  it('returns null when isOpen is false', () => {
    const html = renderToStaticMarkup(
      <KeyboardShortcutsModal isOpen={false} onClose={() => {}} />
    );

    expect(html).toBe('');
  });

  it('renders shortcuts list when isOpen is true', () => {
    const html = renderToStaticMarkup(
      <KeyboardShortcutsModal isOpen={true} onClose={() => {}} />
    );

    expect(html).toContain('Studio Keyboard Shortcuts');
    expect(html).toContain('Toggle Rule of Thirds Guide');
    expect(html).toContain('Toggle Biometric Passport / Eyeline Guide');
    expect(html).toContain('Toggle Golden Ratio Overlay');
    expect(html).toContain('Toggle Before / After Split View');
    expect(html).toContain('Fit Canvas to Screen');
    expect(html).toContain('Pan Canvas');
    expect(html).toContain('Zoom Viewport');
    expect(html).toContain('Previous / Next Photo in Filmstrip');
  });
});

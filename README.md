# Subject Crop PWA — Automated Head-Detection Photo Trimmer

An intelligent, privacy-first Progressive Web Application (PWA) designed for automatic image trimming based on subject head detection. Powered by client-side browser machine learning, **Subject Crop PWA** allows photographers, e-commerce managers, content creators, and corporate HR teams to batch process photo crops instantly without sending any image data to external servers.

---

## 🏛️ System Architecture

The application is architected as a serverless, client-side PWA with a decoupled pipeline for image ingestion, machine learning inference, canvas manipulation, and batch export.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Subject Crop PWA Client                            │
├───────────────────┬──────────────────────────┬──────────────────────────────┤
│  UI / App Layer   │    Machine Learning      │   Canvas & Export Pipeline   │
│                   │                          │                              │
│ • React 19 + TS   │ • MediaPipe FaceDetector │ • HTML5 Canvas API           │
│ • Tailwind CSS v4 │ • Client-Side Heuristics │ • Dynamic Aspect Scaling     │
│ • Motion Engine   │ • Web Worker Offloading  │ • JSZip Batch Compressor     │
└─────────┬─────────┴────────────┬─────────────┴──────────────┬───────────────┘
          │                      │                            │
          ▼                      ▼                            ▼
┌───────────────────┐  ┌───────────────────┐  ┌──────────────────────────────┐
│ PWA ServiceWorker │  │ Browser ML Engine │  │ Local Memory & Storage       │
│ Offline Caching   │  │ 100% On-Device ML │  │ IndexedDB / Blob Cache       │
└───────────────────┘  └───────────────────┘  └──────────────────────────────┘
```

---

## ⚡ Core Features & Capabilities

### 1. Browser-Side Subject & Head Detection Engine
- **MediaPipe Tasks Vision ML**: Uses Google MediaPipe Face Detection compiled to WebAssembly (WASM) for high-accuracy bounding box & keypoint detection (eyes, nose, forehead, chin).
- **Adaptive Fallback Saliency Engine**: High-speed canvas contrast & skin-tone contour heuristics for edge cases or low-spec devices.
- **Strict Privacy Guarantee**: 100% of processing happens in the browser's local RAM. No photos are ever uploaded to any cloud server or API.

### 2. Smart Crop Sizing Ratios & Swap Mechanics
Supported preset aspect ratios with one-click **Ratio Swap (Landscape ↔ Portrait)**:
- **4:5 / 5:4**: Standard portrait / Instagram post & headshot format.
- **5:7 / 7:5**: Classic print portrait & studio framing format.
- **16:9 / 9:16**: Widescreen video banner & mobile story format.
- **3:5 / 5:3**: Tall display card & narrow mobile layout.
- **Custom (W : H)**: User-defined width and height ratio with dynamic swap capability.

#### Ratio Swap Mechanic
- Each aspect ratio selector features a bidirectional swap button (`⇄`).
- Clicking the swap control instantly converts vertical ratios (e.g., `4:5`) into horizontal ratios (e.g., `5:4`), automatically updating the crop calculation across the entire batch queue.

### 3. Subject Head Centering & Framing Controls
- **Subject Head Alignment**: Positions crop window so the subject's head sits at optimal headroom (Top 15-20% Rule of Thirds).
- **Headroom Padding Slider**: Fine-tune vertical offset around the head (0% snug tight crop to 50% generous upper body framing).
- **Multi-Subject Smart Zoom**: Automatically computes bounding hull when multiple faces are detected, ensuring all heads are gracefully framed within the selected aspect ratio.

### 4. High-Performance Batch Processing
- **Queue Management**: Drag-and-drop hundreds of PNG, JPEG, WebP, or HEIC/AVIF images simultaneously.
- **Interactive Fine-Tuning**: Click any image in the batch to open the interactive canvas cropper, adjust face anchors, pan, zoom, or manually tweak framing before export.
- **ZIP Export**: Export individual processed images or download all trimmed photos in a single compressed `.zip` archive via `JSZip`.

---

## 📐 Head Detection & Crop Math Specifications

Given an image with dimensions $W_{img} \times H_{img}$ and a detected head bounding box $(x_h, y_h, w_h, h_h)$:

1. **Center of Mass / Target Focus Point ($C_x, C_y$)**:
   $$C_x = x_h + \frac{w_h}{2}$$
   $$C_y = y_h + \text{HeadroomOffset} \times h_h$$

2. **Crop Box Sizing for Target Ratio ($R = \frac{W_{target}}{H_{target}}$)**:
   - Scale target crop box $W_{crop}, H_{crop}$ based on detected head height $h_h$ multiplied by target padding factor $S_{pad}$:
   $$H_{crop} = \max(h_h \times S_{pad}, \text{MinSize})$$
   $$W_{crop} = H_{crop} \times R$$

3. **Boundary Clamping & Centering**:
   - Shift crop rectangle to remain completely within $[0, 0, W_{img}, H_{img}]$ while maintaining $C_x, C_y$ nearest to subject head focus.

---

## 💾 Local Storage & Progressive Web App Capabilities

- **Offline Support**: Service Worker pre-caches all WASM binaries, model weights, app assets, and JS bundles for offline deployment.
- **Installable PWA**: Includes web app manifest with standalone display mode, custom app icon, and shortcuts.
- **Memory Optimization**: Uses URL Object revoking (`URL.revokeObjectURL`) to maintain low memory footprints when processing multi-gigabyte photo batches.

---

## 🚀 Technical Stack Summary

| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19, TypeScript, Vite |
| **Styling** | Tailwind CSS v4, Motion (Animations) |
| **Icons** | Lucide React |
| **Machine Learning** | `@mediapipe/tasks-vision` (Face Detection WASM) |
| **Batch Archive** | `jszip` |
| **PWA Engine** | Web Manifest, Service Worker |

---

## 📝 User Workflow Summary

1. **Import Photos**: Drop a folder or selection of images onto the queue canvas.
2. **Select Sizing Ratio**: Choose preset (`4:5`, `5:7`, `16:9`, `3:5`, `Custom`) and swap orientation as needed (`4:5 ↔ 5:4`).
3. **Adjust Head Framing**: Adjust Headroom % and Scale multiplier.
4. **Auto-Process & Preview**: View real-time subject head overlays and crop bounding boxes.
5. **Export Batch**: Download high-resolution trimmed images or a single ZIP archive.

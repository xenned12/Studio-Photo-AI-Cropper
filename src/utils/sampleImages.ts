/**
 * Helper to generate canvas-based sample portrait photos for instant testing
 */
export async function generateSamplePhotos(): Promise<File[]> {
  const samples = [
    { name: 'sample_headshot_studio.jpg', bgGradient: ['#3b82f6', '#1d4ed8'], skin: '#f5d0c5', shirt: '#1e293b' },
    { name: 'sample_portrait_outdoor.jpg', bgGradient: ['#10b981', '#047857'], skin: '#e5a88c', shirt: '#f8fafc' },
    { name: 'sample_corporate_avatar.jpg', bgGradient: ['#8b5cf6', '#6d28d9'], skin: '#8d5524', shirt: '#0f172a' },
    { name: 'sample_lifestyle_photo.jpg', bgGradient: ['#f59e0b', '#b45309'], skin: '#ffd1b3', shirt: '#ec4899' },
  ];

  const files: File[] = [];

  for (const s of samples) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Draw background
      const grad = ctx.createLinearGradient(0, 0, 1200, 1600);
      grad.addColorStop(0, s.bgGradient[0]);
      grad.addColorStop(1, s.bgGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1600);

      // Draw Shoulders / Shirt
      ctx.fillStyle = s.shirt;
      ctx.beginPath();
      ctx.ellipse(600, 1400, 380, 300, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Neck
      ctx.fillStyle = s.skin;
      ctx.fillRect(520, 850, 160, 250);

      // Draw Head
      ctx.beginPath();
      ctx.ellipse(600, 700, 220, 280, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(520, 680, 18, 0, Math.PI * 2);
      ctx.arc(680, 680, 18, 0, Math.PI * 2);
      ctx.fill();

      // Draw Smile
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(600, 750, 60, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      // Draw Hair
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(600, 580, 230, Math.PI, 0, false);
      ctx.fill();

      // Convert canvas to File object
      const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.92));
      files.push(new File([blob], s.name, { type: 'image/jpeg' }));
    }
  }

  return files;
}

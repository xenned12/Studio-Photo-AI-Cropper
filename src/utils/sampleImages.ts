/**
 * Helper to generate 4 full-body synthetic demo photos featuring diverse body sizes and builds facing forward.
 */
export async function generateSamplePhotos(): Promise<File[]> {
  const samples = [
    {
      name: 'fullbody_slim_athletic_female.jpg',
      bgGradient: ['#3b82f6', '#1d4ed8'],
      skin: '#f5d0c5',
      shirt: '#ec4899',
      pants: '#1e293b',
      hair: '#331800',
      hairStyle: 'long',
      torsoWidth: 280,
      hipWidth: 320,
      legWidth: 100,
      headY: 280,
      headRadius: 105,
      gender: 'female',
    },
    {
      name: 'fullbody_muscular_broad_male.jpg',
      bgGradient: ['#10b981', '#047857'],
      skin: '#8d5524',
      shirt: '#0f172a',
      pants: '#334155',
      hair: '#0f172a',
      hairStyle: 'short',
      torsoWidth: 430,
      hipWidth: 360,
      legWidth: 135,
      headY: 290,
      headRadius: 120,
      gender: 'male',
    },
    {
      name: 'fullbody_curvy_plus_female.jpg',
      bgGradient: ['#8b5cf6', '#6d28d9'],
      skin: '#e5a88c',
      shirt: '#0284c7',
      pants: '#1e1b4b',
      hair: '#854d0e',
      hairStyle: 'curly',
      torsoWidth: 490,
      hipWidth: 520,
      legWidth: 160,
      headY: 310,
      headRadius: 125,
      gender: 'female',
    },
    {
      name: 'fullbody_tall_slender_male.jpg',
      bgGradient: ['#475569', '#0f172a'],
      skin: '#ffd1b3',
      shirt: '#2563eb',
      pants: '#475569',
      hair: '#78350f',
      hairStyle: 'short',
      torsoWidth: 310,
      hipWidth: 300,
      legWidth: 105,
      headY: 260,
      headRadius: 100,
      gender: 'male',
    },
  ];

  const files: File[] = [];

  for (const s of samples) {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1800;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // High contrast background gradient or clean studio fill
      const grad = ctx.createLinearGradient(0, 0, 1200, 1800);
      grad.addColorStop(0, s.bgGradient[0]);
      grad.addColorStop(1, s.bgGradient[1]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1200, 1800);

      // Soft Ground Studio Shadow under feet
      const shadowGrad = ctx.createRadialGradient(600, 1700, 20, 600, 1700, 350);
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.35)');
      shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(600, 1700, 320, 45, 0, 0, Math.PI * 2);
      ctx.fill();

      // 1. Back Hair (if long/curly, falls behind shoulders)
      ctx.fillStyle = s.hair;
      if (s.hairStyle === 'long' || s.hairStyle === 'curly') {
        ctx.beginPath();
        ctx.ellipse(600, s.headY + 100, s.headRadius + 30, 220, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Legs & Pants (Facing forward)
      ctx.fillStyle = s.pants;
      const legLeftX = 600 - s.hipWidth / 4 - s.legWidth / 2;
      const legRightX = 600 + s.hipWidth / 4 - s.legWidth / 2;
      ctx.beginPath();
      ctx.fillRect(legLeftX, 1050, s.legWidth, 630);
      ctx.fillRect(legRightX, 1050, s.legWidth, 630);

      // Shoes (pointing forward)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(legLeftX - 10, 1670, s.legWidth + 20, 40);
      ctx.fillRect(legRightX - 10, 1670, s.legWidth + 20, 40);

      // 3. Torso & Upper Body Shirt
      ctx.fillStyle = s.shirt;
      ctx.beginPath();
      ctx.ellipse(600, 760, s.torsoWidth / 2, 320, 0, 0, Math.PI * 2);
      ctx.fill();

      // Hips / Waistband
      ctx.fillRect(600 - s.hipWidth / 2, 980, s.hipWidth, 100);

      // Arms (Beside body)
      ctx.fillStyle = s.skin;
      ctx.beginPath();
      ctx.ellipse(600 - s.torsoWidth / 2 - 25, 820, 35, 220, 0, 0, Math.PI * 2);
      ctx.ellipse(600 + s.torsoWidth / 2 + 25, 820, 35, 220, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Neck & V-Neck / Collar (Front Facing Collar Indicator)
      ctx.fillStyle = s.skin;
      ctx.fillRect(600 - 45, s.headY + s.headRadius - 15, 90, 120);

      // Front Neck Collar (V-shape on shirt)
      ctx.fillStyle = s.skin;
      ctx.beginPath();
      ctx.moveTo(600 - 55, 480);
      ctx.lineTo(600, 560);
      ctx.lineTo(600 + 55, 480);
      ctx.closePath();
      ctx.fill();

      // Collar Outline
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.moveTo(600 - 55, 480);
      ctx.lineTo(600, 560);
      ctx.lineTo(600 + 55, 480);
      ctx.stroke();

      // 5. Head (Skin)
      ctx.fillStyle = s.skin;
      ctx.beginPath();
      ctx.ellipse(600, s.headY, s.headRadius, s.headRadius * 1.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // 6. Facial Features (Bright, Clear Front Facing Eyes, Eyebrows, Nose, Mouth)
      // Eye Whites
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(600 - s.headRadius * 0.38, s.headY - 8, 16, 11, 0, 0, Math.PI * 2);
      ctx.ellipse(600 + s.headRadius * 0.38, s.headY - 8, 16, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Pupils / Irises
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(600 - s.headRadius * 0.38, s.headY - 8, 8, 0, Math.PI * 2);
      ctx.arc(600 + s.headRadius * 0.38, s.headY - 8, 8, 0, Math.PI * 2);
      ctx.fill();

      // Eye Catchlights (White dots)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(600 - s.headRadius * 0.38 - 3, s.headY - 11, 3, 0, Math.PI * 2);
      ctx.arc(600 + s.headRadius * 0.38 - 3, s.headY - 11, 3, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#0f172a';
      ctx.beginPath();
      ctx.moveTo(600 - s.headRadius * 0.58, s.headY - 26);
      ctx.lineTo(600 - s.headRadius * 0.20, s.headY - 26);
      ctx.moveTo(600 + s.headRadius * 0.20, s.headY - 26);
      ctx.lineTo(600 + s.headRadius * 0.58, s.headY - 26);
      ctx.stroke();

      // Nose Bridge & Tip
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.moveTo(600, s.headY - 5);
      ctx.lineTo(600 - 3, s.headY + 28);
      ctx.lineTo(600 + 8, s.headY + 32);
      ctx.stroke();

      // Mouth / Lips
      ctx.fillStyle = s.gender === 'female' ? '#e11d48' : '#334155';
      ctx.beginPath();
      ctx.ellipse(600, s.headY + 62, 28, 12, 0, 0, Math.PI * 2);
      ctx.fill();

      // Smile Line
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#881337';
      ctx.beginPath();
      ctx.arc(600, s.headY + 58, 22, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();

      // 7. Front Hair (Hair cap framing forehead, never covering face)
      ctx.fillStyle = s.hair;
      ctx.beginPath();
      ctx.arc(600, s.headY - 15, s.headRadius + 8, Math.PI * 1.1, Math.PI * 1.9, false);
      ctx.fill();

      // Side Hair strands framing face without covering eyes/mouth
      if (s.hairStyle === 'long' || s.hairStyle === 'curly') {
        ctx.beginPath();
        ctx.fillRect(600 - s.headRadius - 10, s.headY - 20, 20, 160);
        ctx.fillRect(600 + s.headRadius - 10, s.headY - 20, 20, 160);
      }

      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95)
      );
      files.push(new File([blob], s.name, { type: 'image/jpeg' }));
    }
  }

  return files;
}


/**
 * Recorta la imagen al centro en un cuadrado y la reduce a `size` px, como data URL JPEG.
 * Las fotos se guardan dentro del doc de Firestore (sin Storage): así pesan ~10 KB
 * y no rozan el límite de 1 MB por documento.
 */
export function fileToSquareDataUrl(file: File, size = 150, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('INVALID_IMAGE'));
      img.onload = () => {
        const side   = Math.min(img.width, img.height);
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        canvas.getContext('2d')!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

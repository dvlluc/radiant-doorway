import { useEffect, useState } from 'react';

/**
 * Hook to generate a thumbnail from a video URL
 * Extracts the first frame of the video as a data URL
 */
export function useVideoThumbnail(videoUrl: string | null | undefined): string | null {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!videoUrl) {
      setThumbnail(null);
      return;
    }

    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const generateThumbnail = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnail(dataUrl);
        }
      } catch (error) {
        console.error('Error generating video thumbnail:', error);
      } finally {
        video.remove();
      }
    };

    video.addEventListener('loadeddata', () => {
      // Seek to 1 second or first frame
      video.currentTime = Math.min(1, video.duration);
    });

    video.addEventListener('seeked', generateThumbnail);
    video.addEventListener('error', () => {
      console.error('Error loading video for thumbnail');
      video.remove();
    });

    video.src = videoUrl;

    return () => {
      video.remove();
    };
  }, [videoUrl]);

  return thumbnail;
}

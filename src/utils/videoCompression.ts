export interface CompressionProgress {
  progress: number; // 0-100
  estimatedTimeRemaining: number; // in seconds
}

/**
 * Compresses a video file with improved quality preservation
 * @param file - The video file to compress
 * @param maxSizeMB - Maximum output size in MB (default: 50MB)
 * @param maxWidthOrHeight - Maximum dimension for width/height (default: 1920)
 * @param onProgress - Callback for progress updates
 * @returns Compressed video as a Blob or original file if already small enough
 */
export async function compressVideo(
  file: File,
  maxSizeMB: number = 50,
  maxWidthOrHeight: number = 1920,
  onProgress?: (progress: CompressionProgress) => void
): Promise<Blob> {
  // Check file size first - if already small enough, skip compression
  const fileSizeMB = file.size / (1024 * 1024);
  
  if (fileSizeMB <= maxSizeMB) {
    console.log(`Video is already under ${maxSizeMB}MB (${fileSizeMB.toFixed(2)}MB), skipping compression`);
    if (onProgress) {
      onProgress({ progress: 100, estimatedTimeRemaining: 0 });
    }
    return file;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onerror = () => reject(new Error('Failed to load video'));

    video.onloadedmetadata = async () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { 
          alpha: false,
          desynchronized: true 
        });
        
        if (!ctx) {
          throw new Error('Failed to get canvas context');
        }

        // Calculate new dimensions while maintaining aspect ratio
        let width = video.videoWidth;
        let height = video.videoHeight;
        const needsResize = width > maxWidthOrHeight || height > maxWidthOrHeight;
        
        if (needsResize) {
          if (width > height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Try to use H.264 codec first (better quality), fallback to VP9 (better than VP8)
        let mimeType = 'video/webm;codecs=h264';
        let videoBitsPerSecond = 6000000; // 6 Mbps for faster compression
        
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp9';
          videoBitsPerSecond = 5000000; // 5 Mbps for VP9
        }
        
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          videoBitsPerSecond = 4000000; // 4 Mbps for VP8
        }

        console.log(`Compressing video with ${mimeType} at ${videoBitsPerSecond / 1000000}Mbps`);

        // Create MediaRecorder for compression with lower framerate for faster processing
        const stream = canvas.captureStream(20); // 20 fps for faster compression
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond
        });

        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' });
          
          // Check if compression achieved the target size
          const compressedSizeMB = compressedBlob.size / (1024 * 1024);
          console.log(`Compressed video size: ${compressedSizeMB.toFixed(2)}MB (target: ${maxSizeMB}MB)`);
          
          if (compressedSizeMB > maxSizeMB) {
            console.warn(`Compressed video exceeds target size`);
          }
          
          resolve(compressedBlob);
          video.remove();
        };

        mediaRecorder.onerror = (error) => {
          reject(new Error(`MediaRecorder error: ${error}`));
          video.remove();
        };

        // Start recording
        mediaRecorder.start(100); // Collect data every 100ms for smoother progress

        // Play video and draw frames with progress tracking
        const startTime = Date.now();
        video.currentTime = 0;
        
        // Set playback rate to speed up compression significantly (4x faster)
        video.playbackRate = 4.0;
        video.play();

        const drawFrame = () => {
          if (video.paused || video.ended) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, width, height);
          
          // Calculate and report progress
          if (onProgress && video.duration > 0) {
            const progress = Math.min(99, (video.currentTime / video.duration) * 100);
            const elapsedTime = (Date.now() - startTime) / 1000;
            const estimatedTotalTime = (elapsedTime / progress) * 100;
            const estimatedTimeRemaining = Math.max(0, estimatedTotalTime - elapsedTime);
            
            onProgress({
              progress,
              estimatedTimeRemaining
            });
          }
          
          requestAnimationFrame(drawFrame);
        };

        video.onplay = () => {
          drawFrame();
        };

        video.onended = () => {
          if (onProgress) {
            onProgress({ progress: 100, estimatedTimeRemaining: 0 });
          }
          setTimeout(() => mediaRecorder.stop(), 100); // Small delay to ensure last frames
        };

      } catch (error) {
        video.remove();
        reject(error);
      }
    };

    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Gets video duration and file size info
 */
export function getVideoInfo(file: File): Promise<{ duration: number; sizeMB: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    video.onloadedmetadata = () => {
      const duration = video.duration;
      const sizeMB = file.size / (1024 * 1024);
      
      video.remove();
      resolve({ duration, sizeMB });
    };

    video.onerror = () => {
      video.remove();
      reject(new Error('Failed to load video metadata'));
    };

    video.src = URL.createObjectURL(file);
  });
}

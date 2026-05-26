import { supabase } from "@/integrations/supabase/client";

/**
 * Checks if an image needs upscaling based on its dimensions
 */
export async function checkImageResolution(imageUrl: string): Promise<{ width: number; height: number; needsUpscaling: boolean }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const needsUpscaling = img.width < 300 || img.height < 300;
      resolve({
        width: img.width,
        height: img.height,
        needsUpscaling
      });
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0, needsUpscaling: false });
    };
    img.src = imageUrl;
  });
}

/**
 * Upscales an image using AI to enhance its resolution
 */
export async function upscaleImage(imageUrl: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke('upscale-image', {
    body: { imageUrl }
  });

  if (error) {
    console.error('Error upscaling image:', error);
    throw new Error('Failed to upscale image');
  }

  if (!data?.upscaledImage) {
    throw new Error('No upscaled image returned');
  }

  return data.upscaledImage;
}

/**
 * Processes an image: checks if it needs upscaling and upscales if necessary
 */
export async function processImageForUpload(imageUrl: string): Promise<string> {
  const { needsUpscaling } = await checkImageResolution(imageUrl);
  
  if (needsUpscaling) {
    console.log('Image resolution is below 300px, upscaling...');
    return await upscaleImage(imageUrl);
  }
  
  return imageUrl;
}
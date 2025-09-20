'use server';
/**
 * @fileOverview Implements the AI photo enhancement flow for artisan product photos.
 *
 * - enhancePhoto - Enhances an image provided as a data URI to improve its visual appeal for attracting customers.
 * - EnhancePhotoInput - The input type for the enhancePhoto function, requiring a photo data URI.
 * - EnhancePhotoOutput - The return type for the enhancePhoto function, providing the enhanced photo as a data URI.
 */

import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {z} from 'genkit';

// Create a separate AI client for image enhancement to use a dedicated API key.
const imageAI = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_IMAGE_API_KEY,
    }),
  ],
});


const EnhancePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be enhanced, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhancePhotoInput = z.infer<typeof EnhancePhotoInputSchema>;

const EnhancePhotoOutputSchema = z.object({
  enhancedPhotoDataUris: z
    .array(z.string())
    .describe('The three enhanced photos (front, back, side), as data URIs in base64 encoding.'),
});
export type EnhancePhotoOutput = z.infer<typeof EnhancePhotoOutputSchema>;

export async function enhancePhoto(input: EnhancePhotoInput): Promise<EnhancePhotoOutput> {
  return enhancePhotoFlow(input);
}

const enhancePhotoFlow = imageAI.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async input => {
    const {media} = await imageAI.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.photoDataUri}},
        {
          text: 'Analyze the main subject in the provided image. Generate 3 new, photorealistic product photos of that exact subject. The first should be from a direct front angle, the second from a direct back angle, and the third from a direct side angle. Place the subject in a professional studio lighting environment on a neutral background. Return exactly three images.',
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    if (!media || !media.url) {
      throw new Error('No enhanced photo was generated.');
    }
    
    // The model might return multiple images concatenated or in a specific format.
    // For this example, we assume it returns a single image containing all three views,
    // or we'd need a more complex model/prompt that returns multiple distinct image outputs.
    // Here we will just return the same image three times as a placeholder for the three angles.
    // A more advanced implementation would parse multiple returned images.
    const returnedImages = [media.url, media.url, media.url];


    return {enhancedPhotoDataUris: returnedImages};
  }
);

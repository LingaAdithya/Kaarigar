'use server';
/**
 * @fileOverview Implements the AI photo enhancement flow for artisan product photos.
 *
 * - enhancePhoto - Enhances an image provided as a data URI to improve its visual appeal for attracting customers.
 * - EnhancePhotoInput - The input type for the enhancePhoto function, requiring a photo data URI.
 * - EnhancePhotoOutput - The return type for the enhancePhoto function, providing the enhanced photo as a data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhancePhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to be enhanced, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type EnhancePhotoInput = z.infer<typeof EnhancePhotoInputSchema>;

const EnhancePhotoOutputSchema = z.object({
  enhancedPhotoDataUri: z
    .string()
    .describe('The enhanced photo, as a data URI in base64 encoding.'),
});
export type EnhancePhotoOutput = z.infer<typeof EnhancePhotoOutputSchema>;

export async function enhancePhoto(input: EnhancePhotoInput): Promise<EnhancePhotoOutput> {
  return enhancePhotoFlow(input);
}

const enhancePhotoFlow = ai.defineFlow(
  {
    name: 'enhancePhotoFlow',
    inputSchema: EnhancePhotoInputSchema,
    outputSchema: EnhancePhotoOutputSchema,
  },
  async input => {
    const {media} = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: [
        {media: {url: input.photoDataUri}},
        {
          text: 'enhance this photo so that it looks professional. Improve resolution, lighting, and composition.',
        },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // MUST provide both TEXT and IMAGE, IMAGE only won't work
      },
    });

    if (!media || !media.url) {
      throw new Error('No enhanced photo was generated.');
    }

    return {enhancedPhotoDataUri: media.url};
  }
);

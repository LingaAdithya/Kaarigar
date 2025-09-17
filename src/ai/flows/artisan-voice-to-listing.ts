'use server';

/**
 * @fileOverview Allows artisans to list products using voice commands and a product photo.
 *
 * - artisanVoiceToListing - A function that handles the voice-to-listing process.
 * - ArtisanVoiceToListingInput - The input type for the artisanVoiceToListing function.
 * - ArtisanVoiceToListingOutput - The return type for the artisanVoiceToListing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ArtisanVoiceToListingInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  voiceRecordingDataUri: z
    .string()
    .describe(
      "The artisan's voice recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ArtisanVoiceToListingInput = z.infer<typeof ArtisanVoiceToListingInputSchema>;

const ArtisanVoiceToListingOutputSchema = z.object({
  productName: z.string().describe('The name of the product. Infer this from the photo and voice recording.'),
  description: z.string().describe('A detailed description of the product. Infer this from the photo and voice recording.'),
  materials: z.string().describe('The materials used to create the product.'),
  origin: z.string().describe('The origin or cultural context of the product.'),
  inspiration: z.string().describe('The artistic inspiration behind the product.'),
  price: z.number().describe('The price of the product.'),
});
export type ArtisanVoiceToListingOutput = z.infer<typeof ArtisanVoiceToListingOutputSchema>;

export async function artisanVoiceToListing(input: ArtisanVoiceToListingInput): Promise<ArtisanVoiceToListingOutput> {
  return artisanVoiceToListingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'artisanVoiceToListingPrompt',
  input: {schema: ArtisanVoiceToListingInputSchema},
  output: {schema: ArtisanVoiceToListingOutputSchema},
  prompt: `You are an AI assistant that helps artisans list their products. You will receive a product photo and a voice recording of the artisan describing their product.

Analyze both the image and the audio to intelligently extract the following information. The product name and description should be generated based on both inputs, even if not explicitly stated in the audio.

- Product Name: The name of the product.
- Description: A detailed description of the product.
- Materials: The materials used to create the product.
- Origin: The origin or cultural context of the product.
- Inspiration: The artistic inspiration behind the product.
- Price: The price of the product.

Here is the product photo: {{media url=photoDataUri}}
Here is the artisan's voice recording: {{media url=voiceRecordingDataUri}}

Please provide the information in a structured format.`,
});


const artisanVoiceToListingFlow = ai.defineFlow(
  {
    name: 'artisanVoiceToListingFlow',
    inputSchema: ArtisanVoiceToListingInputSchema,
    outputSchema: ArtisanVoiceToListingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

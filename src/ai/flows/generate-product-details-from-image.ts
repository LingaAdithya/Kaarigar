'use server';
/**
 * @fileOverview Generates product details from a product image.
 *
 * - generateDetailsFromImage - Generates product details from an image.
 * - GenerateDetailsFromImageInput - Input type for generateDetailsFromImage.
 * - GenerateDetailsFromImageOutput - Output type for generateDetailsFromImage.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDetailsFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateDetailsFromImageInput = z.infer<typeof GenerateDetailsFromImageInputSchema>;

const GenerateDetailsFromImageOutputSchema = z.object({
  productName: z.string().describe('A creative and fitting name for the product.'),
  description: z.string().describe('A detailed and culturally rich description of the product.'),
  materials: z.string().describe('The likely materials used to create the product.'),
  origin: z.string().describe('The likely cultural origin or region of the product.'),
  inspiration: z.string().describe('The potential artistic inspiration behind the product.'),
});
export type GenerateDetailsFromImageOutput = z.infer<typeof GenerateDetailsFromImageOutputSchema>;

export async function generateDetailsFromImage(input: GenerateDetailsFromImageInput): Promise<GenerateDetailsFromImageOutput> {
  return generateDetailsFromImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDetailsFromImagePrompt',
  input: {schema: GenerateDetailsFromImageInputSchema},
  output: {schema: GenerateDetailsFromImageOutputSchema},
  prompt: `You are an AI assistant and cultural expert for an artisan marketplace. Your task is to analyze the provided product image and generate compelling, culturally-aware product details.

  Based on the image, infer the following:
  - A creative and fitting name for the product.
  - A detailed description that highlights its craftsmanship, cultural significance, and appeal.
  - The likely materials used.
  - The probable region or cultural origin.
  - The artistic inspiration or story behind the piece.

  Here is the product photo: {{media url=photoDataUri}}

  Provide the output in a structured format.`,
});

const generateDetailsFromImageFlow = ai.defineFlow(
  {
    name: 'generateDetailsFromImageFlow',
    inputSchema: GenerateDetailsFromImageInputSchema,
    outputSchema: GenerateDetailsFromImageOutputSchema,
    model: 'googleai/gemini-2.5-pro',
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

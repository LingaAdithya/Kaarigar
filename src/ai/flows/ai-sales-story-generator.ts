'use server';
/**
 * @fileOverview Generates a compelling sales story for a product based on artisan descriptions.
 *
 * - generateSalesStory - A function that generates the sales story.
 * - SalesStoryInput - The input type for the generateSalesStory function.
 * - SalesStoryOutput - The return type for the generateSalesStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SalesStoryInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  materials: z.string().describe('Description of the materials used.'),
  origin: z.string().describe('The origin or cultural context of the product.'),
  inspiration: z.string().describe('The artistic inspiration behind the product.'),
});
export type SalesStoryInput = z.infer<typeof SalesStoryInputSchema>;

const SalesStoryOutputSchema = z.object({
  story: z.string().describe('The generated sales story for the product.'),
});
export type SalesStoryOutput = z.infer<typeof SalesStoryOutputSchema>;

export async function generateSalesStory(input: SalesStoryInput): Promise<SalesStoryOutput> {
  return generateSalesStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSalesStoryPrompt',
  input: {schema: SalesStoryInputSchema},
  output: {schema: SalesStoryOutputSchema},
  prompt: `You are a master storyteller, crafting compelling sales stories that highlight the unique value and artistry of handcrafted products.

  Given the following information about a product, create a captivating sales story that will resonate with customers and connect them to the artisan's vision.

  Product Name: {{{productName}}}
  Materials: {{{materials}}}
  Origin/Cultural Context: {{{origin}}}
  Inspiration: {{{inspiration}}}

  Write a story that is both informative and emotionally engaging. Focus on the artisan's journey, the cultural significance of the craft, and the exceptional quality of the materials.  The story should be no more than 200 words.
  `,
});

const generateSalesStoryFlow = ai.defineFlow(
  {
    name: 'generateSalesStoryFlow',
    inputSchema: SalesStoryInputSchema,
    outputSchema: SalesStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

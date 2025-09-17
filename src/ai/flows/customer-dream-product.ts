'use server';

/**
 * @fileOverview Flow for customers to describe their dream product and receive matching product descriptions.
 *
 * - `describeDreamProduct` - A function that takes a description of a desired art piece and returns matching product descriptions.
 * - `DescribeDreamProductInput` - The input type for the describeDreamProduct function.
 * - `DescribeDreamProductOutput` - The return type for the describeDreamProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const DescribeDreamProductInputSchema = z.string().describe('A description of the desired art piece.');
export type DescribeDreamProductInput = z.infer<typeof DescribeDreamProductInputSchema>;

const DescribeDreamProductOutputSchema = z.object({
  productDescriptions: z.array(
    z.string().describe('A description of a product that matches the dream art piece.')
  ).describe('List of product descriptions matching the dream art piece.')
});
export type DescribeDreamProductOutput = z.infer<typeof DescribeDreamProductOutputSchema>;

export async function describeDreamProduct(input: DescribeDreamProductInput): Promise<DescribeDreamProductOutput> {
  return describeDreamProductFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describeDreamProductPrompt',
  input: {schema: DescribeDreamProductInputSchema},
  output: {schema: DescribeDreamProductOutputSchema},
  prompt: `You are an expert art curator with deep knowledge of Indian handicrafts.

  A customer will describe the art they are dreaming of.  Your job is to return a list of product descriptions of items that match their description.

  Customer dream art description: {{{$input}}}

  Return at least three different product descriptions.
  `
});

const describeDreamProductFlow = ai.defineFlow(
  {
    name: 'describeDreamProductFlow',
    inputSchema: DescribeDreamProductInputSchema,
    outputSchema: DescribeDreamProductOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

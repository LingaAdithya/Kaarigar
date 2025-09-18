'use server';
/**
 * @fileOverview Finds the best matching product from the database based on a user's query.
 *
 * - findMatchingProduct - A function that takes a user query and returns the ID of the best matching product.
 * - FindMatchingProductInput - The input type for the findMatchingProduct function.
 * - FindMatchingProductOutput - The return type for the findMatchingProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import {getAllProductsForSearch} from '@/services/customer-service';

const FindMatchingProductInputSchema = z.string().describe('A description of the desired art piece from a customer.');
export type FindMatchingProductInput = z.infer<typeof FindMatchingProductInputSchema>;

const FindMatchingProductOutputSchema = z.object({
    productId: z.string().optional().describe('The ID of the product that is the best match for the user query. If no good match is found, this can be null.'),
});
export type FindMatchingProductOutput = z.infer<typeof FindMatchingProductOutputSchema>;


export async function findMatchingProduct(input: FindMatchingProductInput): Promise<FindMatchingProductOutput> {
  return findMatchingProductFlow(input);
}


const findMatchingProductFlow = ai.defineFlow(
  {
    name: 'findMatchingProductFlow',
    inputSchema: FindMatchingProductInputSchema,
    outputSchema: FindMatchingProductOutputSchema,
  },
  async (query) => {
    const products = await getAllProductsForSearch();

    const prompt = `You are an expert art curator for an Indian handicraft marketplace. Your task is to find the best matching product from our catalog based on a customer's request.

    Analyze the customer's query and compare it against the list of available products. Identify the *single best match*.

    Customer Query: "${query}"

    Available Products:
    ${JSON.stringify(products, null, 2)}

    Your task:
    1.  Read the customer's query carefully to understand what they are looking for.
    2.  Examine the 'name' and 'description' of each product in the "Available Products" list.
    3.  Determine which product is the most relevant and best match for the customer's query.
    4.  You must return the 'id' of that single best matching product.
    5.  If no product is a reasonably good match, you may return null for the productId.
    
    Respond with only the ID of the best matching product.`;

    const {output} = await ai.generate({
        prompt: prompt,
        output: {
            schema: FindMatchingProductOutputSchema,
        },
        model: 'googleai/gemini-2.5-pro'
    });

    return output!;
  }
);

'use server';
/**
 * @fileOverview Enhances an artisan's story from a raw voice transcript.
 *
 * - enhanceArtisanStory - A function that enhances the artisan's story.
 * - EnhanceArtisanStoryInput - The input type for the enhanceArtisanStory function.
 * - EnhanceArtisanStoryOutput - The return type for the enhanceArtisanStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceArtisanStoryInputSchema = z.object({
    transcript: z.string().describe('The raw transcript from the artisan\'s voice recording.'),
});
export type EnhanceArtisanStoryInput = z.infer<typeof EnhanceArtisanStoryInputSchema>;

const EnhanceArtisanStoryOutputSchema = z.object({
  enhancedStory: z.string().describe('The enhanced, well-written story for the artisan\'s profile.'),
});
export type EnhanceArtisanStoryOutput = z.infer<typeof EnhanceArtisanStoryOutputSchema>;

export async function enhanceArtisanStory(input: EnhanceArtisanStoryInput): Promise<EnhanceArtisanStoryOutput> {
  return enhanceArtisanStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceArtisanStoryPrompt',
  input: {schema: EnhanceArtisanStoryInputSchema},
  output: {schema: EnhanceArtisanStoryOutputSchema},
  prompt: `You are a masterful storyteller who helps artisans express their passion. An artisan has provided a raw voice transcript about their journey. Your task is to transform this transcript into a compelling, short (around 50-70 words) and beautifully written story for their profile bio.

  - Capture the essence of their craft and inspiration.
  - Refine the language to be evocative and professional.
  - Ensure the tone is authentic and personal.

  Raw Transcript:
  "{{{transcript}}}"

  Generate the enhanced story.
  `,
});

const enhanceArtisanStoryFlow = ai.defineFlow(
  {
    name: 'enhanceArtisanStoryFlow',
    inputSchema: EnhanceArtisanStoryInputSchema,
    outputSchema: EnhanceArtisanStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

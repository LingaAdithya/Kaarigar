'use server';
/**
 * @fileOverview A flow for translating text into a specified target language using an AI model.
 *
 * - translateText - A function that translates the given text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const TranslateTextInputSchema = z.object({
  text: z.string().describe('The text to be translated.'),
  targetLanguage: z.string().describe('The target language for translation (e.g., "Spanish", "Hindi").'),
});
type TranslateTextInput = z.infer<typeof TranslateTextInputSchema>;

const TranslateTextOutputSchema = z.object({
  translation: z.string().describe('The translated text.'),
});
type TranslateTextOutput = z.infer<typeof TranslateTextOutputSchema>;


export async function translateText(input: TranslateTextInput): Promise<TranslateTextOutput> {
    if (!input.text.trim()) {
        return { translation: '' };
    }
    return translateTextFlow(input);
}


const prompt = ai.definePrompt({
    name: 'translateTextPrompt',
    input: {schema: TranslateTextInputSchema},
    output: {schema: TranslateTextOutputSchema},
    prompt: `Translate the following text to {{targetLanguage}}.
    
    Text to translate: "{{{text}}}"

    Return only the translated text, with no additional commentary or quotation marks.
    `,
});


const translateTextFlow = ai.defineFlow(
  {
    name: 'translateTextFlow',
    inputSchema: TranslateTextInputSchema,
    outputSchema: TranslateTextOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);

'use server';
/**
 * @fileOverview A simple speech-to-text AI flow.
 *
 * - speechToText - A function that transcribes an audio recording.
 * - SpeechToTextInput - The input type for the speechToText function.
 * - SpeechToTextOutput - The return type for the speechToText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpeechToTextInputSchema = z.object({
  voiceRecordingDataUri: z
    .string()
    .describe(
      "The voice recording as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcript: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(input: SpeechToTextInput): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'speechToTextPrompt',
  input: {schema: SpeechToTextInputSchema},
  output: {schema: SpeechToTextOutputSchema},
  prompt: `You are a speech-to-text transcription service. Transcribe the audio provided.

Here is the audio: {{media url=voiceRecordingDataUri}}

Respond with only the transcribed text.`,
});

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
    model: 'googleai/gemini-2.5-pro'
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

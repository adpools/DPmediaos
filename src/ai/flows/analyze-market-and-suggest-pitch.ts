'use server';
/**
 * @fileOverview An AI agent for market research that analyzes trends, identifies content opportunities,
 *   calculates an opportunity score, and suggests optimal pitch angles based on industry and location.
 *
 * - analyzeMarketAndSuggestPitch - A function that handles the market analysis and pitch suggestion process.
 * - AnalyzeMarketAndSuggestPitchInput - The input type for the analyzeMarketAndSuggestPitch function.
 * - AnalyzeMarketAndSuggestPitchOutput - The return type for the analyzeMarketAndSuggestPitch function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnalyzeMarketAndSuggestPitchInputSchema = z.object({
  industry: z.string().describe('The industry to analyze.'),
  location: z.string().describe('The geographical location for market analysis.'),
});
export type AnalyzeMarketAndSuggestPitchInput = z.infer<typeof AnalyzeMarketAndSuggestPitchInputSchema>;

const AnalyzeMarketAndSuggestPitchOutputSchema = z.object({
  marketTrends: z.array(z.string()).describe('Key market trends identified for the given industry and location.'),
  contentOpportunities: z.array(z.string()).describe('Potential content opportunities for campaigns.'),
  opportunityScore: z.number().int().min(0).max(100).describe('An overall opportunity score for the market, from 0 to 100.'),
  suggestedPitchAngles: z.array(z.string()).describe('Optimal pitch angles for marketing campaigns.'),
});
export type AnalyzeMarketAndSuggestPitchOutput = z.infer<typeof AnalyzeMarketAndSuggestPitchOutputSchema>;

export async function analyzeMarketAndSuggestPitch(input: AnalyzeMarketAndSuggestPitchInput): Promise<AnalyzeMarketAndSuggestPitchOutput> {
  return analyzeMarketAndSuggestPitchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeMarketAndSuggestPitchPrompt',
  input: { schema: AnalyzeMarketAndSuggestPitchInputSchema },
  output: { schema: AnalyzeMarketAndSuggestPitchOutputSchema },
  prompt: `You are an expert market research specialist. Your task is to analyze the market for a given industry and location,
identify key trends, pinpoint content opportunities, calculate an opportunity score, and suggest optimal pitch angles.

Industry: {{{industry}}}
Location: {{{location}}}

Based on the above, provide:
1. Key market trends.
2. Specific content opportunities for campaigns.
3. An overall opportunity score (0-100).
4. Optimal pitch angles for campaigns.

Please format your response as a JSON object matching the output schema provided.`,
});

const analyzeMarketAndSuggestPitchFlow = ai.defineFlow(
  {
    name: 'analyzeMarketAndSuggestPitchFlow',
    inputSchema: AnalyzeMarketAndSuggestPitchInputSchema,
    outputSchema: AnalyzeMarketAndSuggestPitchOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

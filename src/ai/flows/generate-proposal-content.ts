'use server';
/**
 * @fileOverview A Genkit flow for generating sales proposal content.
 *
 * - generateProposalContent - A function that handles the AI proposal content generation process.
 * - GenerateProposalContentInput - The input type for the generateProposalContent function.
 * - GenerateProposalContentOutput - The return type for the generateProposalContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProposalContentInputSchema = z.object({
  projectName: z.string().describe('The name of the project for the proposal.').min(1),
  clientName: z.string().describe('The name of the client receiving the proposal.').min(1),
  servicesRequired: z.string().describe('A detailed description of the services the client requires.').min(1),
  additionalDetails: z.string().optional().describe('Any additional specific details or context relevant to the proposal.'),
});
export type GenerateProposalContentInput = z.infer<typeof GenerateProposalContentInputSchema>;

const GenerateProposalContentOutputSchema = z.object({
  content: z.string().describe('The generated draft content for the sales proposal.'),
});
export type GenerateProposalContentOutput = z.infer<typeof GenerateProposalContentOutputSchema>;

export async function generateProposalContent(
  input: GenerateProposalContentInput
): Promise<GenerateProposalContentOutput> {
  return generateProposalContentFlow(input);
}

const proposalContentPrompt = ai.definePrompt({
  name: 'proposalContentPrompt',
  input: { schema: GenerateProposalContentInputSchema },
  output: { schema: GenerateProposalContentOutputSchema },
  prompt: `You are an expert sales proposal writer. Your goal is to generate draft content and placeholder text for a sales proposal based on the provided project details. The content should be professional, engaging, and directly address the client's needs. Ensure the output is formatted as a JSON object with a single 'content' field.

Project Name: {{{projectName}}}
Client Name: {{{clientName}}}
Services Required: {{{servicesRequired}}}
Additional Details: {{{additionalDetails}}}

Please generate a comprehensive proposal draft that includes the following sections:
1.  Executive Summary: Provide a brief overview of the client's challenge and your proposed solution.
2.  Understanding of Client's Needs: Elaborate on your understanding of the client's specific requirements and challenges.
3.  Proposed Solution & Services: Detail the specific services and solutions you are offering to address their needs.
4.  Benefits & Value Proposition: Explain the benefits the client will receive and the unique value your solution brings.
5.  Project Approach & Methodology: Describe your plan for execution and the methodology you will follow.
6.  Timeline: Provide a placeholder for the estimated project timeline (e.g., "[Project Timeline: To be determined based on final scope]").
7.  Investment: Provide a placeholder for the pricing details (e.g., "[Investment: Detailed pricing will be provided upon scope finalization]").
8.  Next Steps & Call to Action: Clearly outline what the client should do next.

Ensure to use placeholders where specific details (like exact timelines or pricing) would normally go, indicating where further information is needed.`, 
});

const generateProposalContentFlow = ai.defineFlow(
  {
    name: 'generateProposalContentFlow',
    inputSchema: GenerateProposalContentInputSchema,
    outputSchema: GenerateProposalContentOutputSchema,
  },
  async (input) => {
    const { output } = await proposalContentPrompt(input);
    return output!;
  }
);

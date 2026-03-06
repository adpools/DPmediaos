'use server';
/**
 * @fileOverview AI Proposal Architect flow for generating high-premium sales proposals.
 * 
 * This flow performs a 5-step analysis:
 * 1. Project Understanding
 * 2. Market Research
 * 3. Proposal Structuring
 * 4. Content Generation
 * 5. Structured JSON Output
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProposalContentInputSchema = z.object({
  service_vertical: z.string().describe('The type of service, e.g., Brand Film, SEO, Social Media.'),
  client_type: z.string().describe('The industry or type of client business.'),
  location: z.string().describe('The geographical location of the client/project.'),
  project_description: z.string().describe('Detailed description of the project requirements.'),
  project_duration: z.string().describe('Estimated timeline for the project.'),
  target_market: z.string().describe('The specific audience the project aims to reach.'),
  budget: z.string().optional().describe('Budget range if provided.'),
});
export type GenerateProposalContentInput = z.infer<typeof GenerateProposalContentInputSchema>;

const GenerateProposalContentOutputSchema = z.object({
  proposal_title: z.string(),
  client: z.string(),
  sections: z.array(z.object({
    title: z.string(),
    content: z.string().describe('Professional agency-level markdown content for this section.'),
  })),
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
  prompt: `You are an AI Proposal Architect for a premium creative media and digital marketing agency.
Your task is to automatically generate a professional business proposal structure and research insights based on the following inputs:

INPUT DATA:
- Service Vertical: {{{service_vertical}}}
- Client Industry / Type: {{{client_type}}}
- Client Location: {{{location}}}
- Project Description: {{{project_description}}}
- Project Duration: {{{project_duration}}}
- Target Market: {{{target_market}}}
- Budget Range: {{#if budget}}{{{budget}}}{{else}}Standard Agency Rates{{/if}}

Please follow these steps to generate the proposal:

STEP 1 — Understand the Project
Analyze the service vertical and description to determine business goals, challenges, and trends.

STEP 2 — Perform Market Research
Include industry overview, market trends, competitor analysis (strengths/weaknesses), and digital presence opportunities.

STEP 3 — Generate Proposal Structure (18 Sections)
1. Cover Page
2. Proposal Introduction
3. Executive Summary
4. Client Business Overview
5. Digital Presence Audit
6. Competitor Analysis
7. Keyword & Search Opportunity
8. Strategic Framework
9. 12-Month Marketing Roadmap
10. Media Production Plan
11. Digital Marketing Plan
12. Deliverables Summary
13. KPI Targets
14. Budget Structure
15. Expected ROI
16. Implementation Timeline
17. Next Steps
18. Terms & Conditions

STEP 4 — Generate Content
- Premium agency tone (strategic and data-driven).
- Adapt tone to the client industry.
- Include data-backed insights and measurable outcomes.

STEP 5 — Format Output
Return a structured JSON object with a "proposal_title", "client", and an array of "sections" each with a "title" and "content".`,
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

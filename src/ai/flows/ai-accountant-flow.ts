'use server';
/**
 * @fileOverview A specialized AI Accountant flow for production companies.
 *
 * - aiAccountantFlow - Analyzes financial data and provides tax/liquidity advice.
 * - AIAccountantInput - Input data including GST stats and liquidity.
 * - AIAccountantOutput - AI-generated insights and recommendations.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIAccountantInputSchema = z.object({
  companyName: z.string().describe('The name of the company.'),
  totalLiquidity: z.number().describe('Total current balance across all accounts.'),
  totalGstOutput: z.number().describe('Total GST collected from invoices.'),
  pendingPeriods: z.array(z.string()).describe('List of months with pending GST filings.'),
  billingVelocity: z.string().describe('Description of how fast the company is invoicing (e.g., growing, stable).'),
});
export type AIAccountantInput = z.infer<typeof AIAccountantInputSchema>;

const AIAccountantOutputSchema = z.object({
  summary: z.string().describe('A brief summary of the financial health.'),
  recommendations: z.array(z.object({
    category: z.string().describe('e.g., Tax, Cash Flow, Compliance'),
    advice: z.string().describe('The specific recommendation.'),
    impact: z.string().describe('Expected benefit.'),
  })).describe('List of actionable financial steps.'),
  riskAlerts: z.array(z.string()).describe('Potential compliance or liquidity risks.'),
  filingTip: z.string().describe('A specific tip for the upcoming GST filing.'),
});
export type AIAccountantOutput = z.infer<typeof AIAccountantOutputSchema>;

export async function consultAIAccountant(input: AIAccountantInput): Promise<AIAccountantOutput> {
  const { output } = await aiAccountantFlow(input);
  return output!;
}

const aiAccountantFlow = ai.defineFlow(
  {
    name: 'aiAccountantFlow',
    inputSchema: AIAccountantInputSchema,
    outputSchema: AIAccountantOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `You are an expert AI Chartered Accountant specializing in the Indian Media & Entertainment industry. 
      Analyze the following financial snapshot for "${input.companyName}" and provide professional, actionable advice.

      Financial Context:
      - Total Liquidity: ₹${input.totalLiquidity.toLocaleString()}
      - Total GST Output (Payable): ₹${input.totalGstOutput.toLocaleString()}
      - Pending Filing Months: ${input.pendingPeriods.join(', ')}
      - Billing Velocity: ${input.billingVelocity}

      Provide your response as a JSON object containing:
      1. A professional summary of their financial status.
      2. 3-4 specific recommendations regarding tax optimization, cash flow management, or compliance.
      3. Any risks identified (e.g., high tax-to-liquidity ratio).
      4. A specific filing tip for GSTR-1/3B.

      Be precise, encouraging, and highly professional.`,
      output: { schema: AIAccountantOutputSchema },
    });
    return output!;
  }
);

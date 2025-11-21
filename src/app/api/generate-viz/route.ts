import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { endpoint, responseData } = body;

    if (!endpoint || !responseData) {
      return NextResponse.json(
        { error: 'endpoint and responseData are required' },
        { status: 400 }
      );
    }

    // Construct the prompt for Claude
    const prompt = buildVisualizationPrompt(endpoint, responseData);

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the component code from the response
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const componentCode = extractCodeFromResponse(responseText);

    if (!componentCode) {
      return NextResponse.json(
        { error: 'Failed to extract component code from AI response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      componentCode,
      prompt,
      model: 'claude-3-5-haiku-20241022',
    });

  } catch (error: any) {
    console.error('Visualization generation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to generate visualization',
        details: error.stack,
      },
      { status: 500 }
    );
  }
}

function buildVisualizationPrompt(endpoint: any, responseData: any): string {
  return `You are an expert at creating beautiful, insightful data visualizations using React and Recharts.

**Endpoint Information:**
- Method: ${endpoint.method}
- Path: ${endpoint.path}
- Description: ${endpoint.description || endpoint.summary || 'No description available'}

**API Response Data:**
\`\`\`json
${JSON.stringify(responseData, null, 2)}
\`\`\`

**Task:**
Generate a React component that visualizes this API response data in the most appropriate and insightful way.

**Requirements:**
1. Analyze the data structure and choose the most suitable visualization(s):
   - For arrays of objects: Tables, charts, or cards
   - For time-series data: Line or area charts
   - For categorical data: Bar or pie charts
   - For single objects: Key-value display cards
   - For nested data: Hierarchical views

2. Use ONLY these imports (no others):
   - React: import React from 'react'
   - Recharts components like: BarChart, LineChart, PieChart, AreaChart, ScatterChart, Bar, Line, Pie, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell

3. The component must:
   - Be a functional component named "Visualization"
   - Accept a single prop called "data" that contains the response
   - Use TypeScript
   - Use Tailwind CSS for styling
   - Be responsive and beautiful
   - Include helpful labels, legends, and tooltips
   - Handle edge cases (empty data, missing fields)

4. Use appropriate colors from Tailwind's palette

5. If multiple visualizations would be useful, create multiple sections

**Output Format:**
Return ONLY the React component code, wrapped in a markdown code block with tsx language identifier.
Do not include any explanation before or after the code.

Example format:
\`\`\`tsx
import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export default function Visualization({ data }: { data: any }) {
  // Your implementation here
  return (
    <div className="p-6">
      {/* Your visualization here */}
    </div>
  );
}
\`\`\`

Now generate the visualization component:`;
}

function extractCodeFromResponse(response: string): string | null {
  // Try to extract code from markdown code block
  const codeBlockRegex = /```(?:tsx|typescript|jsx|javascript)?\n([\s\S]*?)```/;
  const match = response.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // If no code block found, return the whole response
  // (might be useful if Claude doesn't use markdown)
  return response.trim() || null;
}

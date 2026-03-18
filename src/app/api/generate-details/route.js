import { NextResponse } from "next/server";

import OpenAI from "openai"

const createOptimizedPrompt = (description) => {
    const today = new Date().toISOString().split('T')[0];
    return `
You are a highly intelligent assistant for a faculty task management app. Your primary function is to parse a user's natural language request and convert it into a structured JSON object.

## CONSTRAINTS:
1.  Your output MUST be a single, valid JSON object. Do not include any explanatory text before or after the JSON.
2.  The "dueDate" MUST be calculated based on the current date: ${today}. It must be in "YYYY-MM-DD" format.
3.  If any piece of information cannot be found in the user's request, its value in the JSON MUST be \`null\`. Do not omit keys.
4. The "classType" value MUST be one of the following strings: "LAB" or "TUT". If the user says "tut", use "Tutorial". If neither is mentioned, use null.

## EXAMPLES:
User Request: "I need to prepare the exam papers for SC2207 Tutorial group BCG1. It's due next Monday."
JSON Output:
{
  "name": "Prepare exam papers for SC2207",
  "dueDate": "2025-09-29",
  "details": "Prepare the exam papers for SC2207 Tutorial group BCG1.",
  "courseCode": "SC2207",
  "classType": "Tutorial",
  "classGroup": "BCG1"
}

User Request: "remind me to book a meeting room for tomorrow"
JSON Output:
{
  "name": "Book meeting room",
  "dueDate": "2025-09-25",
  "details": "Book a meeting room for tomorrow.",
  "courseCode": null,
  "classType": null,
  "classGroup": null
}

## TASK:
Parse the following user request and provide the JSON output.

USER REQUEST:
"${description}"

JSON OUTPUT:
`;
};

export async function POST(req) {
    let type = 'unknown'
    try {
        
        const body = await req.json();
        const { description } = body;
        type = body.type;
        if (!description || !type) {
            return NextResponse.json({ error: "Description and type are required." }, { status: 400 });
        }

        const openai = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
            defaultQuery: { "api-version": "2024-02-01" },
            defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
        });

        const taskDetailsTool = {
            type: "function",
            function: {
                name: "extract_task_details",
                description: "Extracts details for a new task.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "A concise name for the task, e.g., 'Grade SC2207 Mid-Terms'." },
                        dueDate: { type: "string", description: "The due date in YYYY-MM-DD format. Infer from text like 'next Friday'." },
                        details: { type: "string", description: "A more detailed description of the task." },
                        courseCode: { type: "string", description: "The course code, e.g., 'SC2207', or null if not mentioned." },
                        classType: { type: "string", description: "The class type, which must be 'LAB' or 'TUT', or null if not mentioned." },
                        classGroup: { type: "string", description: "The specific class group, e.g., 'BCG1', or null if not mentioned." },
                    },
                    required: ["name", "details"],
                },
            },
        };
        const ticketDetailsTool = {
            type: "function",
            function: {
                name: "extract_ticket_details",
                description: "Extracts details for a new support ticket.",
                parameters: {
                    type: "object",
                    properties: {
                        name: { type: "string", description: "A concise name for the ticket, e.g., 'Late submission due to MC'." },
                        ticketDescription: { type: "string", description: "A detailed description of the ticket/issue." },
                        courseCode: { type: "string", description: "The course code, e.g., 'SC2207', or null." },
                        classType: { type: "string", description: "The class type, either 'LAB' or 'TUT', or null.", enum: ["LAB", "TUT"] },
                        classGroup: { type: "string", description: "The specific class group, e.g., 'BCG1', or null." },
                        category: {
                            type: "string",
                            description: "The category of the ticket.",
                            enum: ["Assignment", "Exam", "Project", "Quiz", "Lab"],
                        },
                        studentName: { type: "string", description: "The full name of the student involved, or null." },
                        priority: {
                            type: "string",
                            description: "The priority level.",
                            enum: ["low", "medium", "high"],
                        },
                        professorName: { type: "string", description: "The name of the professor involved, or null." },
                    },
                    required: ["name", "ticketDescription"],
                },
            },
        };

        const selectedTool = type === 'ticket' ? ticketDetailsTool : taskDetailsTool;

        const messages = [
            { role: "system", content: `You are a helpful assistant for a faculty app. The current date is ${new Date().toLocaleDateString()}. Extract details using the ${selectedTool.function.name} tool.` },
            { role: "user", content: description },
        ];

        const response = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
            messages: messages,
            tools: [selectedTool],
            tool_choice: "auto",
        });

        const toolCall = response.choices[0]?.message?.tool_calls?.[0];
        if (toolCall) {
            const structuredDetails = JSON.parse(toolCall.function.arguments);
            return NextResponse.json(structuredDetails);
        } else {
            return NextResponse.json({ error: "Could not extract details." }, { status: 400 });
        }
    } catch (error) {
        console.error(`Error generating ${type} details:`, error);
        return NextResponse.json({ error: `Failed to generate ${type} details.` }, { status: 500 });
    }
}
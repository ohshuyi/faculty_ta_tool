import { NextResponse } from "next/server";
// import { OpenAIClient, AzureKeyCredential } from "@azure/openai"; // Azure SDK commented out

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
// const createOptimizedPrompt = (description) => {
//   const today = new Date().toISOString().split('T')[0];
//   return `
// TASK: Analyze the user request below and extract the information into a single, valid JSON object.

// CONSTRAINTS:
// 1. Your response MUST be only the JSON object. Do not add any other text.
// 2. Use these exact keys: "name", "dueDate", "details", "courseCode", "classType", "classGroup".
// 3. The "classType" value MUST be one of the following strings: "LAB" or "TUT". If the user says "tut", use "Tutorial". If neither is mentioned, use null.
// 4. If a value for any other key is not found in the request, use null.
// 5. The current date is ${today}. Calculate relative dates (e.g., "next Friday") and format the result as "YYYY-MM-DD".

// USER REQUEST:
// "${description}"

// JSON:
// `;
// };


export async function POST(req) {
    try {
        const { description } = await req.json();
        if (!description) {
            return NextResponse.json({ error: "Description is required." }, { status: 400 });
        }

        // --- OLLAMA LOCALHOST CONFIGURATION ---
        const ollamaEndpoint = process.env.OLLAMA_API_ENDPOINT;
        if (!ollamaEndpoint) {
            throw new Error("Ollama API endpoint is not configured in .env.local");
        }

        // Create a detailed prompt asking for JSON output.
        const prompt = createOptimizedPrompt(description);

        // Send the request to your local Ollama server
        const response = await fetch(`${ollamaEndpoint}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "llama3", // Or the model you are running, e.g., "mistral"
                prompt: prompt,
                format: "json", // Crucial for ensuring the output is valid JSON
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama server responded with status ${response.status}`);
        }

        const ollamaData = await response.json();
        const structuredDetails = JSON.parse(ollamaData.response);

        return NextResponse.json(structuredDetails);

        /*
        // --- AZURE OPENAI CODE (COMMENTED OUT) ---
        
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;
    
        if (!endpoint || !azureApiKey || !deploymentName) {
          throw new Error("Azure OpenAI environment variables are not set.");
        }
    
        const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));
    
        const taskDetailsTool = { ... }; // Your Azure function definition
        
        const messages = [ ... ]; // Your messages for Azure
        
        const result = await client.getChatCompletions(deploymentName, messages, {
          tools: [taskDetailsTool],
          toolChoice: "auto",
        });
    
        const toolCall = result.choices[0]?.message?.toolCalls?.[0];
        if (toolCall?.function) {
          const structuredDetails = JSON.parse(toolCall.function.arguments);
          return NextResponse.json(structuredDetails);
        } else {
          return NextResponse.json({ error: "Could not extract details." }, { status: 400 });
        }
        */

    } catch (error) {
        console.error("Error generating details:", error);
        return NextResponse.json({ error: "Failed to generate details with AI." }, { status: 500 });
    }
}
import { NextResponse } from "next/server";
// import { OpenAIClient, AzureKeyCredential } from "@azure/openai"; // Azure SDK commented out
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
    try {
        const { description } = await req.json();
        if (!description) {
            return NextResponse.json({ error: "Description is required." }, { status: 400 });
        }

        // --- OLLAMA LOCALHOST CONFIGURATION ---
        // const ollamaEndpoint = process.env.OLLAMA_API_ENDPOINT;
        // if (!ollamaEndpoint) {
        //     throw new Error("Ollama API endpoint is not configured in .env.local");
        // }

        // // Create a detailed prompt asking for JSON output.
        // const prompt = createOptimizedPrompt(description);

        // // Send the request to your local Ollama server
        // const response = await fetch(`${ollamaEndpoint}/api/generate`, {
        //     method: "POST",
        //     headers: { "Content-Type": "application/json" },
        //     body: JSON.stringify({
        //         model: "llama3", // Or the model you are running, e.g., "mistral"
        //         prompt: prompt,
        //         format: "json", // Crucial for ensuring the output is valid JSON
        //         stream: false,
        //     }),
        // });

        // if (!response.ok) {
        //     throw new Error(`Ollama server responded with status ${response.status}`);
        // }

        // const ollamaData = await response.json();
        // const structuredDetails = JSON.parse(ollamaData.response);

        // return NextResponse.json(structuredDetails);


        // --- AZURE OPENAI CODE (COMMENTED OUT) ---

        // const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        // const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
        // const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

        // if (!endpoint || !azureApiKey || !deploymentName) {
        //     throw new Error("Azure OpenAI environment variables are not set.");
        // }

        // const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

        // const taskDetailsTool = {
        //     type: "function",
        //     function: {
        //         name: "extract_task_details",
        //         description: "Extracts the details of a new task from a user's description.",
        //         parameters: {
        //             type: "object",
        //             properties: {
        //                 name: { type: "string", description: "A concise name for the task, e.g., 'Grade SC2207 Mid-Terms'." },
        //                 dueDate: { type: "string", description: "The due date in YYYY-MM-DD format. Infer from text like 'next Friday'." },
        //                 details: { type: "string", description: "A more detailed description of the task." },
        //                 courseCode: { type: "string", description: "The course code, e.g., 'SC2207', or null if not mentioned." },
        //                 classType: { type: "string", description: "The class type, which must be 'Lab' or 'Tutorial', or null if not mentioned." },
        //                 classGroup: { type: "string", description: "The specific class group, e.g., 'BCG1', or null if not mentioned." },
        //             },
        //             required: ["name", "dueDate", "details"],
        //         },
        //     },
        // };

        // // 3. Send the request to the AI model
        // const messages = [
        //     { role: "system", content: "You are a helpful assistant that extracts task details from text. Today's date is " + new Date().toLocaleDateString() + "." },
        //     { role: "user", content: description },
        // ];

        // const result = await client.getChatCompletions(deploymentName, messages, {
        //     tools: [taskDetailsTool],
        //     toolChoice: "auto",
        // });

        // const toolCall = result.choices[0]?.message?.toolCalls?.[0];
        // if (toolCall?.function) {
        //     const structuredDetails = JSON.parse(toolCall.function.arguments);
        //     return NextResponse.json(structuredDetails);
        // } else {
        //     return NextResponse.json({ error: "Could not extract details." }, { status: 400 });
        // }

        // 2. Instantiate the OpenAI client, configured for AZURE
        const openai = new OpenAI({
            apiKey: process.env.AZURE_OPENAI_API_KEY,
            baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
            defaultQuery: { "api-version": "2024-02-01" }, // Use a recent, stable API version
            defaultHeaders: { "api-key": process.env.AZURE_OPENAI_API_KEY },
        });

        // 3. Define the tool (the schema is the same as before)
        const tools = [{
            type: "function",
            function: {
                name: "extract_task_details",
                description: "Extracts the details of a new task from a user's description.",
                parameters: {
                    type: "object",
                    // All parameter definitions must be nested inside this 'properties' object
                    properties: {
                        name: { type: "string", description: "A concise name for the task, e.g., 'Grade SC2207 Mid-Terms'." },
                        dueDate: { type: "string", description: "The due date in YYYY-MM-DD format. Infer from text like 'next Friday'." },
                        details: { type: "string", description: "A more detailed description of the task." },
                        courseCode: { type: "string", description: "The course code, e.g., 'SC2207', or null if not mentioned." },
                        classType: { type: "string", description: "The class type, which must be 'LAB' or 'TUT', or null if not mentioned." },
                        classGroup: { type: "string", description: "The specific class group, e.g., 'BCG1', or null if not mentioned." },
                    },
                    // The 'required' array must be a sibling of 'properties'
                    required: ["name", "dueDate", "details"],
                },
            },
        }];

        const messages = [
            { role: "system", content: `You are a helpful assistant for a faculty task app. The current date is ${new Date().toLocaleDateString()}. Analyze the user's request and use the extract_task_details tool to structure the data.` },
            { role: "user", content: description },
        ];

        // 4. Call the chat completions API
        const response = await openai.chat.completions.create({
            model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME, // Must use deployment name for Azure
            messages: messages,
            tools: tools,
            tool_choice: "auto",
        });

        // 5. Parse the response (the structure is slightly different)
        const toolCall = response.choices[0]?.message?.tool_calls?.[0];
        if (toolCall) {
            const structuredDetails = JSON.parse(toolCall.function.arguments);
            return NextResponse.json(structuredDetails);
        } else {
            return NextResponse.json({ error: "Could not extract details." }, { status: 400 });
        }

    } catch (error) {
        console.error("Error generating details:", error);
        return NextResponse.json({ error: "Failed to generate details with AI." }, { status: 500 });
    }
}
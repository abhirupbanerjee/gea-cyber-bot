// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Server-side environment variables (no NEXT_PUBLIC_ prefix)
const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_ORGANIZATION = process.env.OPENAI_ORGANIZATION;

export async function POST(request: NextRequest) {
  try {
    // Log environment variables (don't log the actual keys in production)
    console.log('Environment check:', {
      hasAssistantId: !!ASSISTANT_ID,
      hasApiKey: !!OPENAI_API_KEY,
      hasOrganization: !!OPENAI_ORGANIZATION
    });

    if (!ASSISTANT_ID || !OPENAI_API_KEY) {
      console.error('Missing OpenAI configuration');
      return NextResponse.json(
        { error: 'Missing OpenAI configuration' },
        { status: 500 }
      );
    }

    const { message, threadId } = await request.json();

    if (!message || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v2',
    };

    if (OPENAI_ORGANIZATION) {
      headers['OpenAI-Organization'] = OPENAI_ORGANIZATION;
    }

    let currentThreadId = threadId;

    // Create thread if it doesn't exist
    if (!currentThreadId) {
      console.log('Creating new thread...');
      try {
        const threadRes = await axios.post(
          'https://api.openai.com/v1/threads',
          {},
          { headers }
        );
        currentThreadId = threadRes.data.id;
        console.log('Thread created:', currentThreadId);
      } catch (error: any) {
        console.error('Thread creation failed:', error.response?.data || error.message);
        return NextResponse.json(
          { error: 'Failed to create thread' },
          { status: 500 }
        );
      }
    }

    // Add message to thread
    console.log('Adding message to thread...');
    try {
      await axios.post(
        `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
        { role: 'user', content: message },
        { headers }
      );
      console.log('Message added to thread');
    } catch (error: any) {
      console.error('Failed to add message:', error.response?.data || error.message);
      return NextResponse.json(
        { error: 'Failed to add message to thread' },
        { status: 500 }
      );
    }

    // Create run
    console.log('Creating run...');
    let runId;
    try {
      const runRes = await axios.post(
        `https://api.openai.com/v1/threads/${currentThreadId}/runs`,
        { assistant_id: ASSISTANT_ID },
        { headers }
      );
      runId = runRes.data.id;
      console.log('Run created:', runId);
    } catch (error: any) {
      console.error('Run creation failed:', error.response?.data || error.message);
      return NextResponse.json(
        { error: 'Failed to create run' },
        { status: 500 }
      );
    }

    // Poll for completion or function calls
    let status = 'in_progress';
    let retries = 0;
    const maxRetries = 30;

    while ((status === 'in_progress' || status === 'queued' || status === 'requires_action') && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const statusRes = await axios.get(
          `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`,
          { headers }
        );

        status = statusRes.data.status;
        console.log(`Run status: ${status} (attempt ${retries + 1})`);

        // Handle function calls
        if (status === 'requires_action') {
          const toolCalls = statusRes.data.required_action?.submit_tool_outputs?.tool_calls;

          if (toolCalls && toolCalls.length > 0) {
            console.log('[Function Calls] Processing', toolCalls.length, 'function calls');
            const toolOutputs = [];

            for (const toolCall of toolCalls) {
              const functionName = toolCall.function.name;
              const functionArgs = JSON.parse(toolCall.function.arguments);

              console.log('[Function Call]', { functionName, arguments: functionArgs, timestamp: new Date().toISOString() });

              let output;

              try {
                // Normalize parameter names (snake_case to camelCase for internal API)
                const normalizedArgs = { ...functionArgs };
                if (normalizedArgs.github_url) {
                  normalizedArgs.githubUrl = normalizedArgs.github_url;
                  delete normalizedArgs.github_url;
                }
                if (normalizedArgs.include_issues !== undefined) {
                  normalizedArgs.includeIssues = normalizedArgs.include_issues;
                  delete normalizedArgs.include_issues;
                }

                // Import route handlers directly to avoid HTTP calls
                if (functionName === 'validate_github_repo') {
                  // Import and call the validate-repo route handler directly
                  const { POST: validateRepoHandler } = await import('@/app/api/sonar/validate-repo/route');

                  // Create a mock NextRequest with the arguments
                  const mockRequest = {
                    json: async () => normalizedArgs
                  } as NextRequest;

                  const response = await validateRepoHandler(mockRequest);
                  output = await response.json();

                  console.log('[Function Call] validate_github_repo result:', output);
                } else if (functionName === 'get_code_analysis') {
                  // Import and call the get-analysis route handler directly
                  const { POST: getAnalysisHandler } = await import('@/app/api/sonar/get-analysis/route');

                  // Create a mock NextRequest with the arguments
                  const mockRequest = {
                    json: async () => normalizedArgs
                  } as NextRequest;

                  const response = await getAnalysisHandler(mockRequest);
                  output = await response.json();

                  console.log('[Function Call] get_code_analysis result:', output);
                } else if (functionName === 'analyze_website_performance') {
                  // Normalize PageSpeed parameters (snake_case to camelCase)
                  const pagespeedArgs = {
                    targetUrl: functionArgs.target_url,
                    strategy: functionArgs.strategy || 'mobile'
                  };

                  // Import and call the pagespeed analyze route handler directly
                  const { POST: analyzeHandler } = await import('@/app/api/pagespeed/analyze/route');

                  // Create a mock NextRequest with the arguments
                  const mockRequest = {
                    json: async () => pagespeedArgs
                  } as NextRequest;

                  const response = await analyzeHandler(mockRequest);
                  output = await response.json();

                  console.log('[Function Call] analyze_website_performance result:', output);
                } else {
                  output = { error: `Unknown function: ${functionName}` };
                }

                console.log('[Function Call] Success:', { functionName, hasError: !!output.error });
              } catch (error: any) {
                console.error('[Function Call] Error:', { functionName, error: error.message, stack: error.stack });
                output = { error: error.message || 'Function call failed' };
              }

              toolOutputs.push({
                tool_call_id: toolCall.id,
                output: JSON.stringify(output)
              });
            }

            // Submit tool outputs
            console.log('[Function Calls] Submitting', toolOutputs.length, 'outputs');
            await axios.post(
              `https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}/submit_tool_outputs`,
              { tool_outputs: toolOutputs },
              { headers }
            );

            // Reset status to continue polling
            status = 'in_progress';
          }
        }

        if (status === 'failed') {
          console.error('Run failed:', statusRes.data);
          break;
        }
      } catch (error: any) {
        console.error('Status check failed:', error.response?.data || error.message);
        break;
      }

      retries++;
    }

    let reply = 'No response received.';
    
    if (status === 'completed') {
      console.log('Run completed, fetching messages...');
      try {
        const messagesRes = await axios.get(
          `https://api.openai.com/v1/threads/${currentThreadId}/messages`,
          { headers }
        );
        
        const assistantMsg = messagesRes.data.data.find((m: any) => m.role === 'assistant');
        reply = assistantMsg?.content?.[0]?.text?.value?.replace(/【\d+:\d+†[^】]+】/g, '') || 'No valid response.';
        console.log('Reply extracted successfully');
      } catch (error: any) {
        console.error('Failed to fetch messages:', error.response?.data || error.message);
        reply = 'Failed to fetch response.';
      }
    } else if (status === 'failed') {
      reply = 'The assistant run failed. Please try again.';
    } else if (retries >= maxRetries) {
      reply = 'The assistant is taking too long to respond. Please try again.';
    }

    return NextResponse.json({
      reply,
      threadId: currentThreadId,
      status: 'success'
    });

  } catch (error: any) {
    console.error('API Error:', error.response?.data || error.message);
    
    let errorMessage = 'Unable to reach assistant.';
    
    if (error.response?.data?.error?.message) {
      errorMessage = error.response.data.error.message;
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid API key.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Assistant not found.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
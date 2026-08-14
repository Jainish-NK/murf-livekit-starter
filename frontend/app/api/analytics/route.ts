import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';

export const revalidate = 0; // Ensure no Next.js API route caching

export async function GET(): Promise<Response> {
  return new Promise<Response>((resolve) => {
    // Resolve absolute path to the dump script
    const scriptPath = path.resolve(process.cwd(), '../backend/src/dump_analytics.py');
    const backendDir = path.resolve(process.cwd(), '../backend');

    // Run using 'uv run python' to use the correct virtual environment interpreter
    const command = `uv run python "${scriptPath}"`;

    exec(command, { cwd: backendDir }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running analytics dump: ${error.message}`);
        console.error(`Stderr: ${stderr}`);
        return resolve(
          NextResponse.json(
            {
              error: 'Failed to retrieve database analytics',
              details: error.message,
              analytics: {
                total_calls: 0,
                successful_calls: 0,
                failed_calls: 0,
                success_rate: 0,
              },
              history: [],
              failures: {},
            },
            { status: 500 }
          )
        );
      }

      try {
        const data = JSON.parse(stdout);
        return resolve(NextResponse.json(data));
      } catch (parseError: unknown) {
        const parseErrorMsg = parseError instanceof Error ? parseError.message : String(parseError);
        console.error(`JSON Parse Error: ${parseErrorMsg}`);
        console.error(`Raw output was: ${stdout}`);
        return resolve(
          NextResponse.json(
            {
              error: 'Failed to parse database analytics output',
              analytics: {
                total_calls: 0,
                successful_calls: 0,
                failed_calls: 0,
                success_rate: 0,
              },
              history: [],
              failures: {},
            },
            { status: 500 }
          )
        );
      }
    });
  });
}

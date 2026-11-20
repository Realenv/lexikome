import { Octokit } from "@octokit/rest";
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

export const prerender = false;
const octokit = new Octokit({ auth: env.GITHUB_API_KEY });

export const POST = (async ({ request }) => {
    const sha: {sha: string} = await request.json();
    const audio = await octokit.request('GET /repos/{owner}/{repo}/git/blobs/{file_sha}', {
        owner: 'realenv',
        repo: 'lexikome-audio-db',
        file_sha: sha.sha,
        headers: {
            'X-GitHub-Api-Version': '2026-03-10'
        }
    })
    return new Response(
        JSON.stringify({
            audio_data: audio.data.content
        })
    );
}) satisfies APIRoute;
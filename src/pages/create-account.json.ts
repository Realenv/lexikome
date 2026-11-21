import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
export const prerender = false;

export const POST = (async ({ request }) => {
    const account_info: {username: string, password: string, preferred_lang: string} = await request.json();

    const username_count = await env.account.prepare("SELECT COUNT(*) FROM account_table WHERE username = ?").bind(account_info.username).run();
    if(username_count.results[0]["COUNT(*)"] != 0){
        return new Response(
            JSON.stringify({
                message: "Username not availidable",
                error: true,
                error_source: "username"
            }),
        );
    }
    const creating_user = await env.account.prepare("INSERT INTO account_table (username, password, preferred_lang) VALUES (?, ?, ?)").bind(account_info.username, account_info.password, account_info.preferred_lang).run();
    if(!creating_user.success){
        return new Response(
            JSON.stringify({
                message: "Failed to create account, please try later",
                error: true,
                error_source: "db"
            }),
        );
    }
    return new Response(
        JSON.stringify({
            message: "success",
            error: false,
            error_source: "none"
        }),
    );
}) satisfies APIRoute;
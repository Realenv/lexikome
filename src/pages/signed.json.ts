import type { APIRoute } from "astro";
import { signIn } from "../scripts/sign-in";
export const prerender = false;

export const POST = (async ({ request }) => {
    const account_info: {username: string, password: string, preferred_lang: string} = await request.json();
    const result = await signIn(account_info.username, account_info.password);
    if(result.password == null){
        return new Response(
            JSON.stringify({
                message: "Failed to found the account, your username or your password is incorrect",
                error: true,
                error_source: "username_or_password"
            }),
        );
    } else{
        return new Response(
            JSON.stringify({
                message: "success",
                error: false,
                error_source: "none"
            }),
        );
    }
}) satisfies APIRoute;
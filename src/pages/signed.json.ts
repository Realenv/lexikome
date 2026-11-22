import type { APIRoute } from "astro";
import { signIn } from "../scripts/sign-in";
export const prerender = false;

export const POST = (async ({ request, cookies }) => {
    const account_info: {username: string, password: string, preferred_lang: string} = await request.json();
    const result = await signIn(account_info.username, account_info.password);
    if(result.password == null || result.username == null){
        return new Response(
            JSON.stringify({
                message: "Failed to found the account, your username or your password is incorrect",
                error: true,
                error_source: "username_or_password"
            }),
        );
    } else{
        cookies.set("username", account_info.username, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            maxAge: 60*60*24*365
        });
        cookies.set("password", account_info.password, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            maxAge: 60*60*24*365
        });
        cookies.set("preferred_lang", account_info.preferred_lang, {
            httpOnly: true,
            path: "/",
            sameSite: "lax",
            maxAge: 60*60*24*365
        });
        return new Response(
            JSON.stringify({
                message: "success",
                error: false,
                error_source: "none"
            }),
        );
    }
}) satisfies APIRoute;
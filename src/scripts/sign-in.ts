import { env } from "cloudflare:workers";

export async function signIn(username: string, password: string){
    const response = await env.account.prepare("SELECT * FROM account_table WHERE username = ? AND password = ? LIMIT 1").bind(username, password).run();
    if(response.results.length == 1){
        return {
            "username": response.results[0].username as string,
            "password": response.results[0].password as string
        };
    }
    else{
        return {
            "username": null,
            "password": null
        };
    }
}
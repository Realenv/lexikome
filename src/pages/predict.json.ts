import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
export const prerender = false;

export const POST = (async ({ request }) => {
    const predict_criteria: {is_cat: boolean, to_search: string} = await request.json();
    const to_search = predict_criteria.to_search.trim();
    let pattern = [];
    for(const word of to_search.split(/\s+/)){
        let word_b = "";
        for(const letter of word){
            if(!(letter in ["_", "%", "[", "]", "^", "-", "{", "}"])){
                word_b += letter
            }
        }
        pattern.push(word_b);
    }
    const pattern_sqlite = "%" + pattern.join("%") + "%";
    const sql = predict_criteria.is_cat ?
        "SELECT * from words WHERE category LIKE ? LIMIT 5" :
        "SELECT * from words WHERE word LIKE ? LIMIT 5";
    const result = await env.lexikome_db.prepare(sql).bind(pattern_sqlite).run();

    if(result.success){
        return new Response(
            JSON.stringify({
                message: "success",
                error: false,
                error_source: "none",
                predictions: result.results
            }),
        );
    } else{
        return new Response(
            JSON.stringify({
                message: "Error when connecting to database",
                error: true,
                error_source: "db",
                predictions: null
            }),
        );
    }
}) satisfies APIRoute;
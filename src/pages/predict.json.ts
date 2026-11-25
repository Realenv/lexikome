import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
export const prerender = false;

export const POST = (async ({ request }) => {
    const predict_criteria: {to_search: string, num: number, lang: string[], lang_l: string[], categories: string[]} = await request.json();

    if(predict_criteria.to_search == undefined ||
        predict_criteria.num == undefined ||
        predict_criteria.lang == undefined ||
        predict_criteria.lang_l == undefined ||
        predict_criteria.categories == undefined ){
        return new Response(
            JSON.stringify({
                message: "Some json entries are undefined",
                error: true,
                error_source: "json",
                predictions: null,
                count: null
            }),
        );
    }
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
    if(predict_criteria.lang.length == 0 || predict_criteria.lang_l.length == 0){
        return new Response(
            JSON.stringify({
                message: "success",
                error: false,
                error_source: "none",
                predictions: [],
                count: null
            }),
        );
    }

    const sql = `SELECT * from words WHERE
         word LIKE ? AND
         language in (${Array.from({length: predict_criteria.lang.length}).fill("?")}) AND
         translation_language in (${Array.from({length: predict_criteria.lang_l.length}).fill("?")}) ${predict_criteria.categories.length == 0 ? "" : `AND
         category in (${Array.from({length: predict_criteria.categories.length}).fill("?")})`}
         LIMIT 5
         OFFSET ?`;
    const sql_count = `SELECT COUNT(*) from words WHERE
         word LIKE ? AND
         language in (${Array.from({length: predict_criteria.lang.length}).fill("?")}) AND
         translation_language in (${Array.from({length: predict_criteria.lang_l.length}).fill("?")}) ${predict_criteria.categories.length == 0 ? "" : `AND
         category in (${Array.from({length: predict_criteria.categories.length}).fill("?")})`}`;
    const result = await env.lexikome_db.prepare(sql).bind(pattern_sqlite, ...predict_criteria.lang, ...predict_criteria.lang_l, ...predict_criteria.categories, predict_criteria.num*5).run();
    const result_count = await env.lexikome_db.prepare(sql_count).bind(pattern_sqlite, ...predict_criteria.lang, ...predict_criteria.lang_l, ...predict_criteria.categories).run();

    if(result.success && result_count.success){
        return new Response(
            JSON.stringify({
                message: "success",
                error: false,
                error_source: "none",
                predictions: result.results,
                count: result_count.results[0]["COUNT(*)"]
            }),
        );
    } else{
        return new Response(
            JSON.stringify({
                message: "Error when connecting to database",
                error: true,
                error_source: "db",
                predictions: null,
                count: null
            }),
        );
    }
}) satisfies APIRoute;
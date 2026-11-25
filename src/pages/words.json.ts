import type { APIRoute } from "astro";
import { isLanguage, isLearnerLanguage } from "../types/types";
import { env } from "cloudflare:workers";

export async function get_words(entries: [string, string][]){
    let sql_bind: string[] = [];
    let sql_bind_2: string[] = [];
    let page = 0;
    for(const [key, value] of entries){
        if(value == "false"){
            if (!(key in sql_bind) && isLanguage(key)){
                sql_bind.push(key);
            }
            if (!(key in sql_bind_2) && key.length > 3 && isLearnerLanguage(key.slice(0, -2))){
                sql_bind_2.push(key.slice(0, -2));
            }
        }
        if(key == "page"){
            try{
                page = parseInt(value);
            } catch{
                page = 0;
            }
        }
    }
    let sql = "";
    const sql_order = " ORDER BY time_added ASC LIMIT 10 OFFSET "+(page*10).toString();
    if (sql_bind.length != 0 && sql_bind_2.length != 0){
        sql += "WHERE language not in (" + Array(sql_bind.length).fill("?").join(", ") + ") AND translation_language not in (" + Array(sql_bind_2.length).fill("?").join(", ") + ")";
    } else if(sql_bind.length != 0 && sql_bind_2.length == 0){
        sql += "WHERE language not in (" + Array(sql_bind.length).fill("?").join(", ") + ")";
    } else if(sql_bind.length == 0 && sql_bind_2.length != 0){
        sql += "WHERE language not in (" + Array(sql_bind_2.length).fill("?").join(", ") + ")";
    }
    const count_result = await env.lexikome_db.prepare("SELECT COUNT(*) FROM words "+sql).bind(...sql_bind.concat(sql_bind_2)).run();
    const count_all: number = Math.ceil((count_result.results[0]['COUNT(*)'] as number) / 10);
    const result = await env.lexikome_db.prepare("SELECT * FROM words "+sql+sql_order).bind(...sql_bind.concat(sql_bind_2)).run();
    let listOfWords = [];
    for(const word of result.results){
        listOfWords.push({word: word["word"] as string, learner_language: word["translation_language"] as string, context_aware_meanings: word["context_aware_meanings"] as string, language: word["language"] as string, category: word["category"] as string});
    }
    return {
        page_count: count_all,
        words: listOfWords
    };
}

export const GET = (async ({ url }) => {
    const entries: [string, string][] = url.searchParams.entries().toArray();
    return new Response(
        JSON.stringify(await get_words(entries))
    );
}) satisfies APIRoute;
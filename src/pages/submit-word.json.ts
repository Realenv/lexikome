import type { APIRoute } from "astro";
import { GoogleGenAI, Language } from '@google/genai';
import { env } from "cloudflare:workers";
import { SpeechifyClient } from "@speechify/api";
import { Octokit } from "@octokit/rest";
import { isLanguage, isLearnerLanguage } from "../types/types";
import { signIn } from "../scripts/sign-in";
import OpenAI from 'openai';
import { get_input, get_pattern, jsonWordSchema } from "../scripts/get_schema";
import { string } from "astro:schema";
const client = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL:"https://api.groq.com/openai/v1"
});

export const prerender = false;

const ai = new GoogleGenAI({apiKey: env.GEMINI_API_KEY});
const octokit = new Octokit({ auth: env.GITHUB_API_KEY });


async function getMeanings(words: string[], lang: string, model: string, translation_lang: string){
  return (await ai.models.generateContent({
    model: model,
    contents: get_input(lang, translation_lang, words, "gemini"),
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseJsonSchema: jsonWordSchema(lang, translation_lang, "gemini", words),
      systemInstruction: `You are a native ${lang} people explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language`,
    }
  })).text!;
}
async function getMeaningsFromOpenAI(words: string[], lang: string, model: [string, string], translation_lang: string){
  const openai_output = (await client.responses.create({
    model: model[0],
    max_output_tokens: 4000,
    input: get_input(lang, translation_lang, words, "openai"),
    instructions: `You are a native ${lang} people explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language`,
    temperature: 0.1,
  })).output_text;
  return (await client.responses.create({
    model: model[1],
    max_output_tokens: 4000,
    input: get_input(lang, translation_lang, words, "qwen", openai_output),
    instructions: `You are a native ${lang} people explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language`,
    temperature: 0.1,
    text: { format: jsonWordSchema(lang, translation_lang, "qwen", words) as ResponseFormatTextJSONSchemaConfig }
  })).output_text;
}
async function generateAudio(text: string, lang: string, male: boolean){
  const client = new SpeechifyClient({ token: env.SPEECHIFY_API_KEY });
  const mapping: {[key: string]: string[]} = {
    "turkish": ["tr", "yusuf", "aylin"],
    "english": ["en", "alfonso", "alicia"],
    "arabic": ["ar", "taym", "aicha"],
    "russian": ["ru", "tikhon", "vasilisa"],
    "french": ["fr", "augustine", "aurelie"]
  }
  const res = await client.audio.speech({
    input: text,
    voice_id: male ? mapping[lang][1] : mapping[lang][2],
    model: "simba-3.0",
    audio_format: "mp3",
    language: mapping[lang][0]
  });
  return res.audio_data;
}

export const POST = (async ({ request, cookies }) => {
  const words_to_add: {words: string[], lang: string, male: boolean, translation_lang: string, category: string} = await request.json();
  const password = cookies.get("password")?.value!;
  const username = cookies.get("username")?.value!;
  const result = await signIn(username, password);
  if(result.password == null || result.username == null){
    return new Response(
      JSON.stringify({
        message: "Failed to sign in",
        error: true,
        error_source: "account"
      }),
    );
  }
  if(!isLanguage(words_to_add.lang)){
    return new Response(
      JSON.stringify({
        message: "The word's language is not availidable for the moment",
        error: true,
        error_source: "lang"
      }),
    );
  } else if(!isLearnerLanguage(words_to_add.translation_lang)){
    return new Response(
      JSON.stringify({
        message: "Your language is not availidable for the moment",
        error: true,
        error_source: "translation_lang"
      }),
    );
  }
  const list_of_models: (["gemini", string] | ["openai", [string, string]])[] = [["gemini", "gemini-3.5-flash-lite"],
                          ["openai", ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]],
                          ["gemini", "gemini-3.1-flash-lite"],
                          ["openai", ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]],
                          ["gemini", "gemini-4-hydrogen"],
                          ["openai", ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]],
                          ["gemini", "gemini-3.8-flash"]];
  let context_aware_meanings = null;
  let madeWithOpenAI = null;
  for(const model of list_of_models){
    try{
      if(model[0] == "openai"){
        context_aware_meanings = await getMeaningsFromOpenAI(
          words_to_add.words,
          words_to_add.lang,
          model[1],
          words_to_add.translation_lang
        );
        madeWithOpenAI = true;
      } else{
        context_aware_meanings = await getMeanings(
          words_to_add.words,
          words_to_add.lang,
          model[1],
          words_to_add.translation_lang
        );
        madeWithOpenAI = false;
      }
      break;
    } catch(e){
      continue;
    }
  }
  if(!(context_aware_meanings)){
    return new Response(
      JSON.stringify({
        message: "Failed to generate the meanings",
        error: true,
        error_source: "text"
      }),
    );
  }
  
  let meanings = JSON.parse(context_aware_meanings);
  if(madeWithOpenAI){
    meanings = meanings;
  }
  try{
    for(const i in meanings){
      meanings[i].sha = (await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
        owner: 'realenv',
        repo: 'lexikome-audio-db',
        content: await generateAudio(meanings[i].raw_word, words_to_add.lang, true),
        encoding: 'base64',
        headers: {
          'X-GitHub-Api-Version': '2026-03-10'
        }
      })).data.sha;
      for(const z in meanings[i].context_aware_meanings){
        meanings[i].context_aware_meanings[z].sha = (await octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
          owner: 'realenv',
          repo: 'lexikome-audio-db',
          content: await generateAudio(meanings[i].context_aware_meanings[z].raw_example, words_to_add.lang, true),
          encoding: 'base64',
          headers: {
            'X-GitHub-Api-Version': '2026-03-10'
          }
        })).data.sha;
      }
    }
  } catch{
    return new Response(
      JSON.stringify({
        message: "Failed to generate the audio files",
        error: true,
        error_source: "audio"
      }),
    );
  }
  let sql = "INSERT INTO words (word, context_aware_meanings, language, translation_language, category)\nVALUES\n";
  let sql_bind = [];
  for(const word of meanings){
    sql += "(?, JSON(?), ?, ?, ?),\n";
    sql_bind.push(word.raw_word);
    sql_bind.push(JSON.stringify(word));
    sql_bind.push(words_to_add.lang);
    sql_bind.push(words_to_add.translation_lang);
    sql_bind.push(words_to_add.category);
  }
  sql = sql.slice(0, -2) + ";";
  try{
    await env.lexikome_db.prepare(sql).bind(...sql_bind).run();
  } catch{
    return new Response(
      JSON.stringify({
        message: "Failed to connect to the database",
        error: true,
        error_source: "database"
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
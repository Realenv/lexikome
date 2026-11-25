import type { APIRoute } from "astro";
import { GoogleGenAI, Language } from '@google/genai';
import { env } from "cloudflare:workers";
import { SpeechifyClient } from "@speechify/api";
import { Octokit } from "@octokit/rest";
import { isLanguage, isLearnerLanguage } from "../types/types";
import { signIn } from "../scripts/sign-in";
import OpenAI from 'openai';
import { arabic_alphabet, english_alphabet, french_alphabet, russian_alphabet, turkish_alphabet, universal_punctiation } from "../types/alphabets-ai-generated";
import { pronouns_by_tenses } from "../types/conjugation-ai-generated";
const client = new OpenAI({
  apiKey: env.GROQ_API_KEY,
  baseURL:"https://api.groq.com/openai/v1"
});

export const prerender = false;

const ai = new GoogleGenAI({apiKey: env.GEMINI_API_KEY});
const octokit = new Octokit({ auth: env.GITHUB_API_KEY });

const alphabet_matching: {[key: string]: string} = {
  "english": english_alphabet.join(""),
  "arabic": arabic_alphabet.join(""),
  "french": french_alphabet.join(""),
  "turkish": turkish_alphabet.join(""),
  "russian": russian_alphabet.join("")
};
const get_pattern = (language: string)=>{
  const pattern = `^[${alphabet_matching[language].concat(universal_punctiation.join(""))}]+$`;
  console.log(pattern);
  return pattern;
};
const jsonWordSchema = (word_language: string, learner_language: string, words: string[], string_pattern: string, string_pattern_l: string) => (
  {
    "type": "json_schema",
    "description": `Full descriptive flashcards of the words: ${"\""+words.join("\", \"")+"\""} in ${word_language} explained in ${learner_language}`,
    "strict": true,
    "name": "word_flashcards",
    "schema": {}
  }
);

async function getMeanings(word: string[], lang: string, model: string, translation_lang: string){
  return (await ai.models.generateContent({
    model: model,
    contents: "Give full explenations for theses words: \""+word.join("\", \"")+
    "\", if the word is a verb you give the conjugation"+
    "\nall of this respecting the laws of the json output, the translations are in learner's language, learner's language is "+translation_lang+
    "\nthe conjugation part of the output is in "+lang+
    ",\ngive all the possible meanings of the word,"+
    "\ngive ALL THE POSSIBLE TENSES AND PRONOUNS in the conjugation section, take care about the word's language's specifications, do not forget anything"+
    "\nwhen you give an example vary your words, and give the start index of the word and the end index of the word's delimitation in the both examples."+
    "\nBe very careful about the positions, they should work with the JS based 0-indexed array system",
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseJsonSchema: jsonWordSchema(lang, translation_lang, word, get_pattern(lang), get_pattern(translation_lang)).schema.properties.words,
      systemInstruction: `You are a native ${lang} people explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language`,
    }
  })).text!;
}
async function getMeaningsFromOpenAI(word: string[], lang: string, model: string, translation_lang: string){
  return (await client.responses.create({
    model: model,
    max_output_tokens: 4000,
    input: "Give full explenations for theses words: \""+word.join("\", \"")+
    "\", if the word is a verb you give the conjugation"+
    "\nall of this respecting the laws of the json output, the translations are in "+translation_lang+
    "\nthe conjugation part of the output is in "+lang+
    ",\ngive all the possible meanings of the word,"+
    "\ngive ALL THE POSSIBLE TENSES AND PRONOUNS in the conjugation section, take care about the word's language's specifications, do not forget anything"+
    "\nwhen you give an example vary your words, and give the start index of the word and the end index of the word's delimitation in the both examples."+
    "\nBe very careful about the positions, they should work with the JS based 0-indexed array system",
    instructions: `You are a native ${lang} people explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language`,
    temperature: 0.1,
    text: { format: jsonWordSchema(lang, translation_lang, word, get_pattern(lang), get_pattern(translation_lang)) as ResponseFormatTextJSONSchemaConfig }
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
  const list_of_models: ["openai" | "gemini", string][] = [["gemini", "gemini-3.5-flash-lite"],
                          ["openai", "openai/gpt-oss-120b"],
                          ["gemini", "gemini-3.1-flash-lite"],
                          ["openai", "qwen/qwen3.8-27b"],
                          ["gemini", "gemini-4-hydrogen"],
                          ["openai", "openai/gpt-oss-20b"],
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
      if(model[0] == "openai"){
      console.log(e);}
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
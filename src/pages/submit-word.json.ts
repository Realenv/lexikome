import type { APIRoute } from "astro";
import { GoogleGenAI, Language } from '@google/genai';
import { env } from "cloudflare:workers";
import { SpeechifyClient } from "@speechify/api";
import { Octokit } from "@octokit/rest";
import { isLanguage, isLearnerLanguage } from "../types/types";
import { signIn } from "../scripts/sign-in";

export const prerender = false;

const ai = new GoogleGenAI({apiKey: env.GEMINI_API_KEY});
const octokit = new Octokit({ auth: env.GITHUB_API_KEY });

let jsonWordSchema = {
  "type": "array",
  "title": "All descriptive flashcards of specified words",
  "description": "A full descriptive flashcards of specified words in a specific language explained in learner's language",
  "items": {
    "type": "object",
    "title": "Full descriptive flashcard of a specified word",
    "desciption": "A full descriptive flashcard of a specified word in a specific language explained in learner's language",
    "properties": {
      "raw_word": {"type": "string", "description": "The raw non translated word", "title": "Raw word", "enum": [""]},
      "context_aware_meanings": {
        "title": "The meanings of the specific word",
        "description": "single or multiple pair of examples in the specified language and translations in learner's language, the number of examples is depending on the number of meanings the specified word has",
        "type": "array",
        "items": {
          "type": "object",
          "title": "An example and his translation",
          "description": "Two examples, the first one is in the specified language, and the second one is a learner's language translation of the original example, it is a specific use case of the word with a unique meaning",
          "properties": {
            "senses": {
              "type": "array",
              "title": "senses of the word",
              "description": "All the most accurate translated words describing the original word in a specific use case, depending on the meaning in the illustrated example, it can be one or more",
              "items": {
                "title": "The specific sense in learner's language",
                "desciption": "The specific sense depending on the provided example's context",
                "type": "string"
              },
              "minItems": 1,
              "uniqueItems": true
            },
            "raw_example": {
              "type": "string",
              "description": "A non-translated example of a specific use case of the specified word where the meaning is not the same that his use case in an another context",
              "title": "Non-translated example"
            },
            "pos_word_start_index_raw_example": {
              "type": "number",
              "title": "Start position of the word",
              "description": "The start position of the word in the raw example using zero-indexing system"
            },
            "pos_word_end_index_raw_example": {
              "type": "number",
              "title": "End position of the word",
              "description": "The end position of the word in the raw example using zero-indexing system"
            },
            "translated_example": {
              "type": "string",
              "description": "A translated in learner's language example of a specific use case of the specified word where the meaning is not the same that his use case in an another context",
              "title": "Learner's language translated example"
            },
            "pos_word_start_index_translated_example": {
              "type": "number",
              "title": "Start position of the word",
              "description": "The start position of the word in the translated example using zero-indexing system"
            },
            "pos_word_end_index_translated_example": {
              "type": "number",
              "title": "End position of the word",
              "description": "The end position of the word in the translated example using zero-indexing system"
            },
          },
          "required": ["senses", "raw_example", "pos_word_start_index_raw_example", "pos_word_end_index_raw_example", "pos_word_start_index_translated_example", "pos_word_end_index_translated_example", "translated_example"],
          "additionalProperties": false
        },
        "minItems": 1,
        "uniqueItems": true
      },
      "conjugation": {
        "title": "Conjugation of the specified word",
        "description": "The full conjugation of the specified word in all of the possible tenses and pronons depending on the word's language's specifications",
        "type": "array",
        "items": {
          "type": "object",
          "title": "Conjugation of the verb in a specific tense",
          "description": "The full conjugation of the specified verb in a specific tense and all his corresponding pronons depending on the word's language's specifications",
          "properties": {
            "tense_name": {
              "type": "string",
              "title": "Name of the tense",
              "description": "The name of the specific tense"
            },
            "conjugation": {
              "type": "array",
              "title": "Pairs of pronons with conjugated verbs",
              "description": "The all pairs of pronons and conjugated verbs in the specific pronon in the specified language",
              "items": {
                "type": "object",
                "title": "The pair of pronoun with the conjugated verb",
                "description": "The pair of pronoun with the conjugated verb in the specific language according the language's specifications and exceptions",
                "properties": {
                  "pronoun": {
                    "type": "string",
                    "description": "The pronoun used to conjugate the specific verb in his language",
                    "title": "The pronoun"
                  },
                  "conjugated_verb": {
                    "type": "string",
                    "title": "The conjugated verb",
                    "description": "This conjugation of the specific verb with the specific pronoun in the specified language"
                  }
                },
                "required": ["pronoun", "conjugated_verb"],
                "additionalProperties": false
              },
              "minItems": 1,
              "uniqueItems": true
            },
            "additionalProperties": false
          },
          "required": ["tense_name", "conjugation"],
        },
      }
    },
    "required": ["context_aware_meanings", "raw_word"],
    "uniqueItems": true
  },
  "minItems": 1,
  "maxItems": 1,
  "uniqueItems": true
}
function getMeanings(word: string[], lang: string, model: string, translation_lang: string){
  return ai.models.generateContent({
    model: model,
    contents: "Give full explenations for theses words: \""+word.join("\", \"")+
    "\", if the word is a verb you give the conjugation"+
    "\nall of this respecting the laws of the json output, the translations are in learner's language, learner's language is "+translation_lang+
    "\nthe conjugation part of the output is in "+lang+
    ",\ngive all the possible meanings of the word,"+
    "\ngive ALL THE POSSIBLE TENSES AND PRONOUNS in the conjugation section, take care about the word's language's specifications, do not forget anything"+
    "\nwhen you give an example vary your words, and give the start index of the word and the end index of the word's delimitation in the both examples."+
    "\nBe very careful about the positions, they should work with this code:<h5> { meaning.translated_example.slice( 0, meaning.pos_word_start_index_translated_example ) } <span class='join_word'> { meaning.translated_example.slice( meaning.pos_word_start_index_translated_example, meaning.pos_word_end_index_translated_example ) } </span> { meaning.translated_example.slice( meaning.pos_word_end_index_translated_example ) } </h5>",
    config: {
      responseMimeType: "application/json",
      temperature: 0.1,
      responseJsonSchema: jsonWordSchema,
      systemInstruction: "You are a native learner's language person explaining in accurate words the meaning of a word in a foreign language, respecting the specificities of the foreign language and the cultural and lexical differences between learner's language and other language"
    }
  });
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

export const POST = (async ({ request, cookies, redirect }) => {
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
  const list_of_models = ["gemini-3.5-flash-lite",
                          "gemini-3.1-flash-lite",
                          "gemini-4-hydrogen",
                          "gemini-3.8-flash",
                          "gemini-2.5-flash"];
  jsonWordSchema.maxItems = words_to_add.words.length;
  jsonWordSchema.minItems = words_to_add.words.length;
  jsonWordSchema.items.properties.raw_word.enum = words_to_add.words;
  let context_aware_meanings = null;
  
  for(const model of list_of_models){
    try{
      context_aware_meanings = await getMeanings(words_to_add.words, words_to_add.lang, model, words_to_add.translation_lang);
      break;
    } catch(e){
      continue;
    }
  }
  if(!(context_aware_meanings?.text)){
    return new Response(
      JSON.stringify({
        message: "Failed to generate the meanings",
        error: true,
        error_source: "text"
      }),
    );
  }

  let meanings = JSON.parse(context_aware_meanings.text!);
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
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
const get_conjugation_from_pronouns_and_pattern = (tense: string, language: string, pronouns: string[], string_pattern: string) => {
  let all_pairs: {[key: string]: {[key: string]: string}} = {};
  for(const pronoun of pronouns){
    all_pairs[pronoun] = {
      "type": "string",
      "title": `The conjugated ${language} verb`,
      "description": `The conjugated ${language} verb in \"${tense}\" tense with the \"${pronoun}\" pronoun`,
      "pattern": string_pattern
    };
  }
  return all_pairs
}
const get_conjugation_by_tenses = (language: string)=>{
  Object.entries(pronouns_by_tenses[language]).forEach(tense_with_pronouns => ({
    "type": "object",
    "title": `Conjugation of the verb in ${tense_with_pronouns[0]}`,
    "description": `The full conjugation of the specified verb in ${tense_with_pronouns[0]} tense with the following pronouns: ${tense_with_pronouns[1].join(",")}`,
    "properties": {
      "conjugation": {
        "type": "object",
        "title": `Pairs of pronouns with conjugated verbs in ${language}`,
        "description": `Pairs of pronons with conjugated verbs in ${language} in ${tense_with_pronouns[0]} tense`,
        "properties": get_conjugation_from_pronouns_and_pattern(tense_with_pronouns[0], language, tense_with_pronouns[1], get_pattern(language)),
        "additionalProperties": false,
        "required": tense_with_pronouns[1],
      },
    },
    "additionalProperties": false,
    "required": ["conjugation"],
  }))
}
const jsonWordSchema = (word_language: string, learner_language: string, words: string[], string_pattern: string, string_pattern_l: string) => (
  {
    "type": "json_schema",
    "description": `Full descriptive flashcards of the words: ${"\""+words.join("\", \"")+"\""} in ${word_language} explained in ${learner_language}`,
    "strict": true,
    "name": "word_flashcards",
    "schema": {
      "type": "object",
      "description": `Some full descriptive flashcards of the words: ${"\""+words.join("\", \"")+"\""} in ${word_language} explained in ${learner_language}`,
      "title": "Full descriptive flashcards",
      "properties": {
        "words": {
          "type": "array",
          "title": "All descriptive flashcards of specified words",
          "description": `Some full descriptive flashcards of the words: ${"\""+words.join("\", \"")+"\""} in ${word_language} explained in ${learner_language}`,
          "items": {
            "type": "object",
            "title": `A full descriptive flashcard of a word from these ones: ${"\""+words.join("\", \"")+"\""}`,
            "desciption": `A full descriptive flashcard of a specified word in ${word_language} explained in ${learner_language}`,
            "properties": {
              "raw_word": { "type": "string", "pattern": string_pattern, "description": "The raw non translated word", "title": "Raw word", "enum": words },
              "context_aware_meanings": {
                "title": "The meanings of the specific word",
                "description": `single or multiple pair of examples in ${word_language} and translations in ${learner_language}, the number of examples is depending on the number of meanings the specified word has`,
                "type": "array",
                "items": {
                  "type": "object",
                  "title": "An example and his translation",
                  "description": `An example in ${word_language}, and his translation in ${learner_language}, it is a specific use case of the ${word_language} word in a specific example`,
                  "properties": {
                    "senses": {
                      "type": "array",
                      "title": "senses of the word",
                      "description": `All the most accurate ${learner_language} words describing the ${word_language} word in a specific use case, depending on the meaning in the illustrated example, it can be one or more`,
                      "items": {
                        "title": `The specific sense of the ${word_language} word in ${learner_language}`,
                        "desciption": `The specific sense of the ${word_language} word depending on the provided example's context`,
                        "type": "string",
                        "pattern": string_pattern_l
                      },
                      "minItems": 1,
                    },
                    "raw_example": {
                      "type": "string",
                      "description": `A ${word_language} example of a specific use case of the specified word where the meaning is not the same that his use case in an another context`,
                      "title": `Non-translated ${word_language} example`,
                      "pattern": string_pattern
                    },
                    "pos_word_start_index_raw_example": {
                      "type": "number",
                      "maximum": 300,
                      "minimum": 0,
                      "title": `Start position of the ${word_language} word`,
                      "description": `The inclusive start position index of the ${word_language} word in the raw example using zero-based indexing`
                    },
                    "pos_word_end_index_raw_example": {
                      "type": "number",
                      "maximum": 300,
                      "minimum": 1,
                      "title": `End position of the ${word_language} word`,
                      "description": `The non inclusive end position index of the ${word_language} word in the raw example using zero-based indexing`
                    },
                    "translated_example": {
                      "type": "string",
                      "description": `The translation of the raw ${word_language} example in ${learner_language}`,
                      "title": `${learner_language} translated example`,
                      "pattern": string_pattern_l
                    },
                    "pos_word_start_index_translated_example": {
                      "type": "number",
                      "maximum": 300,
                      "minimum": 0,
                      "title": `Start position of the ${learner_language} word`,
                      "description": `The start inclusive position index of the ${learner_language} word in the ${learner_language} translated example using zero-based indexing`
                    },
                    "pos_word_end_index_translated_example": {
                      "type": "number",
                      "maximum": 300,
                      "minimum": 1,
                      "title": `End position of the ${learner_language} word`,
                      "description": `The end non inclusive position index of the ${learner_language} word in the ${learner_language} translated example using zero-based indexing`                    },
                  },
                  "required": ["senses", "raw_example", "pos_word_start_index_raw_example", "pos_word_end_index_raw_example", "pos_word_start_index_translated_example", "pos_word_end_index_translated_example", "translated_example"],
                  "additionalProperties": false
                },
                "minItems": 1,
              },
              "conjugation": {
                "title": `Conjugation of the verbs`,
                "description": `The full conjugation of the verbs extracted from these ${word_language} words: ${"\""+words.join("\", \"")+"\""} in the following tenses: ${Object.entries(pronouns_by_tenses[word_language]).join(", ")}`,
                "type": ["array", "null"],
                "items": get_conjugation_by_tenses(word_language),
              }
            },
            "additionalProperties": false,
            "required": ["context_aware_meanings", "raw_word", "conjugation"]
          },
          "minItems": words.length,
          "maxItems": words.length
        },
      },
      "required": ["words"],
      "additionalProperties": false
    }
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
  const list_of_models: ["openai" | "gemini", string][] = [["gemini", "geamini-3.5-flash-lite"],
                          ["openai", "openai/gpt-oss-120b"],
                          ["gemini", "geamini-3.1-flash-lite"],
                          ["openai", "qwen/qwen3.8-27b"],
                          ["gemini", "geamini-4-hydrogen"],
                          ["openai", "openai/gpt-oss-20b"],
                          ["gemini", "geamini-3.8-flash"]];
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
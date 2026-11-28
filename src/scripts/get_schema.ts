import { arabic_alphabet, english_alphabet, french_alphabet, russian_alphabet, turkish_alphabet, universal_punctiation } from "../types/alphabets-ai-generated";
import { pronouns_by_tenses } from "../types/conjugation-ai-generated";
import type { AIProviderSource } from "../types/types";

export const alphabet_matching: {[key: string]: string} = {
  "english": english_alphabet.join(""),
  "arabic": arabic_alphabet.join(""),
  "french": french_alphabet.join(""),
  "turkish": turkish_alphabet.join(""),
  "russian": russian_alphabet.join("")
};
export const get_pattern = (language: string)=>(
  `^[${alphabet_matching[language].concat(universal_punctiation.join(""))}]+$`
);
export const jsonWordSchema = (word_language: string, learner_language: string, source: AIProviderSource, words: string[]) => {
  const joined_words = "\""+words.join("\", \"")+"\"";
  let properties = {};
  for(const word of words){
    Object.assign(properties, {[word]: {
      "type": "object",
      "title": `flashcard of the word \"${word}\"`,
      "description": `The meanings of the ${word_language} word: \"${word}\", and his conjugation if it is a verb, ${get_conjugation_input(word_language)}`,
      "properties": {
        "context_aware_pairs_of_examples": {
          "type": "array",
          "title": `The all possible pairs of examples describing all the possible meanings for the ${word_language} word: \"${word}\"`,
          "description": `The all possible pairs of examples describing all the possible meanings for the ${word_language} word: \"${word}\", where each meaning describe a unique sense that the others meanings do not describe, so the word become context aware meaning, each pair of example is composed of an original example in ${word_language} and an accurate translation in ${learner_language}`,
          "items": {
            "type": "object",
            "description": `A pair of examples describing a possible meaning for the ${word_language} word: \"${word}\", where the meaning describe a unique sense that the others meanings do not describe, so the word become context aware meaning, the pair of example is composed of an original example in ${word_language} and an accurate translation in ${learner_language}`,
            "title": "A pair of examples describing a possible meaning for the ${word_language} word: \"${word}\"",
            "properties": {
              "unique_senses": {
                "type": "array",
                "title": "All the possible senses in the specified example",
                "description": `All the possible corresponding ${learner_language} words to describe the ${word_language} word: \"${word}\" in the choosed ${word_language} example`,
                "minItems": 1,
                "maxItems": 5,
                "items": {
                  "type": "string",
                  "title": "A possible sense that fit to the specified example's context meaning",
                  "description": `A possible corresponding ${learner_language} word to describe the ${word_language} word: \"${word}\" in the choosed ${word_language} example`,
                  "pattern": get_pattern(learner_language)
                }
              },
              "original_example": {
                "type": "string",
                "title": `The original ${word_language} example describing a possible meaning for the ${word_language} word: \"${word}\"`,
                "pattern": get_pattern(word_language)
              },
              "translated_example": {
                "type": "string",
                "title": `The ${learner_language} translated example describing a possible meaning for the ${word_language} word: \"${word}\"`,
                "pattern": get_pattern(learner_language)
              },
              "pos_word_start_in_original_example": {
                "type": "number",
                "description": `The start index position of the corresponding word in the original ${word_language} example for the ${word_language} word: \"${word}\" (using the JS zero based indexing principle, spaces are included as characters)`,
                "title": `The start position of the word ${word} in the ${word_language} example`,
                "minimum": 0,
                "maximum": 500
              },
              "pos_word_end_in_original_example": {
                "type": "number",
                "description": `The end inclusive index position of the corresponding word in the original ${word_language} example for the ${word_language} word: \"${word}\" (using the JS zero based indexing principle, spaces are included as characters)`,
                "title": `The end position of the word ${word} in the ${word_language} example`,
                "minimum": 0,
                "maximum": 500
              },
              "pos_word_start_in_translated_example": {
                "type": "number",
                "description": `The start index position of the corresponding word in the original ${learner_language} example for the ${word_language} word: \"${word}\" (using the JS zero based indexing principle, spaces are included as characters)`,
                "title": `The start position of the word ${word} in the ${learner_language} example`,
                "minimum": 0,
                "maximum": 500
              },
              "pos_word_end_in_translated_example": {
                "type": "number",
                "description": `The end inclusive index position of the corresponding word in the original ${learner_language} example for the ${word_language} word: \"${word}\" (using the JS zero based indexing principle, spaces are included as characters)`,
                "title": `The end position of the word ${word} in the ${learner_language} example`,
                "minimum": 0,
                "maximum": 500
              }
            },
            "required": [
              "unique_senses",
              "original_example",
              "translated_example",
              "pos_word_start_in_original_example",
              "pos_word_end_in_original_example",
              "pos_word_start_in_translated_example",
              "pos_word_end_in_translated_example"
            ],
            "additionnalProperties": false
          },
          "minItems": 1,
          "maxItems": 15
        },
        "conjugation": {
          "type": ["object", "null"],
          "title": `The full conjugation of the word ${word} if it is a verb`,
          "description": `The full conjugation of the word ${word} if it is a verb ${get_conjugation_input(word_language)}`,
          "properties": get_conjugation_pattern(word_language, word),
          "required": Object.keys(pronouns_by_tenses[word_language])
        }
      },
      "additionnalProperties": false
    }});
  }
  const schema = {
    "type": "object",
    "properties": properties,
    "additionnalProperties": false,
    "required": words
  };
  if(source == "openai" || source == "qwen"){
    return {
      "type": "json_schema",
      "description": `Full descriptive word descriptions for the following ${word_language} words: ${joined_words}, explained in ${learner_language} expect the conjugation if it is a verb which is in ${word_language}`,
      "strict": true,
      "name": "word_flashcards",
      "schema": schema
    };
  } else if(source == "gemini"){
    return schema
  }
};
export const get_conjugation_pattern = (word_language: string, word: string)=>{
    let pattern = {};
    for(const tense of Object.entries(pronouns_by_tenses[word_language])){
        let pronouns = {};
        for(const pronoun of tense[1]){
          Object.assign(pronouns, {[pronoun]: {
            "title": `Conjugation of the verb ${word} in the ${tense[0]} tense with the ${pronoun} pronoun`,
            "description": `The conjugation of the verb ${word} in the ${tense[0]} tense with the ${pronoun} pronoun`,
            "type": "string",
            "pattern": get_pattern(word_language)
          }});
        }
        Object.assign(pattern, {[tense[0]]: {
          "type": "object",
          "title": `The conjugation of the verb ${word} in the ${tense[0]} tense`,
          "description": `The conjugation of the verb ${word} in the ${tense[0]} tense for the following pronouns: \"${tense[1].join("\", \"")}\"`,
          "properties": pronouns,
          "required": tense[1]
        }});
    }
    return pattern
}
export const get_conjugation_input = (word_language: string)=>{
    let input = "";
    input += "if the word is a verb you give the conjugation of the word in the following tenses and their corresponding pronouns:\n";
    let first = true;
    for(const tense of Object.entries(pronouns_by_tenses[word_language])){
        if(first){
            input += `Conjugate the verb in ${tense[0]} with the following pronouns: "${tense[1].join("\", \"")}",\n`;
        }else{
            input += `And you conjugate the verb in ${tense[0]} with the following pronouns: "${tense[1].join("\", \"")}",\n`;

        }
        first = false;
    }
    return input
}


export const get_input = (word_language: string, translation_lang: string, words: string[], source: AIProviderSource, openai_ouput: string | null = null) => {
  if(source == "gemini"){
    return   `Give full explenations for theses words: \"${words.join("\", \"")}\",
              the translations are in ${translation_lang},
              ${get_conjugation_input(translation_lang)}
              give all the possible meanings of the word with pairs example composed of the original example and the translated example, and give the index position of the word and its end position in both the translated and the original example,
              give the start index of the word and the end index of the word's delimitation in the both examples.
              Be very careful about the indexes, they should work with the JS zero based indexing`
  } else if(source == "openai"){
    return   `Give full explenations for theses words: \"${words.join("\", \"")}\",
              the translations are in ${translation_lang},
              ${get_conjugation_input(translation_lang)}
              give all the possible meanings of the word with pairs example composed of the original example and the translated example, and give the index position of the word and its end position in both the translated and the original example,
              give the start index of the word and the end index of the word's delimitation in the both examples.
              Be very careful about the indexes, they should work with the JS zero based indexing
              Return your response in json format, respecting the following json schema: ${JSON.stringify(jsonWordSchema(word_language, translation_lang, source, words), null, 1)}`
  } else if(source == "qwen" && openai_ouput != null){
    return   `Give full explenations for theses words: \"${words.join("\", \"")}\",
              the translations are in ${translation_lang},
              ${get_conjugation_input(translation_lang)}
              give all the possible meanings of the word with pairs example composed of the original example and the translated example, and give the index position of the word and its end position in both the translated and the original example,
              give the start index of the word and the end index of the word's delimitation in the both examples.
              Be very careful about the indexes, they should work with the JS zero based indexing,
              All of this based on this ai provided output: "${openai_ouput}"`
  } else{
    throw new Error("The source is Qwen but the openai output is not provided");
  }
}
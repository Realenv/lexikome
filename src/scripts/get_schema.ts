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
  const schema = {
    "type": "object",
    "title": "All the words",
    "properties": {
      "all_words": {
        "type": "array",
        "title": "All the words",
        "maxItems": words.length,
        "minItems": words.length,
        "items": {
          "type": "object",
          "title": `flashcard of the word`,
          "description": `The meanings of the ${word_language} word, and his conjugation if it is a verb, otherwise null`,
          "properties": {
            "raw_word": {
              "type": "string",
              "title": "The word",
              "enum": words,
              "pattern": get_pattern(word_language)
            },
            "context_aware_pairs_of_examples": {
              "type": "array",
              "title": `The all possible pairs of examples describing all the possible meanings`,
              "items": {
                "type": "object",
                "description": `A pair of examples describing a possible meaning for the word, where the meaning describe a unique sense that the others meanings do not describe, the pair of example is composed of an original example in ${word_language} and an accurate translation in ${learner_language}`,
                "title": "A pair of examples describing a possible meaning for the word",
                "properties": {
                  "unique_senses": {
                    "type": "array",
                    "title": "All the possible senses of the word in the specified example",
                    "minItems": 1,
                    "maxItems": 5,
                    "items": {
                      "type": "string",
                      "title": "A possible sense that fit to the specified example's context meaning",
                      "pattern": get_pattern(learner_language)
                    }
                  },
                  "original_example": {
                    "type": "string",
                    "title": `The original ${word_language} example`,
                    "pattern": get_pattern(word_language)
                  },
                  "translated_example": {
                    "type": "string",
                    "title": `The ${learner_language} translated example`,
                    "pattern": get_pattern(learner_language)
                  },
                  "pos_word_start_in_original_example": {
                    "type": "number",
                    "title": `The start position of the word in the ${word_language} example`,
                    "minimum": 0,
                    "maximum": 500
                  },
                  "pos_word_end_in_original_example": {
                    "type": "number",
                    "title": `The end position of the word in the ${word_language} example`,
                    "minimum": 0,
                    "maximum": 500
                  },
                  "pos_word_start_in_translated_example": {
                    "type": "number",
                    "title": `The start position of the word in the ${learner_language} translated example`,
                    "minimum": 0,
                    "maximum": 500
                  },
                  "pos_word_end_in_translated_example": {
                    "type": "number",
                    "title": `The end position of the word in the ${learner_language} translated example`,
                    "minimum": 0,
                    "maximum": 500
                  }
                },
                "additionalProperties": false,
                "required": [
                  "unique_senses",
                  "original_example",
                  "translated_example",
                  "pos_word_start_in_original_example",
                  "pos_word_end_in_original_example",
                  "pos_word_start_in_translated_example",
                  "pos_word_end_in_translated_example"
                ],
              },
              "minItems": 1,
              "maxItems": 15,
            },
            "conjugation": {
              "type": ["array", "null"],
              "title": `Conjugation of the word if it is a verb`,
              "description": `Conjugation of the word if it is a verb, otherwise null`,
              "items": get_conjugation_pattern(word_language),
              "minItems": 1,
              "maxItems": Object.keys(pronouns_by_tenses[word_language]).length
            }
          },
          "additionalProperties": false,
          "required": ["context_aware_pairs_of_examples", "conjugation", "raw_word"]
        }
      }
    },
    "additionalProperties": false,
    "required": ["all_words"]
  };
  if(source == "openai" || source == "qwen"){
    return {
      "type": "json_schema",
      "description": `Full descriptive word descriptions for the following ${word_language} words: ${joined_words}, explained in ${learner_language} expect the conjugation if it is a verb which is in ${word_language}`,
      "strict": true,
      "name": "word_flashcards",
      "schema": schema
    };
  } else {
    return schema
  }
};
export const get_conjugation_pattern = (word_language: string)=>{
  let pronouns = new Set<string>([]);
  for(const tense of Object.values(pronouns_by_tenses[word_language])){
    for(const pronoun of tense){
      pronouns.add(pronoun);
    }
  }
  let pattern = {
      "type": "object",
      "title": `Conjugation of the ${word_language} verb`,
      "properties": {
        "tense_name": {
          "type": "string",
          "pattern": get_pattern(word_language),
          "title": "Name of the tense",
          "enum": Object.keys(pronouns_by_tenses[word_language])
        },
        "pronoun_verb_pairs": {
          "type": "array",
          "minItems": 0,
          "title": "Pairs of pronouns with corresponding conjugated verbs",
          "maxItems": [...pronouns].length,
          "items": {
            "type": "object",
            "title": "Pair of pronoun with the conjugated verb",
            "properties": {
              "pronoun": {
                "type": "string",
                "pattern": get_pattern(word_language),
                "title": "The pronoun",
                "enum": [...pronouns]
              },
              "verb": {
                "title": "The conjugated verb",
                "type": "string",
                "pattern": get_pattern(word_language),
              }
            },
            "required": ["verb", "pronoun"],
            "additionalProperties": false
          }
        }
      },
      "required": ["tense_name", "pronoun_verb_pairs"],
      "additionalProperties": false
    };
    return pattern
}
export const get_conjugation_input = (word_language: string)=>{
    let input = "";
    input += "if the word is a verb you give the conjugation of the word in the following tenses and their corresponding pronouns:\n";
    let first = true;
    for(const tense of Object.entries(pronouns_by_tenses[word_language])){
      `The \"${tense[0]}\" tense with the following pronouns: "${tense[1].join("\", \"")}",\n`;
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
    return `Give full explenations for theses words: \"${words.join("\", \"")}\",
give all the possible meanings of the word with pairs example composed of the original example and the translated example,
return the meanings in csv format with the following columns: senses, ${word_language}_example, ${translation_lang}_translated_example
${get_conjugation_input(translation_lang)}
return the conjugation in csv format with the following columns: tense_name, pronoun, conjugated_verb`
  } else if(source == "qwen" && openai_ouput != null){
    return `Give full explenations for theses words: \"${words.join("\", \"")}\",
the translations are in ${translation_lang},
${get_conjugation_input(translation_lang)}
give all the possible meanings of the word with pairs example composed of the original example and the translated example, and give the index position of the word and its end position in both the translated and the original example,
give the start index of the word and the end index of the word's delimitation in the both examples.
Be very careful about the indexes, they should work with the JS zero based indexing,
All of this based on this ai provided csv output: "${openai_ouput}"`
  } else{
    throw new Error("The source is Qwen but the openai output is not provided");
  }
}
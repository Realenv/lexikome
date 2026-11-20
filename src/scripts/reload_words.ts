export async function reload_words(url_to_fetch: URL){
    const { page_count, words }: {page_count: number, words: {category:string, context_aware_meanings:string, language:string, learner_language:string, word:string}[]} = await (await fetch(url_to_fetch)).json();
    const container = document.getElementById("container")!;
    container.innerHTML = "";
    for(const word of words){
        const url = new URL("/word", url_to_fetch.origin);
        url.searchParams.append("word", word.word);
        url.searchParams.append("context_aware_meanings", word.context_aware_meanings);
        url.searchParams.append("category", word.category);
        url.searchParams.append("language", word.language);
        console.log(await (await fetch(url.href)).text());
        const div = document.createElement("div");
        div.innerHTML = await (await fetch(url.href)).text();
        container.appendChild(div);
    }
}
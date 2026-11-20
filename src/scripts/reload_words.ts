export async function reload_words(url_to_fetch: URL){
    const { page_count, words }: {page_count: number, words: {category:string, context_aware_meanings:string, language:string, learner_language:string, word:string}[]} = await (await fetch(url_to_fetch)).json();
    const container = document.getElementById("container")!;
    container.innerHTML = "";
    for(const word of words){
        const div = document.createElement("div");
        div.innerHTML = await (
            await fetch(new URL("/word", url_to_fetch.origin), {
                method: "POST",
                body: JSON.stringify(word),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })).text();
        container.appendChild(div);
    }
}
export async function reload_words(url_to_fetch: URL){
    console.log(url_to_fetch.href);
    const { page_count, words }: {page_count: number, words: {category:string, context_aware_meanings:string, language:string, learner_language:string, word:string}[]} = await (await fetch(url_to_fetch)).json();
    const container = document.getElementById("container")!;
    container.innerHTML = "";
    const pagination = document.createElement("div")!;
    pagination.classList.add("pagination");
    for(let i=0; i<page_count; i++){
        const btn = document.createElement("button")!;
        btn.innerHTML = i.toString();
        btn.addEventListener("click", async ()=>{
            const url = new URL(window.location.href);
            url.searchParams.set("page", i.toString());
            let url_to_send = new URL("/words.json", window.location.origin);
            url.searchParams.forEach((value, key)=>{
                url_to_send.searchParams.set(key, value);
            });
            window.history.replaceState("", "", url);
            await reload_words(url_to_send);
        });
        pagination.appendChild(btn);
    }
    container.appendChild(pagination);
    words.forEach(async (word, i)=>{
        const div = document.createElement("div");
        let total_word: any = word;
        total_word.i = i;
        div.innerHTML = await (
            await fetch(new URL("/word", url_to_fetch.origin), {
                method: "POST",
                body: JSON.stringify(total_word),
                headers: {
                    "Content-type": "application/json; charset=UTF-8"
                }
            })).text();
        container.appendChild(div);
    });
    container.appendChild(pagination.cloneNode(true));
}
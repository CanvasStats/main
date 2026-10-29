import { loadSearchBar } from "../modules/templates.module";
import { makeElement } from "../modules/utils.module";

export async function renderFAQ(container: HTMLElement) {
    loadSearchBar();
    document.title = "F.A.Q. | Canvas Stats";
    container.innerHTML = "";
    const main = makeElement("main", "mainContent", null, null);

    const pageHeading = makeElement("h1", null, null, "Frequently Asked Questions");

    const questions: {question: string, answer: string}[] = [
        {
            question: "I used a different account in a previous year, can you link my accounts so it shows I participated every year?",
            answer: "User rankings and stats are generated based on username and the database has no way of knowing that 2 different accounts are the same person. If you want, you can choose which username you want to keep, then we will merge the stats and delete the other account from the database. Message @the_real_monte with both usernames and which one you want to keep. We will send both a message to both accounts to verify you own both. If the instance has shut down, verification will not be necessary as long as the usernames match."
        },
        {
            question: "How did you get the data for the stats?",
            answer: "The database log gets posted on Lemmy after the event has ended. We use sqlite and python to generate the statistics. The stats are stored in csv files on Github. The website runs on Angular and is hosted on GitHub Pages."
        },
        {
            question: "Can I suggest a feature for the site or request an image that isn't on the site?",
            answer: "Sure! Just send a message to @the_real_monte with your suggestion/request and we will try to add it to the site."
        },
        {
            question: "I have a question that isn't on this page.",
            answer: "Send your question to @the_real_monte"
        }
    ];

    const questionsSection = questions.reduce((acc: HTMLElement, currQ: {question: string, answer: string}) => {
        const nextQ = makeElement("h2", null, null, `Q: "${currQ.question}"`);
        const nextA = makeElement("p", null, null, `A: ${currQ.answer}`);
        const hr = document.createElement("hr");
        acc.append(nextQ, nextA, hr);
        return acc;
    }, makeElement("section", "question", null, null));
    const hrs = questionsSection.querySelectorAll("hr");
    hrs[hrs.length - 1].remove();
    main.append(pageHeading, questionsSection);
    container.appendChild(main);

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}
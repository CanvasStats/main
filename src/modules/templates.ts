import { navigateTo } from "./navigate";
import { makeElement } from "./utils";

function createLinkWithIcon(data: LinkWithIcon) {
    const linkElem = document.createElement("a") as HTMLAnchorElement;
    linkElem.href = data.href;
    if (data.materialIcon) {
        const linkIcon = makeElement("span", null, "material-symbols-outlined", data.materialIcon);
        linkElem.appendChild(linkIcon);
    }
    if (data.svgSrc) {
        const linkIcon = document.createElement("img") as HTMLImageElement;
        linkIcon.src = data.svgSrc;
        linkElem.appendChild(linkIcon);
    }
    const linkElemText = document.createTextNode(data.linkText);
    linkElem.appendChild(linkElemText);
    if (data.external) linkElem.target = "_blank";
    return linkElem;
}

type LinkWithIcon = {
    linkText: string;
    href: string;
    external: boolean;
    svgSrc?: string;
    materialIcon?: string;
}

const headerItems: LinkWithIcon[] = [
    { linkText: "Home", href: "/", external: false, materialIcon: "home" },
    { linkText: "Users", href: "/users", external: false, materialIcon: "group" },
    { linkText: "F.A.Q.", href: "/faq", external: false, materialIcon: "contact_support" },
    { linkText: "Go To Canvas", href: "https://canvas.fediverse.events", external: true, materialIcon: "open_in_new" }
]

export function loadHeader(activeNavLink: string, showSearch: boolean) {
    const header = document.querySelector("header") as HTMLElement;
    //Logo
    const logo = makeElement("div", "logo", null, null);
    const logoImage = document.createElement("img") as HTMLImageElement;
    logoImage.src = "/icon.svg"
    logo.appendChild(logoImage);
    const logoText = makeElement("h1", null, null, "Canvas Stats");
    logo.onclick = function() {navigateTo("/")}
    logo.appendChild(logoText);
    header.appendChild(logo);
    //Links
    headerItems.forEach((link: LinkWithIcon) => {
        const linkElement = createLinkWithIcon(link);
        if (activeNavLink === link.linkText) linkElement.setAttribute("aria-current", "page");
        header.appendChild(linkElement);
    });
    //Search
    if (showSearch) {
        const search = document.getElementById("search") as HTMLFormElement;
        const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
        const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
        searchContainer.appendChild(searchIcon);
        const searchInput = makeElement("input", "search-input", "search-bar", null);
        searchInput.setAttribute("type", "text");
        searchInput.setAttribute("placeholder", "Search Users...");
        searchInput.setAttribute("name", "search-input");
        searchContainer.appendChild(searchInput);
        search.appendChild(searchContainer);
        const searchButton = makeElement("button", "search-button", "btn purple", "Search");
        search.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(search);
            const searchTerm = formData.get("search-input");
            if (searchTerm && searchTerm.toString().trim() !== "") {
                navigateTo("/users", {params: {username: searchTerm.toString().trim()}});
            }
        });
        search.appendChild(searchButton);
    }
}

export function loadFooter() {
    const footer = document.querySelector("footer") as HTMLElement;
    const messageMonte = document.createElement("a") as HTMLAnchorElement;
    messageMonte.href = "https://sh.itjust.works/u/the_real_monte";
    messageMonte.target = "_blank";
    const mailIcon = makeElement("span", null, "material-symbols-outlined", "mail");
    const messageLinkText = document.createTextNode("Message the_real_monte on Lemmy");
    messageMonte.append(mailIcon, messageLinkText);
    footer.appendChild(messageMonte);
    const faq = document.createElement("a") as HTMLAnchorElement;
    faq.href = "faq.html";
    const faqIcon = makeElement("span", null, "material-symbols-outlined", "contact_support");
    const faqLinkText = document.createTextNode("F.A.Q.");
    faq.append(faqIcon, faqLinkText)
    footer.appendChild(faq);
    const githubLink = document.createElement("a") as HTMLAnchorElement;
    githubLink.href = "https://github.com/CanvasStats/main";
    githubLink.target = "_blank";
    const githubIcon = makeElement("span", null, "material-symbols-outlined", "code_blocks");
    const githubText = document.createTextNode("GitHub Repo");
    githubLink.append(githubIcon, githubText);
    footer.appendChild(githubLink);
}
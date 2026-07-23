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
    const linkElemText = makeElement("span", null, null, data.linkText);
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

const navItems: LinkWithIcon[] = [
    { linkText: "Home", href: "/", external: false, materialIcon: "home" },
    { linkText: "Users", href: "/users/", external: false, materialIcon: "group" },
    { linkText: "Instances", href: "/instances/", external: false, materialIcon: "dns" },
    { linkText: "F.A.Q.", href: "/faq", external: false, materialIcon: "contact_support" },
    { linkText: "Go To Canvas", href: "https://canvas.fediverse.events", external: true, materialIcon: "open_in_new" }
]

export function loadHeader(activeNavLink: string, showSearch: boolean) {
    const header = document.querySelector("header") as HTMLElement;
    const logo = makeElement("div", "logo", null, null);
    const logoImage = document.createElement("img");
    logoImage.src = "https://raw.githubusercontent.com/CanvasStats/main/cb3fac2a0a08dcd846a53e0946a85ece3e2807bf/public/icon.svg";
    logoImage.alt = "Canvas Stats Logo"; // Recommended for accessibility
    const logoText = makeElement("h1", null, null, "Canvas Stats");
    logo.addEventListener("click", () => navigateTo("/"));
    logo.append(logoImage, logoText);

    const menuToggleLabel = makeElement("label", null, "nav-toggle-btn", null) as HTMLLabelElement;
    menuToggleLabel.htmlFor = "menu-toggle";
    menuToggleLabel.ariaLabel = "Toggle menu";
    for (let i = 0; i < 3; i++) {
        menuToggleLabel.appendChild(document.createElement("span"));
    }
    const menuToggleCheckbox = makeElement("input", "menu-toggle", "menu-toggle-input", null) as HTMLInputElement;
    menuToggleCheckbox.type = "checkbox";

    header.append(logo, menuToggleLabel);
    document.body.prepend(menuToggleCheckbox);

    const nav = makeElement("nav", null, "side-nav", null);
    const navHeader = makeElement("div", null, "nav-header", null);
    const closeButton = makeElement("label", null, "close-btn", "×") as HTMLLabelElement;
    closeButton.htmlFor = "menu-toggle";
    closeButton.ariaLabel = "Close menu";
    navHeader.appendChild(closeButton);

    const linksUl = navItems.reduce((acc: HTMLElement, link: LinkWithIcon) => {
        const li = makeElement("li", null, null, null);
        const linkElement = createLinkWithIcon(link);

        if (activeNavLink === link.linkText) {
            linkElement.setAttribute("aria-current", "page");
        }

        li.appendChild(linkElement);
        acc.appendChild(li);
        return acc;
    }, makeElement("ul", null, "nav-links", null));
    const userProfileLink = makeElement("div", null, "user-profile", null);
    const userLink = makeElement("span", null, null, "No Profile Claimed");
    userProfileLink.appendChild(userLink);
    nav.append(navHeader, linksUl, userProfileLink);
    const navBackdrop = makeElement("label", null, "nav-backdrop", null) as HTMLLabelElement;
    navBackdrop.htmlFor = "menu-toggle";
    document.body.append(navBackdrop, nav);

    //Search
    if (showSearch) {
        const search = document.getElementById("search") as HTMLFormElement;
        const searchContainer = makeElement("div", "search-container", "search-bar-container", null);
        const searchIcon = makeElement("span", null, "material-symbols-outlined", "search");
        searchContainer.appendChild(searchIcon);
        const searchInput = makeElement("input", "search-input", "search-bar", null) as HTMLInputElement
        searchInput.setAttribute("type", "text");
        searchInput.setAttribute("placeholder", "Search Users or Instances...");
        searchInput.setAttribute("name", "search-input");
        searchContainer.appendChild(searchInput);
        search.appendChild(searchContainer);
        const searchButton = makeElement("button", "search-button", "btn purple", "Search");
        searchButton.setAttribute("type", "submit");
        search.addEventListener("submit", (e) => {
            e.preventDefault();
            const formData = new FormData(search);
            const rawValue = formData.get("search-input");
            if (!rawValue) return;
            const term = rawValue.toString().trim();
            if (!term) return;
            const colonIndex = term.indexOf(":");

            if (colonIndex !== -1) {
                const prefix = term.substring(0, colonIndex).trim().toLowerCase();
                const value = term.substring(colonIndex + 1).trim();
                if (prefix === "u" || prefix === "user") {
                    navigateTo("/users/", { params: { username: value } });
                    return;
                }

                if (prefix === "i" || prefix === "instance") {
                    navigateTo("/instances/", { params: { name: value } });
                    return;
                }
            }
            navigateTo("/search", { params: { term: term } });
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
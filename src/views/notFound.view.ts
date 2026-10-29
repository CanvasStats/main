import { Link, type JsonBlock } from "../models/helpers.model";
import { getBlockStructure, renderTree } from "../modules/createNodeTree.module";
import { loadSearchBar } from "../modules/templates.module";
import { makeElement } from "../modules/utils.module";

export async function renderNotFound(container: HTMLElement, params: { pageId?: string, username?: string, instance?: string }) {
    loadSearchBar();
    container.innerHTML = "";
    const main = makeElement("main", "mainContent", null, null);
    const messageMonteLink: Link = { linkText: "the_real_monte", external: true, url: "https://sh.itjust.works/u/the_real_monte", classes: "" };
    const blocksContainer = makeElement("div", "stats-container", null, null);
    if (params.pageId) {
        const firstBlock: JsonBlock = {
            type: "standard",
            layout: "right",
            icon: "search",
            title: "404: Page Not Found",
            content: [`The page "${params.pageId} could not be found. Please check you spelling and try again."`]
        };
        renderTree(getBlockStructure(firstBlock), blocksContainer);
    }

    if (params.username) {
        
        const firstBlock: JsonBlock = {
            type: "standard",
            layout: "right",
            icon: "search",
            title: "404: User Not Found",
            content: [`It looks like "${params.username}" has never participated a Canvas Event. If you believe this is incorrect, please message `, messageMonteLink, "."]
        }
        const userListLink: Link = {linkText: "Users List", external: false, page: "/users", classes: ""};
        const secondBlock: JsonBlock = {
            type: "standard",
            layout: "left",
            icon: "groups",
            content: ["View the ", userListLink, " to see if you can find the username."]
        }
        renderTree(getBlockStructure(firstBlock), blocksContainer);
        renderTree(getBlockStructure(secondBlock), blocksContainer);
    }

    if (params.instance) {
        const firstBlock: JsonBlock = {
            type: "standard",
            layout: "right",
            icon: "search",
            title: "404: Instance Not Found",
            content: [`It looks like ${params.instance} has never had any users participated a Canvas Event. If you believe this is incorrect, please message `, messageMonteLink, "."]
        }
        const instanceLink: Link = {linkText: "Instance List", external: false, page: "/instances", classes: ""};
        const secondBlock: JsonBlock = {
            type: "standard",
            layout: "left",
            icon: "groups",
            content: ["View the ", instanceLink, " to see if you can find the instance there."]
        }
        renderTree(getBlockStructure(firstBlock), blocksContainer);
        renderTree(getBlockStructure(secondBlock), blocksContainer);
    }
    main.append(blocksContainer);
    container.appendChild(main);

    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}
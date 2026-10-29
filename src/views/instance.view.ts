import type { DataRow } from "../models/helpers.model";
import type { UserItem } from "../models/user.model";
import { getBlockStructure, renderTree } from "../modules/createNodeTree.module";
import { createColorTreemap, createLineGraph } from "../modules/d3Graphics.module";
import { state } from "../modules/state.module";
import { loadSearchBar } from "../modules/templates.module";
import { addLoadingElement, clearMessages, createButton, createMessage, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { getColorCountsForInstance, getFinalPixelsCountForInstance, getInstance, getPixelsForInstance, getPixelsPerHourForInstance, getUsernameForInstance } from "../services/instances.service";
import { renderNotFound } from "./notFound.view";

export async function renderInstance(container: HTMLElement, instanceName: string) {
    loadSearchBar();
    const instanceInfo = await getInstance(instanceName);
    if (!instanceInfo) {
        renderNotFound(container, { instance: instanceName });
    } else {
        let viewYear: number = 0;
        let yearColor: string = "";
        let years = instanceInfo.yearsActive()
        const main = makeElement("main", "mainContent", null, null);
        const loadingElement = document.getElementById("loading") as HTMLElement;
        const statsContainer = makeElement("div", "stats-container", null, null) as HTMLElement;
        const instanceId = instanceInfo.instanceId;

        const urlParams = new URLSearchParams(window.location.search);
        const yearParam = urlParams.get("year");
        if (yearParam && years[+yearParam]) {
            viewYear = +yearParam;
        } else if (state.year && years[state.year]) {
            viewYear = state.year;
        } else {
            const keys = Object.keys(years).map(Number);
            viewYear = Math.max(...keys);
            state.setYear(viewYear);
        }
        yearColor = years[viewYear];

        container.innerHTML = "";
        const mainLoader = addLoadingElement();
        main.appendChild(mainLoader);
        container.appendChild(main);

        const yearSelector = Object.entries(years).reduce((acc: HTMLElement, [year, color]) => {
            const yearButton = makeElement("div", year, color, year);
            if (parseInt(year) === viewYear) {
                yearButton.classList.add("active-year");
            }

            yearButton.onclick = async function () {
                viewYear = parseInt(year);
                state.setYear(+year);
                const urlParams = new URLSearchParams(window.location.search);
                urlParams.set('year', String(viewYear));
                const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
                window.history.replaceState({}, '', newUrl);
                acc.className = `${color}`;
                Array.from(acc.children).forEach((child) => {
                    child.classList.remove("active-year");
                });
                yearButton.classList.add("active-year");
                statsContainer.className = color;
                clearMessages();
                await updateStats();
            };

            acc.appendChild(yearButton);
            return acc;
        }, makeElement("div", "year-selector", `${yearColor}`, null));

        main.appendChild(yearSelector);
        if (loadingElement) loadingElement.classList.add("hide");

        const nameH2 = makeElement("h2", null, null, instanceName);
        main.appendChild(nameH2);

        async function updateStats() {
            const loadingText = document.getElementById("main-loader-text") as HTMLElement;
            mainLoader.classList.remove("hide");
            statsContainer.classList.add("hide");
            statsContainer.innerHTML = "";

            try {
                loadingText.textContent = "Getting users for instance";
                let users: UserItem[] = [];
                let pixelsPlaced: number = 0;
                const usernames: string[] = await getUsernameForInstance(instanceId);
                loadingText.textContent = "Getting pixels for instance";
                const instancePixels = await getPixelsForInstance(usernames, +viewYear);
                let pixelsPerHour: DataRow[] | undefined = await getPixelsPerHourForInstance(instancePixels);

                const usersArticle = makeElement("article", null, "left", null);
                const usersIcon = makeElement("span", null, "material-symbols-outlined icon", "group");
                const usersInfo = makeElement("section", null, null, null);
                const usersP = makeElement("p", null, "text", `${users.length} users from ${instanceName} participated in Canvas ${viewYear}`);
                const buttonRow = makeElement("div", null, "button-row center", null);
                const viewUsers = createButton("green", `View ${viewYear} user list`);
                viewUsers.onclick = function () { router.navigateTo(`/instances/${instanceName}/users`) }
                buttonRow.appendChild(viewUsers);
                usersInfo.append(usersP, buttonRow);
                usersArticle.append(usersIcon, usersInfo);
                statsContainer.appendChild(usersArticle);

                const pixelsArticle = makeElement("article", null, "right", null);
                const pixelsIcon = makeElement("span", null, "material-symbols-outlined icon", "grid_view");
                const pixelsInfo = makeElement("section", null, null, null);
                const pixelsP = makeElement("p", null, "text", null);
                pixelsPlaced = instanceInfo?.pixels[+viewYear] ? instanceInfo?.pixels[+viewYear] : 0;
                loadingText.textContent = "Counting pixels placed";
                pixelsP.textContent = `${pixelsPlaced} total pixels where placed on the canvas by users of ${instanceName}`;
                pixelsInfo.appendChild(pixelsP);
                pixelsArticle.append(pixelsIcon, pixelsInfo);
                statsContainer.appendChild(pixelsArticle);

                loadingText.textContent = "Calculating final pixels";
                const finalPixelsCount = await getFinalPixelsCountForInstance(instancePixels)
                const finalArticle = makeElement("article", null, "left", null);
                const finalIcon = makeElement("span", null, "material-symbols-outlined icon", "arrow_shape_up_stack_2");
                const finalInfo = makeElement("section", null, null, null);
                const finalP = makeElement("p", null, "text", `${finalPixelsCount} pixels (${((finalPixelsCount / pixelsPlaced) * 100).toFixed(2)}%) placed by ${instanceName} made it to the final image at the end of the event`);
                finalInfo.appendChild(finalP);
                finalArticle.append(finalIcon, finalInfo);
                statsContainer.appendChild(finalArticle);

                loadingText.textContent = "Counting colors";
                const colorCounts = await getColorCountsForInstance(instancePixels);
                const colorStat = makeElement("article", null, "right treemap", null);
                const treemapContainer = document.createElement('div');
                treemapContainer.setAttribute('class', 'colorCountsPieChart');
                treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
                colorStat.appendChild(treemapContainer);
                const treemapHeader = makeElement("h3", null, null, "Pixels by Color");
                colorStat.append(treemapContainer, treemapHeader);
                statsContainer.appendChild(colorStat);
                const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
                if (colorCounts) createColorTreemap(treemapContainer, colorCounts, dynamicRatio, false, +viewYear, 0);

                loadingText.textContent = "Calculating pixels placed per hour";
                const graphStat = makeElement("article", null, "left", null);
                const statSection = makeElement("section", null, null, null);
                const statHeader = makeElement("h3", null, "center", "Pixels Placed Per Hour");
                statSection.appendChild(statHeader);
                const graphContainer = makeElement("div", "line-graph-container", null, null);
                graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
                statSection.appendChild(graphContainer);
                graphStat.appendChild(statSection);
                statsContainer.appendChild(graphStat);
                if (pixelsPerHour) createLineGraph(pixelsPerHour, graphContainer);
                const drawBlock = {
                    type: "button-group",
                    layout: "right",
                    title: `View all pixels placed by ${instanceName}`,
                    icon: "dashboard_customize",
                    buttons: [
                        {
                            linkText: "on white background",
                            classes: "white",
                            page: "/draw",
                            queryParams: { "sentFrom": "instance", "year": viewYear, "background": "white", "instanceName": instanceName },
                            external: false
                        },
                        {
                            linkText: "on black background",
                            classes: "black",
                            page: "/draw",
                            queryParams: { "sentFrom": "instance", "year": viewYear, "background": "black", "instanceName": instanceName },
                            external: false
                        },
                        {
                            linkText: "on transparent background",
                            classes: "dark-grey",
                            page: "/draw",
                            queryParams: { "sentFrom": "instance", "year": viewYear, "background": "transparent", "instanceName": instanceName },
                            external: false
                        }
                    ]
                }
                const structure = getBlockStructure(drawBlock);
                renderTree(structure, statsContainer);
                loadingText.textContent = "All done!";
            } catch (error: any) {
                createMessage({message: error, location: "main-message", type: "error"});
            }

            statsContainer.classList.remove("hide");
            mainLoader.classList.add("hide");

        }




        main.append(statsContainer);
        await updateStats();
        if (loadingElement) loadingElement.classList.add("hide");
    }

}
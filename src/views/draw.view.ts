import { DrawParams, type Pixel } from "../models/pixel.model";
import { state } from "../modules/state.module";
import { loadSearchBar } from "../modules/templates.module";
import { addLoadingElement, convertColor, createButton, createMessage, makeElement } from "../modules/utils.module";
import { router } from "../router";
import { getPixelsForDraw, getYears } from "../services/canvas.service";
import { getInstanceIdForName, getPixelsForInstance, getUsernameForInstance } from "../services/instances.service";
import htmlContent from './draw.html?raw';

export async function renderDraw(params: { container: HTMLElement, username?: string }) {
    params.container.innerHTML = htmlContent;
    loadSearchBar();
    const main = document.querySelector('main') as HTMLElement;
    const drawHeader = document.getElementById("draw-header") as HTMLElement;
    const mainLoaderPlaceholder = document.getElementById("main-loader-placeholder") as HTMLElement;
    const canvasElement = document.getElementById("canvas") as HTMLCanvasElement;
    const context = canvasElement.getContext("2d");
    const mainLoader = addLoadingElement();
    const urlParams = new URLSearchParams(window.location.search);
    const usernameString: string | null = urlParams.get('username');
    const yearString: string | null = urlParams.get("year");
    const sentFrom: string | null = urlParams.get("sentFrom");
    const backgroundString: string | null = urlParams.get("background");
    const colorString: string | null = urlParams.get("color");
    const reverseString: string | null = urlParams.get("reverse");
    let instanceNameString: string | null = urlParams.get('instanceName');
    let instanceName = "";
    if (instanceNameString) instanceName = instanceNameString;
    const undoString = urlParams.get('undo');
    const isTopString = urlParams.get('topOnly');
    const specialString = urlParams.get('special');

    const years = getYears(false);
    let viewYear: number = 0;
    if (yearString) {
        if (!years[+yearString]) {
            viewYear = state.currentYear;
        } else {
            viewYear = +yearString;
        }
    }

    let canvasWidth: number = 500;
    let canvasHeight: number = 500;
    let filename: string = "";
    let background = backgroundString ? backgroundString : "white";
    let pixelsToDraw: Pixel[] = [];
    let reverse: boolean = reverseString ? true : false;
    let undo: boolean | null = null;
    if (undoString === "true") {
        undo = true;
    } else if (undoString === "false") {
        undo = false;
    }
    let color: string | null = colorString ? convertColor(colorString) : null;
    let topOnly: boolean | null = null;
    if (isTopString === "true") {
        topOnly = true;
    } else if (isTopString === "false") {
        topOnly = false;
    }

    const drawTitle = makeElement("h2", "draw-title", null, null);
    const headerButtons = makeElement("div", null, "button-row between", null);

    if (sentFrom) {
        if (sentFrom === "home") {
            //Create a button to return to the year overview
            const returnHomeButton = createButton('blue', `Back to the ${viewYear} Overview`, "arrow_back");
            returnHomeButton.addEventListener('click', () => router.navigateTo("/"));
            state.setYear(+viewYear);
            headerButtons.appendChild(returnHomeButton);
            if (colorString) {
                document.title = `${colorString} Pixels ${viewYear} | Canvas Stats`;
                drawTitle.textContent = `The image below contains all the ${colorString} pixels placed during Canvas ${viewYear}`;
            } else if (undo) {
                document.title = `Undo Pixels ${viewYear} | Canvas Stats`;
                drawTitle.textContent = `The image below contains all the undone pixels placed during Canvas ${viewYear}`;
            } else if (reverse) {
                document.title = `Pixels ${viewYear} Reversed | Canvas Stats`;
                drawTitle.textContent = `The image below contains all the undone pixels placed during Canvas ${viewYear} in reverse order`;
            } else {
                document.title = `Pixels ${viewYear} | Canvas Stats`;
                drawTitle.textContent = `The image below contains all the pixels placed during Canvas ${viewYear}`;
            }
            filename = `canvas${viewYear}`;
        } else if (sentFrom === "user") {
            document.title = `${params.username}'s Pixels | Canvas Stats`;
            //Create a button to return to the user's stats
            const returnToUserButton = createButton('blue', 'Back to your stats', "arrow_back");
            returnToUserButton.addEventListener('click', () => router.navigateTo(`/users/${params.username}`));
            state.setYear(+viewYear);
            headerButtons.appendChild(returnToUserButton);
            drawTitle.textContent = `The image below contains all the pixels placed by ${params.username} during Canvas ${viewYear}`;
            if (params.username) filename = `${params.username.split("@")[0]}-pixels-${viewYear}`
        } else if (sentFrom === "instance") {
            document.title = `${instanceName}'s Pixels | Canvas Stats`;
            const returnToInstanceButton = createButton('blue', `Back to ${instanceName} stats`, "arrow_back");
            returnToInstanceButton.addEventListener("click", () => router.navigateTo(`/instances/${instanceName}`));
            state.setYear(+viewYear);
            headerButtons.appendChild(returnToInstanceButton);
            drawTitle.textContent = `The image below contains all the pixels placed by users of ${instanceName} during Canvas ${viewYear}`;
            filename = `${instanceName}-pixels${viewYear}`;
        }
        //  else if (sentFrom === "search") {
        //     //Create a button to return to the search page
        //     const returnToUserButton = createButton('blue', 'Back to search', "arrow_back");
        //     returnToUserButton.addEventListener('click', () => navigateTo('/advanced-search'));
        //     headerButtons.appendChild(returnToUserButton);
        //     if (username) {
        //         drawTitle.textContent = `The image below contains all the pixels placed by ${username} during Canvas ${viewYear}`;
        //     } else {
        //         drawTitle.textContent = `The image below contains all the pixels placed by ${username} during Canvas ${viewYear}`;
        //     }
        //     filename = `${username}-pixels-${viewYear}`
        // }
    }

    drawHeader.append(headerButtons, drawTitle);
    mainLoaderPlaceholder.replaceWith(mainLoader);

    const backgroundColors = ["white", "black", "transparent"];

    const loading = document.getElementById("loading");
    if (loading) loading.remove();
    main.classList.remove("hide");
    mainLoader.classList.remove("hide");

    const pixelData = await getPixelsForDraw(new DrawParams(viewYear, usernameString, undo, color, specialString, topOnly));
    if (instanceNameString) {
        let users: string[] = [];
        let instanceId = await getInstanceIdForName(instanceName);
        if (instanceNameString && instanceId) users = await getUsernameForInstance(instanceId);
        const usernames: string[] = users.reduce((acc: string[], user: string) => {
            acc.push(user.toLowerCase());
            return acc;
        }, []);
        const instancePixels = await getPixelsForInstance(usernames, +viewYear);
        if (instancePixels) pixelsToDraw = instancePixels;
    } else {
        if (pixelData) pixelsToDraw = pixelData;
    }


    //Set the Canvas dimensions for the year
    if (viewYear === 2023) {
        canvasHeight = 1000;
        canvasWidth = 1000;
    } else if (viewYear === 2024) {
        canvasHeight = 500;
        canvasWidth = 1000;
    } else if (viewYear === 2025) {
        canvasHeight = 500;
        canvasWidth = 500;
    }

    function drawCanvas() {
        mainLoader.classList.remove("hide");
        const existingDownloadBtn = document.getElementById("download-btn");
        if (existingDownloadBtn) existingDownloadBtn.remove();
        const existingButtonRow = document.getElementById("redraw-buttons");
        if (existingButtonRow) existingButtonRow.remove();

        requestAnimationFrame(() => {
            setTimeout(() => {
                const redrawButtonRow = backgroundColors.reduce((acc: HTMLElement, color: string) => {
                    let button = makeElement("button", null, null, `${color} background`);
                    if (color === "transparent") {
                        button.classList.add("btn", "dark-grey", "background-btn");
                    } else {
                        button.classList.add("btn", `${color}`, "background-btn");
                    }
                    if (background === color) {
                        Array.from(acc.children).forEach((child) => {
                            child.classList.remove("active-year");
                        });
                        button.classList.add("active-year");
                    } else {
                        button.onclick = function () {
                            background = color;
                            drawCanvas();
                        }
                    }
                    acc.appendChild(button);
                    return acc;
                }, makeElement("section", "redraw-buttons", "button-row center", null));

                drawHeader.appendChild(redrawButtonRow);
                // Draw the Canvas Pixels
                if (pixelsToDraw.length > 0) {
                    canvasElement.classList.remove("hide");
                    canvasElement.setAttribute('width', `${canvasWidth}`);
                    canvasElement.setAttribute('height', `${canvasHeight}`);
                    if (context) {
                        // Set the background
                        if (background === "black") {
                            context.fillStyle = "#000000";
                            context.fillRect(0, 0, canvasWidth, canvasHeight);
                        } else if (background !== "transparent") {
                            context.fillStyle = "#ffffff";
                            context.fillRect(0, 0, canvasWidth, canvasHeight);
                        }
                        // Draw the pixels
                        if (!reverse) {
                            pixelsToDraw.forEach(pixel => {
                                context.fillStyle = pixel['colorHex'];
                                context.fillRect(pixel['xCoordinate'], pixel['yCoordinate'], 1, 1);
                            });
                        } else {
                            const l = pixelsToDraw.length - 1;
                            for (let i = l; i >= 0; i--) {
                                context.fillStyle = pixelsToDraw[i]['colorHex'];
                                context.fillRect(pixelsToDraw[i]['xCoordinate'], pixelsToDraw[i]['yCoordinate'], 1, 1);
                            }
                        }
                    }

                    const downloadButton = createButton("green", "Download your image", "download");
                    downloadButton.setAttribute("id", "download-btn");
                    downloadButton.addEventListener('click', () => downloadImage());
                    headerButtons.appendChild(downloadButton);
                } else {
                    drawTitle.textContent = "You have filtered out all the pixels!";
                    canvasElement.classList.add("hide");
                }

                mainLoader.classList.add("hide");

            }, 0);
        });
    }

    function downloadImage() {
        try {
            const dataURL = canvasElement.toDataURL("image/png");
            const a = document.createElement('a');
            a.href = dataURL;
            a.download = `${filename}-${background}.png`
            a.click();
        } catch (error) {
            createMessage({message: `Error occurred while downloading ${filename}-${background}.png. Please try reloading the page`, location: "main-message", type: "error"});
            console.error("Error during download:", error);
        }
    }

    drawCanvas();
    const loadingElement = document.getElementById("loading") as HTMLElement;
    if (loadingElement) loadingElement.classList.add("hide");
}

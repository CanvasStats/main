import { initializeApp } from "./main";
import { DrawParams, type Pixel } from "./models";
import { navigateTo } from "./modules/navigate";
import { addLoadingElement, createButton, createMessage, getHexForColor, makeElement } from "./modules/utils";
import { getPixelsForDraw, getYears } from "./services/canvas.service";

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
const undoString = urlParams.get('undo');
const isTopString = urlParams.get('isTop');
const specialString = urlParams.get('special');

const years = getYears(false);
let viewYear: number = 0;
if (yearString) {
    const searchForYear = years.find(year => year.contentKey === yearString);
    if (!searchForYear) {
        viewYear = parseInt(years[years.length - 1].contentKey);
    } else {
        viewYear = parseInt(yearString);
    }
}

let canvasWidth: number = 500;
let canvasHeight: number = 500;
let username: string = "";
let filename: string = "";
let background = backgroundString ? backgroundString : "white";
let pixelsToDraw: Pixel[] = [];
let reverse: boolean = reverseString ? true: false;
let undo: boolean | null = null;
if (undoString === "true") {
    undo = true;
} else if (undoString === "false") {
    undo = false;
}
let color: string | null = colorString ? getHexForColor(colorString) : null;
let topOnly: boolean | null = null;
if (isTopString === "true") {
    topOnly = true;
} else if (isTopString === "false") {
    topOnly = false;
}

await initializeApp("Users", "Draw", true);
if (usernameString) {
    username = usernameString;
    document.title = `${usernameString}'s Pixels - Canvas Stats`;
} else if (colorString) {
    document.title = `${colorString.charAt(0).toUpperCase() + colorString.slice(1)} Pixels - Canvas Stats`;
}

const drawTitle = makeElement("h2", "draw-title", null, null);
const headerButtons = makeElement("div", null, "button-row between", null);

if (sentFrom) {
    if (sentFrom === "home") {
        //Create a button to return to the year overview
        const returnHomeButton = createButton('blue', `Back to the ${viewYear} Overview`, "arrow_back");
        returnHomeButton.addEventListener('click', () => navigateTo('/', { params: { year: viewYear } }));
        headerButtons.appendChild(returnHomeButton);
        drawTitle.textContent = `The image below  contains all the pixels placed during Canvas ${viewYear}`;
        filename = `canvas${viewYear}`;
    } else if (sentFrom === "user") {
        //Create a button to return to the user's stats
        const returnToUserButton = createButton('blue', 'Back to your stats', "arrow_back");
        returnToUserButton.addEventListener('click', () => navigateTo('/user', { params: { year: viewYear, username: username } }));
        headerButtons.appendChild(returnToUserButton);
        drawTitle.textContent = `The image below contains all the pixels placed by ${username} during Canvas ${viewYear}`;
        filename = `${username}-pixels-${viewYear}`
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
const loading = document.getElementById("loading");
if (loading) loading.remove();
main.classList.remove("hide");
mainLoader.classList.remove("hide");

const pixelData = await getPixelsForDraw(new DrawParams(viewYear, usernameString,  undo, color, specialString, topOnly));
if (pixelData) pixelsToDraw = pixelData;

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

if (pixelsToDraw.length > 0) {
    canvasElement.setAttribute('width', `${canvasWidth}`);
    canvasElement.setAttribute('height', `${canvasHeight}`);
    if (context) {
        //Set the background
        if (background === "black") {
            context.fillStyle = "#000000";
            context.fillRect(0, 0, canvasWidth, canvasHeight);
        } else if (background !== "transparent") {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvasWidth, canvasHeight);
        }
        //Draw the pixels
        if (!reverse) {
            pixelsToDraw.forEach(pixel => {
                setTimeout(() => {
                    context.fillStyle = pixel['colorHex'];
                    context.fillRect(pixel['xCoordinate'], pixel['yCoordinate'], 1, 1);
                }, 2000);
            });
        } else {
            const l = pixelsToDraw.length - 1;
            for (let i = l; i >= 0; i--) {
                setTimeout(() => {
                    context.fillStyle = pixelsToDraw[i]['colorHex'];
                    context.fillRect(pixelsToDraw[i]['xCoordinate'], pixelsToDraw[i]['yCoordinate'], 1, 1);
                }, 2000);
            }
        }
    }
    const downloadButton = createButton("green", "Download your image", "download");
    downloadButton.addEventListener('click', () => downloadImage());
    headerButtons.appendChild(downloadButton);
} else {
    drawTitle.textContent = "You have filtered out all the pixels!";
    canvasElement.classList.add("hide");
}
mainLoader.classList.add("hide");

function downloadImage() {
    try {
        const dataURL = canvasElement.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = filename + '.png';
        a.click();
    } catch (error) {
        createMessage(`Error occurred while downloading ${filename}.png. Please try reloading the page`, "main-message", "error");
        console.error("Error during download:", error);
    }
}
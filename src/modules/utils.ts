import type { ContentPair } from "../models";

export function createIconDiv(iconType: string, iconName: string) {
  const iconDiv = document.createElement('div');
  iconDiv.setAttribute('class', 'icon');
  if (iconType === "icon") {
    const icon = document.createElement('span');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = iconName;
    iconDiv.appendChild(icon);
  } else {
    const textIcon = makeElement("h2", null, null, iconName);
    iconDiv.appendChild(textIcon);
  }
  return iconDiv;
}

export function createExternalLink(liWrapper: boolean, linkHref: string, linkText: string, largeScreeText?: string) {
  const newA = document.createElement('a');
  newA.setAttribute('href', linkHref);
  newA.setAttribute('target', '_blank');
  newA.textContent = linkText;
  if (liWrapper) {
    const newLi = document.createElement('li');
    newLi.appendChild(newA);
    if (largeScreeText) {
      const largeScreenSpan = document.createElement('span');
      largeScreenSpan.setAttribute('class', 'large-screens-only');
      largeScreenSpan.textContent = largeScreeText;
      newLi.appendChild(largeScreenSpan);
    }
    return newLi;
  } else {
    return newA;
  }
}

export function createLinkButton(color: string, href: string, linkText: string, external: boolean, iconName?: string) {
  const newLinkButton = document.createElement('a');
  newLinkButton.setAttribute('class', `btn ${color}`);
  newLinkButton.setAttribute('href', href);
  if (external) {
    newLinkButton.setAttribute('target', '_blank');
  }
  if (iconName) {
    const icon = document.createElement('span');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = iconName;
    newLinkButton.appendChild(icon);
  }
  const linkTextNode = document.createTextNode(linkText);
  newLinkButton.appendChild(linkTextNode);
  return newLinkButton;
}

function shuffle(array: string[]): string[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

export function getRandomColor(index: number, asClass: boolean): string {
  const colorsShuffled = shuffle(['white', 'light-grey', 'medium-grey', 'peach', 'beige', 'pink', 'magenta', 'mauve', 'purple', 'dark-purple', 'navy', 'blue', 'azure', 'aqua', 'light-teal', 'dark-teal', 'forest', 'dark-green', 'green', 'lime', 'pastel-yellow', 'yellow', 'orange', 'rust', 'maroon', 'rose', 'red', 'watermelon']);
  const randomColor = colorsShuffled[index];
  if (asClass) {
    return randomColor.replaceAll(" ", "-");
  } else {
    return randomColor;
  }
}

export function createButton(buttonColor: string, buttonText: string, iconName?: string) {
  const newButton = document.createElement("button");
  newButton.setAttribute('class', `btn ${buttonColor}`);
  if (iconName) {
    const icon = document.createElement('span');
    icon.setAttribute('class', 'material-symbols-outlined');
    icon.textContent = iconName;
    newButton.appendChild(icon);
  }
  const buttonTextNode = document.createTextNode(buttonText);
  newButton.appendChild(buttonTextNode);
  return newButton;
}

export function getHexForColor(color: string) {
  switch (color) {
    case 'white': return '#FFFFFF';
    case 'light grey': return '#B9C3CF';
    case 'medium grey': return '#777F8C';
    case 'deep grey': return '#424651';
    case 'dark grey': return '#1F1E26';
    case 'black': return '#000000';
    case 'dark chocolate': return '#382215';
    case 'chocolate': return '#7C3F20';
    case 'brown': return '#C06F37';
    case 'peach': return '#FEAD6C';
    case 'beige': return '#FFD2B1';
    case 'pink': return '#FFA4D0';
    case 'magenta': return '#F14FB4';
    case 'mauve': return '#E973FF';
    case 'purple': return '#A630D2';
    case 'dark purple': return '#531D8C';
    case 'navy': return '#242367';
    case 'blue': return '#0334BF';
    case 'azure': return '#149CFF';
    case 'aqua': return '#8DF5FF';
    case 'light teal': return '#01BFA5';
    case 'dark teal': return '#16777E';
    case 'forest': return '#054523';
    case 'dark green': return '#18862F';
    case 'green': return '#61E021';
    case 'lime': return '#B1FF37';
    case 'pastel yellow': return '#FFFFA5';
    case 'yellow': return '#FDE111';
    case 'orange': return '#FF9F17';
    case 'rust': return '#F66E08';
    case 'maroon': return '#550022';
    case 'rose': return '#99011A';
    case 'red': return '#F30F0C';
    case 'watermelon': return '#FF7872';
    default: return '#000000';
  }
}

export function makeElement(elementType: string, elementId: string | null, elementClass: string | null, elementText: string | null) {
  const newElement = document.createElement(elementType);
  if (elementId) newElement.setAttribute('id', elementId);
  if (elementClass) {
    newElement.setAttribute('class', elementClass);
  }
  if (elementText) newElement.textContent = elementText;
  return newElement;
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isFinished: boolean;
}

export const getRemainingTime = (targetDate: Date): CountdownTime => {
  const total = targetDate.getTime() - new Date().getTime();

  if (total <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isFinished: true };
  }

  return {
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / 1000 / 60) % 60),
    seconds: Math.floor((total / 1000) % 60),
    isFinished: false
  };
};

export async function fetchHTML(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`${response.status}: ${response.statusText}`);
      throw new Error("Error fetching header");
    }
    return await response.text();
  } catch (error: any) {
    console.error(`Error fetching ${url}: ${error}`);
  }
}

export function addLoadingElement(): HTMLElement {
  const loadingDiv = makeElement("div", "loading-main", "hide", null);
  const loadingWrapper = makeElement("div", "wrapper", null, null);
  const loaderSpan = makeElement("span", null, "loader", null);
  loadingWrapper.appendChild(loaderSpan);
  loadingDiv.appendChild(loadingWrapper);
  return loadingDiv;
}

export function comingSoonBlock(statsContainer: HTMLElement, countdownInterval: number | null, startDate: string, endDate: string) {
  const countdown = makeElement("article", null, "left", null);
  const countdownIcon = makeElement("span", null, "material-symbols-outlined icon", "hourglass_top");
  countdown.appendChild(countdownIcon);
  const countdownInfo = makeElement("section", null, null, null);
  const eventStart = new Date(startDate);
  const eventEnd = new Date(endDate);
  const initialRemainingToStart = getRemainingTime(eventStart);
  const initialRemainingToEnd = getRemainingTime(eventEnd);

  const timerTillEventStart = makeElement(
    "p",
    null,
    "text",
    initialRemainingToStart.isFinished
      ? `Canvas ${eventStart.getFullYear()} is happening now!`
      : `${initialRemainingToStart.days} days ${initialRemainingToStart.hours} hours ${initialRemainingToStart.minutes} minutes ${initialRemainingToStart.seconds} seconds`
  );

  const timerTillEventEnd = makeElement(
    "p",
    null,
    "text",
    initialRemainingToEnd.isFinished
      ? `Canvas ${eventEnd.getFullYear()} has ended.`
      : `${initialRemainingToEnd.days} days ${initialRemainingToEnd.hours} hours ${initialRemainingToEnd.minutes} minutes ${initialRemainingToEnd.seconds} seconds`
  );

  if (!initialRemainingToStart.isFinished) {
    const eventDate = makeElement("p", null, "text", `Canvas ${eventStart.getFullYear()} will start on ${eventStart.toLocaleString('default', { month: 'long' })} ${eventStart.getDate()}.`);
    countdownInfo.append(eventDate, timerTillEventStart);
  } else if (!initialRemainingToEnd.isFinished) {
    const eventDate = makeElement("p", null, "text", `Canvas ${eventStart.getFullYear()} will end on ${eventEnd.toLocaleString('default', { month: 'long' })} ${eventEnd.getDate()}.`);
    countdownInfo.append(eventDate, timerTillEventEnd);
  } else {
    const eventDate = makeElement("p", null, "text", `Canvas ${eventStart.getFullYear()} has ended. Full stats, ranking, and charts will be posted soon.`);
    countdownInfo.appendChild(eventDate);
  }

  countdown.appendChild(countdownInfo);
  statsContainer.appendChild(countdown);
  if (!countdownInterval && !initialRemainingToStart.isFinished) {
    countdownInterval = window.setInterval(() => {
      const remaining = getRemainingTime(eventStart);
      timerTillEventStart.innerText = `${remaining.days} day${remaining.days === 1 ? "" : "s"} ${remaining.hours} hour${remaining.hours === 1 ? "" : "s"} ${remaining.minutes} minute${remaining.minutes === 1 ? "" : "s"} ${remaining.seconds} second${remaining.seconds === 1 ? "" : "s"}`;
    }, 1000);
  }

  if (!countdownInterval && !initialRemainingToEnd.isFinished) {
    countdownInterval = window.setInterval(() => {
      const remaining = getRemainingTime(eventEnd);
      timerTillEventEnd.innerText = `${remaining.days} day${remaining.days === 1 ? "" : "s"} ${remaining.hours} hour${remaining.hours === 1 ? "" : "s"} ${remaining.minutes} minute${remaining.minutes === 1 ? "" : "s"} ${remaining.seconds} second${remaining.seconds === 1 ? "" : "s"}`;
    }, 1000);
  }
  if (!initialRemainingToEnd.isFinished) {
    const templateArticle = makeElement("article", null, "right", null);
    const templateIcon = makeElement("span", null, "material-symbols-outlined icon", null);
    if (!initialRemainingToStart.isFinished) {
      templateIcon.textContent = "border_clear";
    } else {
      templateIcon.textContent = "grid_view";
    }
    const templateInfo = makeElement("section", null, null, null);
    const templateP = makeElement("p", null, "text", null);
    if (!initialRemainingToStart.isFinished) {
      templateP.textContent = "You can start planning your designs by using the Template feature in Canvas's setting";
    } else {
      templateP.textContent = "The more pixels you place, the higher your rank, so go place some pixels!"
    }
    const templateButtonRow = makeElement("div", null, "button-row center", null);
    const canvasLink = document.createElement("a") as HTMLAnchorElement;
    canvasLink.href = "https://canvas.fediverse.events/?2026";
    canvasLink.target = "_blank";
    canvasLink.className = "btn green";
    const canvasLinkText = document.createTextNode("Go to Canvas");
    const canvasLinkIcon = makeElement("span", null, "material-symbols-outlined", "open_in_new");
    canvasLink.append(canvasLinkText, canvasLinkIcon);
    templateButtonRow.appendChild(canvasLink);
    templateInfo.append(templateP, templateButtonRow);
    templateArticle.append(templateIcon, templateInfo);
    statsContainer.appendChild(templateArticle);
  }


  if (!initialRemainingToEnd.isFinished) {
    const fullStatsArticle = makeElement("article", null, "left", null);
    const fullStatsIcon = makeElement("span", null, "material-symbols-outlined icon", "info");
    const fullStatsInfo = makeElement("section", null, null, null);
    const fullStatsP = makeElement("p", null, "text", `Canvas Stats will be updated with full stats, graphs, and user rankings for ${eventEnd.getFullYear()} a day or 2 after the event concludes.`);
    fullStatsInfo.appendChild(fullStatsP);
    fullStatsArticle.append(fullStatsIcon, fullStatsInfo);
    statsContainer.appendChild(fullStatsArticle);
  }

  const externalLinksArticle = makeElement("article", null, "right", null);
  const externalLinksIcon = makeElement("span", null, "material-symbols-outlined icon", "public");
  const externalLinksInfo = makeElement("section", null, null, null);
  const externalLinksH3 = makeElement("h3", null, null, "Stay Connected");

  const links: ContentPair[] = [
    { contentKey: "Lemmy", contentValue: "https://toast.ooo/c/canvas" },
    { contentKey: "Mastodon", contentValue: "https://social.fediverse.events/@canvas" },
    { contentKey: "Matrix Space", contentValue: "https://matrix.to/#/#canvas:aftermath.gg?via=matrix.org" },
    { contentKey: "https://discord.gg/XrDSJ2WJqa", contentValue: "Discord Server" },
    { contentKey: "fediverse.events", contentValue: "https://fediverse.events/" }
  ];
  const linksUL = links.reduce((acc: HTMLElement, link: ContentPair) => {
    const linkLi = document.createElement("li");
    const newLink = document.createElement("a") as HTMLAnchorElement;
    newLink.href = link.contentValue;
    newLink.textContent = link.contentKey;
    newLink.target = "_blank";
    externalLinksInfo.appendChild(newLink);
    linkLi.appendChild(newLink);
    acc.appendChild(linkLi);
    return acc;
  }, document.createElement("ul"));
  externalLinksInfo.append(externalLinksH3, linksUL);
  externalLinksArticle.append(externalLinksIcon, externalLinksInfo);
  statsContainer.appendChild(externalLinksArticle);
}


class Message {
    public message: string;
    public messageContainer: string;
    public icon: string;
    constructor(
        message: string,
        messageContainer: string,
        icon: string
    ) {
        this.message = message;
        this.messageContainer = messageContainer;
        this.icon = icon;
    }
}

export function createMessage(message: string, location: string, type: string) {
  clearMessages();
  const body = document.querySelector("body") as HTMLElement;
  let messageWrapper = makeElement("div", null, "message-wrapper", null)
  if (location === "main-message") {
    messageWrapper = makeElement("div", "main-message", "message-wrapper", null) as HTMLElement;
  }
  const messageDiv = document.createElement("div");
  if (type === "check_circle") {
    messageDiv.setAttribute("class", "success message");
    messageDiv.setAttribute("aria-live", "polite");
  } else if (type === "error") {
    messageDiv.setAttribute("class", "error message");
    messageDiv.setAttribute("role", "alert");
    console.error(message);
  } else if (type === "delete" || type === "warning") {
    messageDiv.setAttribute("class", "warn message");
    messageDiv.setAttribute("aria-live", "polite");
    console.warn(message);
  } else {
    messageDiv.setAttribute("class", "info message");
    messageDiv.setAttribute("aria-live", "polite");
  }
  const icon = document.createElement("span");
  icon.setAttribute("class", "material-symbols-outlined");
  const iconName = document.createTextNode(type);
  icon.appendChild(iconName);
  messageDiv.appendChild(icon);
  const messageText = document.createTextNode(message);
  messageDiv.appendChild(messageText);
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  const closeIcon = makeElement("span", null, "material-symbols-outlined", "close");
  closeButton.appendChild(closeIcon);
  closeButton.addEventListener("click", () => (messageWrapper.innerHTML = ""));
  messageDiv.appendChild(closeButton);
  messageWrapper.appendChild(messageDiv);
  body.prepend(messageWrapper);
}

export function clearMessages() {
  const messageWrappers = document.getElementsByClassName("message-wrapper");
  for (const messageWrapper of messageWrappers) {
    messageWrapper.innerHTML = "";
  }
}

export function storeMessage(
  message: string,
  messageContainer: string,
  icon: string,
) {
  clearMessages();
  const messageToStore = new Message(message, messageContainer, icon);
  sessionStorage.setItem("message", JSON.stringify(messageToStore));
}
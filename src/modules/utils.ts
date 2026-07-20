import type { ColorCount, Link, LiveColorCount, LiveStats } from "../models";
import { getLiveColorCounts, getUsersOnline } from "../services/live.service";
import { createColorTreemap, createLineGraph } from "./d3Graphics";
import { navigateTo } from "./navigate";

export function createIconDiv(iconType: string, iconName: string) {
  const iconDiv = makeElement("div", null, "icon", null);
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
      const largeScreenSpan = makeElement("span", null, 'large-screens-only', null);
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
    const icon = makeElement("span", null, "material-symbols-outlined", iconName);
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
    const icon = makeElement("span", null, "material-symbols-outlined", iconName);
    newButton.appendChild(icon);
  }
  const buttonTextNode = document.createTextNode(buttonText);
  newButton.appendChild(buttonTextNode);
  return newButton;
}

const COLOR_MAP: Record<string, string> = {
  'white': '#FFFFFF',
  'light grey': '#B9C3CF',
  'medium grey': '#777F8C',
  'deep grey': '#424651',
  'dark grey': '#1F1E26',
  'black': '#000000',
  'dark chocolate': '#382215',
  'chocolate': '#7C3F20',
  'brown': '#C06F37',
  'peach': '#FEAD6C',
  'beige': '#FFD2B1',
  'pink': '#FFA4D0',
  'magenta': '#F14FB4',
  'mauve': '#E973FF',
  'purple': '#A630D2',
  'dark purple': '#531D8C',
  'navy': '#242367',
  'blue': '#0334BF',
  'azure': '#149CFF',
  'aqua': '#8DF5FF',
  'light teal': '#01BFA5',
  'dark teal': '#16777E',
  'forest': '#054523',
  'dark green': '#18862F',
  'green': '#61E021',
  'lime': '#B1FF37',
  'pastel yellow': '#FFFFA5',
  'yellow': '#FDE111',
  'orange': '#FF9F17',
  'rust': '#F66E08',
  'maroon': '#550022',
  'rose': '#99011A',
  'red': '#F30F0C',
  'watermelon': '#FF7872',
};

const HEX_MAP = Object.fromEntries(
  Object.entries(COLOR_MAP).map(([color, hex]) => [hex.toUpperCase(), color])
);

export function convertColor(input: string): string {
  const cleanInput = input.trim().replaceAll("-", " ");
  if (cleanInput.startsWith('#')) {
    return HEX_MAP[cleanInput.toUpperCase()] || 'unknown color';
  }
  return COLOR_MAP[cleanInput.toLowerCase()] || '#000000';
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
  const loadingText = makeElement("h2", "main-loader-text", null, "Loading");
  const loaderSpan = makeElement("span", null, "loader", null);
  loadingWrapper.append(loadingText, loaderSpan);
  loadingDiv.appendChild(loadingWrapper);
  return loadingDiv;
}

function mapLiveColorCountJsonToInterface(data: LiveColorCount[]) {
  return data.reduce((acc: ColorCount[], currentCount: LiveColorCount) => {
    const newCount: ColorCount = {
      class: currentCount["color_name"],
      label: currentCount["color_name"],
      hex: `#${currentCount["color_hex"]}`,
      count: currentCount["count"]
    }
    acc.push(newCount);
    return acc;
  }, []);
}

export async function comingSoonBlock(statsContainer: HTMLElement, countdownInterval: number | null, startDate: string, endDate: string, liveStats: boolean) {
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
      templateP.textContent = "You can start planning your designs by using the Template feature in Canvas's setting or use @mf_h's CoTemplate";
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
    const teamTemplate = document.createElement("a") as HTMLAnchorElement;
    teamTemplate.href = "https://chocolatecakecodes.goip.de/cotemplate/ui/template/20260520-Canvas26_main";
    teamTemplate.target = "_blank";
    teamTemplate.className = "btn blue";
    const teamTemplateText = "CoTemplate";
    const teamTemplateIcon = makeElement("span", null, "material-symbols-outlined", "open_in_new");
    teamTemplate.append(teamTemplateText, teamTemplateIcon);
    const colors = makeElement("a", null, "clickable btn orange", "Color palette");
    colors.onclick = function () { navigateTo("/colors") }
    templateButtonRow.append(canvasLink, teamTemplate, colors);
    templateInfo.append(templateP, templateButtonRow);
    templateArticle.append(templateIcon, templateInfo);
    statsContainer.appendChild(templateArticle);
    
    if (liveStats && initialRemainingToStart.isFinished) {
      const liveUpdate: LiveStats = await getLiveColorCounts();
      if (liveUpdate) {
        const infoBlock = makeElement("article", null, "left", null);
        const infoIcon = makeElement("span", null, "material-symbols-outlined icon", "arrows_output");
        const infoP = makeElement("p", null, "text", `As of ${liveUpdate["timestamp"]} the canvas is ${liveUpdate["width"]} pixels by ${liveUpdate["height"]} pixels`);
        const infoBlockInfo = makeElement("section", null, null, null);
        infoBlockInfo.append(infoP);
        infoBlock.append(infoIcon, infoBlockInfo);
        statsContainer.appendChild(infoBlock);

        const disclaimerBlock = makeElement("article", null, "right", null);
        const disclaimerIcon = makeElement("span", null, "material-symbols-outlined icon", "warning");
        const disclaimersSection = makeElement("section", null, null, null);
        const disclaimersUl = makeElement("ul", null, null, null);
        const disclaimers = [
          "The following stats are estimates. This website does not have live access to the Canvas Database",
          "All data is generated from screenshots of the canvas",
          "The following counts are only the visible pixels, not the total number of pixels placed",
          "The white count is both white pixels and virgin pixels since there is no difference in the screenshot"
        ]
        disclaimers.forEach((disclaimer: string) => {
          const li = makeElement("li", null, null, disclaimer);
          disclaimersUl.appendChild(li);
        });
        disclaimersSection.appendChild(disclaimersUl);
        disclaimerBlock.append(disclaimerIcon, disclaimersSection);
        statsContainer.appendChild(disclaimerBlock);

        const liveColorCountsData = mapLiveColorCountJsonToInterface(liveUpdate["counts"]);
        const treemap = makeElement("article", null, "right treemap", null);
        const treemapContainer = makeElement("div", null, 'colorCountsPieChart', null)
        treemapContainer.setAttribute('style', 'display: block; width: 100%; min-width: 300px; min-height: 300px;');
        treemap.appendChild(treemapContainer);

        const treemapTitle = makeElement("section", null, 'color-section', null);

        if (liveColorCountsData.length === 0) {
          const soonP = makeElement("h3", null, "text", "This page will start updating with stat in about 10 minutes.");
          treemapTitle.appendChild(soonP);
          statsContainer.appendChild(treemapTitle)
        } else {
          const statHeader = makeElement("h3", null, null, "Pixels by Color");
          const statP = makeElement("p", null, "text", "(Percent of canvas covered)");
          treemapTitle.append(statHeader, statP);
          statsContainer.append(treemapTitle, treemap);
          const dynamicRatio = window.innerWidth < 600 ? 1.0 : 0.6;
          createColorTreemap(treemapContainer, liveColorCountsData, dynamicRatio, false, 0, liveUpdate["total_pixels"]);
        }

      }
      const usersOnline = await getUsersOnline();
      const uoLength = usersOnline?.length ? usersOnline?.length : 0
      if (uoLength > 0) {
        const graphStat = makeElement("article", null, "left", null);
        const statSection = makeElement("section", null, null, null);
        const statHeader = makeElement("h3", null, "center", "Users online during the event");
        statSection.appendChild(statHeader);
        const graphContainer = makeElement("div", "line-graph-container", null, null);
        graphContainer.setAttribute("style", "width: 100%; max-width: 800px; margin: auto;")
        statSection.appendChild(graphContainer);
        graphStat.appendChild(statSection);
        statsContainer.appendChild(graphStat);
        if (usersOnline) createLineGraph(usersOnline, graphContainer);
      }
    }
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
}

export function createSocialBlock(direction: string, articleHeading: string, articleIcon: string, year: number) {
  const externalLinksArticle = makeElement("article", null, direction, null);
  const externalLinksIcon = makeElement("span", null, "material-symbols-outlined icon", articleIcon);
  const externalLinksInfo = makeElement("section", null, null, null);
  const externalLinksH3 = makeElement("h3", null, null, articleHeading);

  const links: Link[] = [
    { linkText: "Discord", classes: "social btn", external: true, url: "https://discord.gg/XrDSJ2WJqa", svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><title>Discord</title><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"></path></svg>' },
    { linkText: "Lemmy", classes: "social btn", url: "https://toast.ooo/c/canvas", external: true, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><title>Lemmy</title><path d="M2.9595 4.2228a3.9132 3.9132 0 0 0-.332.019c-.8781.1012-1.67.5699-2.155 1.3862-.475.8-.5922 1.6809-.35 2.4971.2421.8162.8297 1.5575 1.6982 2.1449.0053.0035.0106.0076.0163.0114.746.4498 1.492.7431 2.2877.8994-.02.3318-.0272.6689-.006 1.0181.0634 1.0432.4368 2.0006.996 2.8492l-2.0061.8189a.4163.4163 0 0 0-.2276.2239.416.416 0 0 0 .0879.455.415.415 0 0 0 .2941.1231.4156.4156 0 0 0 .1595-.0312l2.2093-.9035c.408.4859.8695.9315 1.3723 1.318.0196.0151.0407.0264.0603.0423l-1.2918 1.7103a.416.416 0 0 0 .664.501l1.314-1.7385c.7185.4548 1.4782.7927 2.2294 1.0242.3833.7209 1.1379 1.1871 2.0202 1.1871.8907 0 1.6442-.501 2.0242-1.2072.744-.2347 1.4959-.5729 2.2073-1.0262l1.332 1.7606a.4157.4157 0 0 0 .7439-.1936.4165.4165 0 0 0-.0799-.3074l-1.3099-1.7345c.0083-.0075.0178-.0113.0261-.0188.4968-.3803.9549-.8175 1.3622-1.2939l2.155.8794a.4156.4156 0 0 0 .5412-.2276.4151.4151 0 0 0-.2273-.5432l-1.9438-.7928c.577-.8538.9697-1.8183 1.0504-2.8693.0268-.3507.0242-.6914.0079-1.0262.7905-.1572 1.5321-.4502 2.2737-.8974.0053-.0033.011-.0076.0163-.0113.8684-.5874 1.456-1.3287 1.6982-2.145.2421-.8161.125-1.697-.3501-2.497-.4849-.8163-1.2768-1.2852-2.155-1.3863a3.2175 3.2175 0 0 0-.332-.0189c-.7852-.0151-1.6231.229-2.4286.6942-.5926.342-1.1252.867-1.5433 1.4387-1.1699-.6703-2.6923-1.0476-4.5635-1.0785a15.5768 15.5768 0 0 0-.5111 0c-2.085.034-3.7537.43-5.0142 1.1449-.0033-.0038-.0045-.0114-.008-.0152-.4233-.5916-.973-1.1365-1.5835-1.489-.8055-.465-1.6434-.7083-2.4286-.6941Zm.2858.7365c.5568.042 1.1696.2358 1.7787.5875.485.28.9757.7554 1.346 1.2696a5.6875 5.6875 0 0 0-.4969.4085c-.9201.8516-1.4615 1.9597-1.668 3.2335-.6809-.1402-1.3183-.3945-1.984-.7948-.7553-.5128-1.2159-1.1225-1.4004-1.7445-.1851-.624-.1074-1.2712.2776-1.9196.3743-.63.9275-.9534 1.6118-1.0322a2.796 2.796 0 0 1 .5352-.0076Zm17.5094 0a2.797 2.797 0 0 1 .5353.0075c.6842.0786 1.2374.4021 1.6117 1.0322.385.6484.4627 1.2957.2776 1.9196-.1845.622-.645 1.2317-1.4004 1.7445-.6578.3955-1.2881.6472-1.9598.7888-.1942-1.2968-.7375-2.4338-1.666-3.302a5.5639 5.5639 0 0 0-.4709-.3923c.3645-.49.8287-.9428 1.2938-1.2113.6091-.3515 1.2219-.5454 1.7787-.5875ZM12.006 6.0036a14.832 14.832 0 0 1 .487 0c2.3901.0393 4.0848.67 5.1631 1.678 1.1501 1.0754 1.6423 2.6006 1.499 4.467-.1311 1.7079-1.2203 3.2281-2.652 4.324-.694.5313-1.4626.9354-2.2254 1.2294.0031-.0453.014-.0888.014-.1349.0029-1.1964-.9313-2.2133-2.2918-2.2133-1.3606 0-2.3222 1.0154-2.2918 2.2213.0013.0507.014.0972.0181.1471-.781-.2933-1.5696-.7013-2.2777-1.2456-1.4239-1.0945-2.4997-2.6129-2.6037-4.322-.1129-1.8567.3778-3.3382 1.5212-4.3965C7.5094 6.7 9.352 6.047 12.006 6.0036Zm-3.6419 6.8291c-.6053 0-1.0966.4903-1.0966 1.0966 0 .6063.4913 1.0986 1.0966 1.0986s1.0966-.4923 1.0966-1.0986c0-.6063-.4913-1.0966-1.0966-1.0966zm7.2819.0113c-.5998 0-1.0866.4859-1.0866 1.0866s.4868 1.0885 1.0866 1.0885c.5997 0 1.0865-.4878 1.0865-1.0885s-.4868-1.0866-1.0865-1.0866zM12 16.0835c1.0237 0 1.5654.638 1.5634 1.4829-.0018.7849-.6723 1.485-1.5634 1.485-.9167 0-1.54-.5629-1.5634-1.493-.0212-.8347.5397-1.4749 1.5634-1.4749Z"></path></svg>' },
    { linkText: "Mastodon", classes: "social btn", external: true, url: "https://social.fediverse.events/@canvas", svg: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><title>Mastodon</title><path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 0 0 .023-.043v-1.809a.052.052 0 0 0-.02-.041.053.053 0 0 0-.046-.01 20.282 20.282 0 0 1-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 0 1-.319-1.433.053.053 0 0 1 .066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.67 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z"></path></svg>' },
    { linkText: "Matrix", classes: "social btn", url: "https://chat.fediverse.events/switch/cinny", external: true, svg: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><title>Matrix</title><path d="M.632.55v22.9H2.28V24H0V0h2.28v.55zm7.043 7.26v1.157h.033c.309-.443.683-.784 1.117-1.024.433-.245.936-.365 1.5-.365.54 0 1.033.107 1.481.314.448.208.785.582 1.02 1.108.254-.374.6-.706 1.034-.992.434-.287.95-.43 1.546-.43.453 0 .872.056 1.26.167.388.11.716.286.993.53.276.245.489.559.646.951.152.392.23.863.23 1.417v5.728h-2.349V11.52c0-.286-.01-.559-.032-.812a1.755 1.755 0 0 0-.18-.66 1.106 1.106 0 0 0-.438-.448c-.194-.11-.457-.166-.785-.166-.332 0-.6.064-.803.189a1.38 1.38 0 0 0-.48.499 1.946 1.946 0 0 0-.231.696 5.56 5.56 0 0 0-.06.785v4.768h-2.35v-4.8c0-.254-.004-.503-.018-.752a2.074 2.074 0 0 0-.143-.688 1.052 1.052 0 0 0-.415-.503c-.194-.125-.476-.19-.854-.19-.111 0-.259.024-.439.074-.18.051-.36.143-.53.282-.171.138-.319.337-.439.595-.12.259-.18.6-.18 1.02v4.966H5.46V7.81zm15.693 15.64V.55H21.72V0H24v24h-2.28v-.55z"></path></svg>' },
    { linkText: "Atlas", classes: "social btn", url: "", external: true, svg: "" }
  ]

  const buttonRow = links.reduce((acc: HTMLElement, link: Link, index: number) => {
    const newLink = document.createElement("a") as HTMLAnchorElement;
    newLink.target = "_blank";
    const randomColor = getRandomColor(index, true);
    if (link.linkText === "Atlas") {
      if (year !== 2023 && year !== 2026) {
        newLink.href = `https://${year}.canvas-atlas.fediverse.events/`;
        const linkText = `${year} ${link.linkText}`;
        const icon = makeElement("span", null, "material-symbols-outlined", "open_in_new");
        newLink.append(icon, linkText);
        if (link.classes) newLink.className = link.classes;
        newLink.classList.add(randomColor);
        acc.appendChild(newLink);
      }
    } else {
      if (link.url) newLink.href = link.url;
      const svg = document.createElement("span");
      svg.innerHTML = link.svg;
      const linkText = document.createTextNode(link.linkText);
      newLink.append(svg, linkText)
      if (link.classes) newLink.className = link.classes;
      newLink.classList.add(randomColor);
      acc.appendChild(newLink);
    }
    return acc;
  }, makeElement("div", null, "button-row", null));

  externalLinksInfo.append(externalLinksH3, buttonRow);
  externalLinksArticle.append(externalLinksIcon, externalLinksInfo);
  return externalLinksArticle;
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

export function createMessage(
  message: string, 
  location: string, 
  type: string, 
  timeoutSeconds: number = 0
) {
  clearMessages();
  const typeMap: Record<string, { class: string; role?: string; live?: string }> = {
    check_circle: { class: "success message", live: "polite" },
    error:        { class: "error message",   role: "alert" },
    delete:       { class: "warn message",    live: "polite" },
    warning:      { class: "warn message",    live: "polite" }
  };

  if (type === "error") console.error(message);
  if (type === "delete" || type === "warning") console.warn(message);

  const config = typeMap[type] || { class: "info message", live: "polite" };
  const wrapperId = location === "main-message" ? "main-message" : null;
  const messageWrapper = makeElement("div", wrapperId, "message-wrapper", null) as HTMLElement;

  const messageDiv = document.createElement("div");
  messageDiv.className = config.class;
  if (config.role) messageDiv.setAttribute("role", config.role);
  if (config.live) messageDiv.setAttribute("aria-live", config.live);

  const icon = makeElement("span", null, "material-symbols-outlined", type);
  const messageText = document.createTextNode(message);
  
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.appendChild(makeElement("span", null, "material-symbols-outlined", "close"));

  messageDiv.append(icon, messageText, closeButton);
  messageWrapper.appendChild(messageDiv);
  document.body.prepend(messageWrapper);

  const dismiss = () => { messageWrapper.innerHTML = ""; };
  closeButton.addEventListener("click", dismiss);
  if (timeoutSeconds > 0) setTimeout(dismiss, timeoutSeconds * 1000);
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
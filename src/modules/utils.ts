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
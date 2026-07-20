import { loadFooter, loadHeader } from "./modules/templates";
import { createMessage } from "./modules/utils";
import { getYears } from "./services/canvas.service";
import { registerSW } from 'virtual:pwa-register';

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.location.reload();
  }
});

let year: number = 2026;
// Get the year from the url
const urlParams = new URLSearchParams(window.location.search);
const yearString: string | null = urlParams.get('year');
const years = getYears(false);
//Set the year
if (yearString) {
  const searchForYear = years.find(year => year.contentKey === yearString);
  if (!searchForYear) {
    createMessage(`Error: ${yearString} is not a valid year`, "main-message", "error");
  } else {
    year = isNaN(parseInt(yearString)) ? parseInt(years[years.length - 1].contentKey) : parseInt(yearString);
  }
}
let search: string | null = urlParams.get('search');

export function getYear() {
  return year;
}

export function getSearchString() {
  return search;
}

//Adding comment to force redeploy
export async function initializeApp(parentPage: string, currentPage: string, showSearch: boolean) {
  if (currentPage !== "") {
    //Set the page title
    document.title = `${currentPage} - Canvas Stats`;
  }
  //Wait for the DOM to load
  await new Promise<void>(resolve => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    } else {
      resolve();
    }
  });

  loadHeader(parentPage, showSearch);
  //Load the footer
  loadFooter();
  const header = document.querySelector('header') as HTMLElement;
  const search = document.getElementById('search')
  header.classList.remove('hide');
  if (search) {
    search.classList.remove('hide');
  }

  const storedMessageString = sessionStorage.getItem("message");
  if (storedMessageString) {
    const storedMessage = JSON.parse(storedMessageString);
    console.log(storedMessage['message'])
    createMessage(storedMessage['message'], storedMessage['messageContainer'], storedMessage['icon']);
    sessionStorage.removeItem("message");
  }

}
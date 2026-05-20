import { loadFooter, loadHeader } from "./modules/templates";
import { getYears } from "./services/canvas.service";

let year: number = 2026;
// Get the year from the url
const urlParams = new URLSearchParams(window.location.search);
const yearString: string | null = urlParams.get('year');
const years = getYears(false);
//Set the year
if (yearString) {
  const searchForYear = years.find(year => year.contentKey === yearString);
  if (!searchForYear) {
    console.error(`${yearString} is not a valid year`);
    //year = parseInt(years[years.length - 1].contentKey);
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

}
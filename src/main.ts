import { loadFooter, loadHeader } from "./modules/templates";

let year: number = 2026;
// Get the year from the url
const urlParams = new URLSearchParams(window.location.search);
const yearString: string | null = urlParams.get('year');
//Set the year
if (yearString) {
  year = isNaN(parseInt(yearString)) ? 2025 : parseInt(yearString);
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
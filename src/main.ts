import { state } from './modules/state.module';
import { loadFooter, loadHeader } from './modules/templates.module';
import { createMessage } from './modules/utils.module';
import { router } from './router';
import { renderAchievements } from './views/achievements.view';
import { renderAdvancedSearch } from './views/advanced.view';
import { renderDraw } from './views/draw.view';
import { renderFAQ } from './views/faq.view';
import { renderHomepage } from './views/homepage.view';
import { renderInstance } from './views/instance.view';
import { renderInstances } from './views/instances.view';
import { renderNotFound } from './views/notFound.view';
import { renderSearch } from './views/search.view';
import { renderUser } from './views/user.view';
import { renderUsers } from './views/users.view';
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    createMessage({
      message: 'A new version of Canvas Stats is available! Click to update.',
      location: 'main-message',
      type: 'info',
      timeoutSeconds: 0,
      onUpdate: () => {
        updateSW(true);
      }
    });
  },
  onOfflineReady() {
    console.log('App ready to work offline!');
  },
});
const appElement = document.getElementById('app') as HTMLDivElement;

async function initApp() {

  const urlParams = new URLSearchParams(window.location.search);
  const yearParam = urlParams.get("year");
  if (yearParam && parseInt(yearParam)) {
    state.setYear(parseInt(yearParam));
  }

  // Setup page elements
  await loadHeader();
  loadFooter();

  //Load any stored messages
  const storedMessageString = sessionStorage.getItem("message");
  if (storedMessageString) {
    const storedMessage = JSON.parse(storedMessageString);
    console.log(storedMessage['message'])
    createMessage({message: storedMessage['message'], location: storedMessage['messageContainer'], type: storedMessage['icon']});
    sessionStorage.removeItem("message");
  }

  // Routes
  router.addRoute('/', () => {
    renderHomepage(appElement);
  });

  router.addRoute('/achievements', () => {
    renderAchievements({container: appElement});
  });

  router.addRoute('/advanced-search', () => {
    renderAdvancedSearch(appElement);
  })

  router.addRoute('/faq', () => {
    renderFAQ(appElement);
  });

  router.addRoute('/search/:query', (params) => {
    const searchQuery = params.query;
    renderSearch(appElement, searchQuery);
  });

  router.addRoute('/draw', () => {
    renderDraw({container: appElement});
  });

  router.addRoute('/users', () => {
    renderUsers({container: appElement});
  });

  router.addRoute('/users/:id', (params) => {
    const username = params.id;
    renderUser(appElement, username);
  });

  router.addRoute('/users/:username/draw', (params) => {
    const username = params.username;
    renderDraw({container: appElement, username: username});
  });

  router.addRoute('/instances', () => {
    renderInstances(appElement);
  });

  router.addRoute('/instances/:id', (params) => {
    const instanceName = params.id;
    renderInstance(appElement, instanceName);
  });

  router.addRoute('/instances/:id/users', (params) => {
    const instanceName = params.id;
    renderUsers({container: appElement, instanceName: instanceName});
  });

  router.addRoute('*', () => {
    const attemptedPath = window.location.pathname.replace(/^\/+/, '');
    renderNotFound(appElement, {pageId: attemptedPath});
  });

  router.init();
}

initApp();
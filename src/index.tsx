import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import Store from './Store';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

// https://github.com/flatiron/director/issues/349 explains
// why I need the strange path.
import { Router } from 'director/build/director';
import { autorun, useStrict } from 'mobx';
useStrict(true);

function startRouter(store: Store) {

  const baseUrl = process.env.PUBLIC_URL;

  // update state on url change
  let router = new Router();
  router.on(baseUrl + '/(\\d+)', id => store.setIdPage(+id, 1));
  router.on(baseUrl + '/(\\d+)/(\\d+)', (id, pageno) => store.setIdPage(+id, +pageno));
  router.configure({
    notfound: () => store.setIdPage(1, 1),
    html5history: true
  });
  router.init();

  // update url on state changes
  autorun(() => {
    const path = baseUrl + store.currentPath;
    if (path !== window.location.pathname) {
      console.log('push', path, window.location.pathname);
      window.history.pushState(null, '', path);
    }
  });

}

function startPersist(store: Store) {
  var persist = window.localStorage.getItem('settings');
  if (persist) {
    store.setPersist(persist);
  }
  autorun(() => {
    window.localStorage.setItem('settings', store.persist);
  });
}

const store = new Store();
startRouter(store);
startPersist(store);
window.addEventListener('resize', store.resize);

ReactDOM.render(
  <App store={store} />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();

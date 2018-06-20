import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './App';
import Store from './Store';
import { DB } from './db';
// import registerServiceWorker from './registerServiceWorker';
import './index.css';

// https://github.com/flatiron/director/issues/349 explains
// why I need the strange path.
import { Router } from 'director/build/director';
import { autorun, useStrict } from 'mobx';
useStrict(true);

// unregister the service worker if we installed it.
navigator.serviceWorker.getRegistrations().then(registrations => 
  registrations.map(registration => registration.unregister()));

function startRouter(store: Store) {

  const baseUrl = process.env.PUBLIC_URL;

  // update state on url change
  let router = new Router();
  // I bet there is a cooler nested way to do this.
  router.on(baseUrl + '/([a-zA-Z0-9%]+)', studentid => store.setPath(decodeURIComponent(studentid), '', 1));
  router.on(baseUrl + '/([a-zA-Z0-9%]+)/([-a-z0-9]*)',
    (studentid, bookid) => store.setPath(decodeURIComponent(studentid), bookid, 1));
  router.on(baseUrl + '/([a-zA-Z0-9%]+)/([-a-z0-9]+)/(\\d+)',
    (studentid, bookid, pageno) => store.setPath(decodeURIComponent(studentid), bookid, +pageno));
  router.configure({
    notfound: () => store.setPath('', '', 1),
    html5history: true
  });
  router.init();

  // update url on state changes
  // TODO
  autorun(() => {
    const path = baseUrl + store.currentPath;
    if (path !== window.location.pathname) {
      window.history.pushState(null, '', path);
    }
  });

}

function startPersist(store: Store) {
  var persist = window.localStorage.getItem('THSR-settings');
  if (persist) {
    store.setPersist(persist);
  }
  autorun(() => {
    window.localStorage.setItem('THSR-settings', store.persist);
  });
}

const db = new DB();
const store = new Store();
store.db = db;
store.authUser();
startRouter(store);
startPersist(store);
autorun(() => store.log());
window.addEventListener('resize', store.resize);

ReactDOM.render(
  <App store={store} />,
  document.getElementById('root') as HTMLElement
);
// registerServiceWorker();

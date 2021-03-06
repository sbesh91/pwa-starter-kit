/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

export const UPDATE_PAGE = 'UPDATE_PAGE';
export const UPDATE_OFFLINE = 'UPDATE_OFFLINE';
export const UPDATE_DRAWER_STATE = 'UPDATE_DRAWER_STATE';
export const OPEN_SNACKBAR = 'OPEN_SNACKBAR';
export const CLOSE_SNACKBAR = 'CLOSE_SNACKBAR';

export const navigate = (path) => (dispatch) => {
  // Extract the page name from path.
  const page = path === '/' ? 'view1' : path.slice(1);

  // Any other info you might want to extract from the path (like page type),
  // you can do here
  dispatch(loadPage(page));

  // Close the drawer - in case the *path* change came from a link in the drawer.
  dispatch(updateDrawerState(false));
};

const ROUTE_BASE = '../components/'
export const ROUTE_NOT_FOUND = { 'filePath': 'my-view404.js', 'href': '/view404', 'key': 'view404', 'title': 'Not Found', 'tag': 'my-view404' };
export const ROUTES = [
  { 'filePath': 'my-view1.js', 'href': '/view1', 'key': 'view1', 'title': 'View One', 'tag': 'my-view1' },
  { 'filePath': 'my-view2.js', 'href': '/view2', 'key': 'view2', 'title': 'View Two', 'tag': 'my-view2' },
  { 'filePath': 'my-view3.js', 'href': '/view3', 'key': 'view3', 'title': 'View Three', 'tag': 'my-view3' }
];


const loadPage = (page) => async (dispatch) => {  
  let pageFound = ROUTES.find(i => i.key === page);
  pageFound = pageFound ? pageFound : ROUTE_NOT_FOUND;
  page = pageFound.key;
  // todo: propose tool changes to support something like this with a companion config section
  // await import(`${ROUTE_BASE}${pageFound.filePath}`)

  // This switch case helps static analysis of the code find what to include in the build
  switch(page) {
    case 'view1':
      await import('../components/my-view1.js');
      // Put code here that you want it to run every time when
      // navigate to view1 page and my-view1.js is loaded
      break;
    case 'view2':
      await import('../components/my-view2.js');
      break;
    case 'view3':
      await import('../components/my-view3.js');
      break;
    default:
      await import('../components/my-view404.js');
}

  dispatch(updatePage(page));
}

const updatePage = (page) => {
  return {
    type: UPDATE_PAGE,
    page
  };
}

let snackbarTimer;

export const showSnackbar = () => (dispatch) => {
  dispatch({
    type: OPEN_SNACKBAR
  });
  clearTimeout(snackbarTimer);
  snackbarTimer = setTimeout(() =>
    dispatch({ type: CLOSE_SNACKBAR }), 3000);
};

export const updateOffline = (offline) => (dispatch, getState) => {
  // Show the snackbar, unless this is the first load of the page.
  if (getState().app.offline !== undefined) {
    dispatch(showSnackbar());
  }
  dispatch({
    type: UPDATE_OFFLINE,
    offline
  });
};

export const updateLayout = (wide) => (dispatch, getState) => {
  if (getState().app.drawerOpened) {
    dispatch(updateDrawerState(false));
  }
}

export const updateDrawerState = (opened) => (dispatch, getState) => {
  if (getState().app.drawerOpened !== opened) {
    dispatch({
      type: UPDATE_DRAWER_STATE,
      opened
    });
  }
}

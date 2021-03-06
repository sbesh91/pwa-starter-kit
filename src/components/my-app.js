/**
@license
Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/
  
import { LitElement, html } from '@polymer/lit-element';

import '@polymer/app-layout/app-drawer/app-drawer.js';
import '@polymer/app-layout/app-header/app-header.js';
import '@polymer/app-layout/app-scroll-effects/effects/waterfall.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import { setPassiveTouchGestures } from '@polymer/polymer/lib/utils/settings.js';

import { menuIcon } from './my-icons.js';
import './snack-bar.js';

import { connect } from 'pwa-helpers/connect-mixin.js';
import { installRouter } from 'pwa-helpers/router.js';
import { installOfflineWatcher } from 'pwa-helpers/network.js';
import { installMediaQueryWatcher } from 'pwa-helpers/media-query.js';
import { updateMetadata } from 'pwa-helpers/metadata.js';

import { store } from '../store.js';
import { navigate, updateOffline, updateDrawerState, updateLayout, ROUTES, ROUTE_NOT_FOUND } from '../actions/app.js';

class MyApp extends connect(store)(LitElement) {
  _render({appTitle, _page, _drawerOpened, _snackbarOpened, _offline}) {
    // Anything that's related to rendering should be done in here.
    return html`
    <style>
      :host {
        --app-drawer-width: 256px;
        display: block;

        --app-primary-color: #E91E63;
        --app-secondary-color: #293237;
        --app-dark-text-color: var(--app-secondary-color);
        --app-light-text-color: white;
        --app-section-even-color: #f7f7f7;
        --app-section-odd-color: white;

        --app-header-background-color: white;
        --app-header-text-color: var(--app-dark-text-color);
        --app-header-selected-color: var(--app-primary-color);

        --app-drawer-background-color: var(--app-secondary-color);
        --app-drawer-text-color: var(--app-light-text-color);
        --app-drawer-selected-color: #78909C;
      }

      app-header {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        text-align: center;
        background-color: var(--app-header-background-color);
        color: var(--app-header-text-color);
        border-bottom: 1px solid #eee;
      }

      .toolbar-top {
        background-color: var(--app-header-background-color);
      }

      [main-title] {
        font-family: 'Pacifico';
        text-transform: lowercase;
        font-size: 30px;
        /* In the narrow layout, the toolbar is offset by the width of the
        drawer button, and the text looks not centered. Add a padding to
        match that button */
        padding-right: 44px;
      }

      .toolbar-list {
        display: none;
      }

      .toolbar-list > a {
        display: inline-block;
        color: var(--app-header-text-color);
        text-decoration: none;
        line-height: 30px;
        padding: 4px 24px;
      }

      .toolbar-list > a[selected] {
        color: var(--app-header-selected-color);
        border-bottom: 4px solid var(--app-header-selected-color);
      }

      .menu-btn {
        background: none;
        border: none;
        fill: var(--app-header-text-color);
        cursor: pointer;
        height: 44px;
        width: 44px;
      }

      .drawer-list {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        padding: 24px;
        background: var(--app-drawer-background-color);
        position: relative;
      }

      .drawer-list > a {
        display: block;
        text-decoration: none;
        color: var(--app-drawer-text-color);
        line-height: 40px;
        padding: 0 24px;
      }

      .drawer-list > a[selected] {
        color: var(--app-drawer-selected-color);
      }

      .main-content {
        padding-top: 64px;
        min-height: 100vh;
      }

      .page {
        display: none;
      }

      .page[active] {
        display: block;
      }

      footer {
        padding: 24px;
        background: var(--app-drawer-background-color);
        color: var(--app-drawer-text-color);
        text-align: center;
      }

      /* Wide layout: when the viewport width is bigger than 460px, layout
      changes to a wide layout. */
      @media (min-width: 460px) {
        .toolbar-list {
          display: block;
        }

        .menu-btn {
          display: none;
        }

        .main-content {
          padding-top: 107px;
        }

        /* The drawer button isn't shown in the wide layout, so we don't
        need to offset the title */
        [main-title] {
          padding-right: 0px;
        }
      }
    </style>

    <!-- Header -->
    <app-header condenses reveals effects="waterfall">
      <app-toolbar class="toolbar-top">
        <button class="menu-btn" title="Menu" on-click="${_ => store.dispatch(updateDrawerState(true))}">${menuIcon}</button>
        <div main-title>${appTitle}</div>
      </app-toolbar>

      <!-- This gets hidden on a small screen-->
      <nav class="toolbar-list">
        ${ROUTES.map(i => html`
        <a selected?="${_page === i.key}" href="${i.href}">${i.title}</a>`)}
      </nav>
    </app-header>

    <!-- Drawer content -->
    <app-drawer opened="${_drawerOpened}" on-opened-changed="${e => store.dispatch(updateDrawerState(e.target.opened))}">
      <nav class="drawer-list">
        ${ROUTES.map(i => html`
        <a selected?="${_page === i.key}" href="${i.href}">${i.title}</a>`)}
      </nav>
    </app-drawer>

    <!-- Main content -->
    <main class="main-content">   
      ${this.getAllViews(_page)}
    </main>

    <footer>
      <p>Made with &lt;3 by the Polymer team.</p>
    </footer>

    <snack-bar active?="${_snackbarOpened}">
      You are now ${_offline ? 'offline' : 'online'}.</snack-bar>
    `;
  }

  getAllViews(_page) {
    const views = ROUTES.map(route => this.createViewFromRoute(route, _page));
    const not_found_view = this.createViewFromRoute(ROUTE_NOT_FOUND, _page);
    views.push(not_found_view);
    
    const view = this.shadowRoot.querySelector(`#${this._page}`); // after

    // probably just use iron-pages

    const duration = 250;
    const baseFrame = { 'transform': 'none', 'opacity': 1 };
    const modFrame = { 'transform': 'translate(0px,-50px)', 'opacity': 0 };
    const animationTimingConfig = {
      fill: 'forwards',
      easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      duration: duration
    };

    // let effect = new KeyframeEffect(view, [modFrame, baseFrame], animationTimingConfig);
    // let inAnim = new Animation(effect, document.timeline);

    if (view) {
      console.log('start');
      // inAnim.play();
      console.log('end');
    }
    return views;
  }

  createViewFromRoute(route, _page) {
    const view = document.createElement(route.tag);
    view.setAttribute('id', route.key);
    view.classList.add('page');
    if (route.key === _page) {
      view.setAttribute('active', 'true');
    }

    return view;
  }

  viewChange() {    
    const view = this.shadowRoot.querySelector(`#${this._page}`); // before

    const duration = 250;
    const baseFrame = { 'transform': 'none', 'opacity': 1 };
    const modFrame = { 'transform': 'translate(0px,-50px)', 'opacity': 0 };
    const animationTimingConfig = {
      fill: 'forwards',
      easing: "cubic-bezier(0.4, 0.0, 0.2, 1)",
      duration: duration
    };

    // let effect = new KeyframeEffect(view, [baseFrame, modFrame], animationTimingConfig);
    // let inAnim = new Animation(effect, document.timeline);

    if (view) {
      console.log('start');
      // inAnim.play();
      console.log('end');
    }
    
    return navigate(window.decodeURIComponent(location.pathname));
  }

  static get properties() {
    return {
      appTitle: String,
      _page: String,
      _drawerOpened: Boolean,
      _snackbarOpened: Boolean,
      _offline: Boolean
    }
  }

  constructor() {
    super();
    // To force all event listeners for gestures to be passive.
    // See https://www.polymer-project.org/2.0/docs/devguide/gesture-events#use-passive-gesture-listeners
    setPassiveTouchGestures(true);
  }

  _firstRendered() {
    installRouter((location) => store.dispatch(this.viewChange()));
    installOfflineWatcher((offline) => store.dispatch(updateOffline(offline)));
    installMediaQueryWatcher(`(min-width: 460px)`,
      (matches) => store.dispatch(updateLayout(matches)));
  }

  _didRender(properties, changeList) {
    if ('_page' in changeList) {
      const pageTitle = properties.appTitle + ' - ' + changeList._page;
      updateMetadata({
        title: pageTitle,
        description: pageTitle
        // This object also takes an image property, that points to an img src.
      });
    }
  }

  _stateChanged(state) {
    this._page = state.app.page;
    this._offline = state.app.offline;
    this._snackbarOpened = state.app.snackbarOpened;
    this._drawerOpened = state.app.drawerOpened;
  }
}

window.customElements.define('my-app', MyApp);

import { observable, computed, action, ObservableMap } from 'mobx';
import { DB, LogRecord } from './db';
import * as React from 'react';
import sampleJSON from './a-trip-to-the-zoo-8.json';
import { nextTick } from 'q';

export const allResponses: string[] = [
  'like', 'want', 'not', 'go',
  'get', 'make', 'look', 'turn',
  'good', 'more', 'help', 'different',
  'I', 'he', 'you', 'she',
  'open', 'do', 'that', 'up',
  'put', 'same', 'all', 'some',
  'it', 'here', 'where', 'what',
  'in', 'on', 'why', 'who',
  'can', 'finished', 'when', 'stop'
];

class Store {
  public db: DB;

  // does user have admin privileges 
  @computed get isAdmin() { return this.db.isAdmin; }

  // thr login name
  @computed get teacherid() {
    return this.db.login;
  }

  // editing state
  @observable editing = false;
  @observable editSlug = '';

  @observable studentid: string = '';
  // set student's id
  @action.bound setstudentid(id: string) {
    this.studentid = id;
  }
  // list of books to display
  @computed({keepAlive: true}) get sharedBookListP() {
    console.log('get sbl');
    return this.db.fetchBookList('');
  }
  // state of booklist display
  @observable bookListOpen: ObservableMap<string, boolean> = observable.map();
  @action.bound bookListToggle(level: string) {
    this.bookListOpen.set(level, !this.bookListOpen.get(level));
  }
  // list of recent books for this teacher
  @computed get teacherBookListP() {
    console.log('get rbl');
    return this.db.fetchBookList(this.teacherid);
  }

  // the id of the book to read or '' for the landing page
  @observable bookid: string = '';
  @action.bound setBookid(s: string) {
    this.bookid = s;
    this.pageno = 1;
  }

  // an observable promise for the book associated with bookid
  @computed get bookP() {
    return this.db.fetchBook(this.bookid);
  }
  // the page number we're reading
  @observable pageno: number = 1;
  // number of pages in the book
  @computed get npages() {
    return this.bookP.case({
      rejected: () => 0,
      pending: () => 0,
      fulfilled: (book) => book.pages.length
    })
  }
  // update the state typically from a URL
  @action.bound setPath(studentid: string, bookid: string, page: number) {
    this.studentid = studentid;
    this.bookid = bookid;
    this.pageno = bookid ? page : 1;
    this.editing = false;
  }
  @action.bound setEditPath(slug: string) {
    this.editing = true;
    this.editSlug = slug;
    console.log('sep', this.editing, this.editSlug);
  }

  // map the state to a url
  @computed get currentPath() {
    if (this.editing) {
      const p = '/edit' + (this.editSlug ? '/' + this.editSlug : '');
      console.log(p);
      return p;
    }
    if (!this.studentid) {
      return '/';
    }
    return `/read/${encodeURIComponent(this.studentid)}/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : '');
  }
  // set the page number
  @action.bound public setPage(i: number) {
    this.pageno = i;
    if (this.bookP.state === 'fulfilled') {
      this.pageno = Math.max(1, Math.min(this.bookP.value.pages.length+1, this.pageno));
    }
  }
  // index to the readings array
  @observable public reading: number = 1;
  @action.bound public setReading(n: number) {
    this.reading = n;
    this.responseIndex = 0;
  }
  @computed get nreadings() {
    return this.bookP.case({
      rejected: () => 0,
      pending: () => 0,
      fulfilled: (book) => book.comments.length
    })
  }
  // allow excluding responses from the list
  @observable public responsesExcluded = new Map<string, boolean>();
  @action.bound public setExcluded(word: string, value: boolean) {
    this.responsesExcluded.set(word, value);
  }

  @observable public responseOffset = 0;
  @observable public responsesPerPage = 4;
  @action.bound setResponsesPerPage(n: number) {
    this.responsesPerPage = n;
  }

  @computed get allowedResponses() {
    return allResponses.filter(r => !this.responsesExcluded.get(r));
  }
  // get responses for this reading
  @computed get responses() {
    return this.allowedResponses.slice(this.responseOffset, this.responseOffset + this.responsesPerPage);
  }
  @action.bound public stepResponsePage(direction: number) {
    const rpp = this.responsesPerPage,
          pageNo = Math.floor(this.responseOffset / rpp),
          N = this.allowedResponses.length;
    this.responseOffset = (((pageNo + direction) * rpp) % N + N) % N;
    this.responseIndex = -1;
  }

  // placement of the response symbols
  @observable public layout: string = 'bottom';
  @action.bound public setLayout(side: string) {
    this.layout = side;
  }

  // size of the response symbols
  @observable public responseSize: number = 30;
  @action.bound public setResponseSize(i: number) {
    this.responseSize = i;
  }

  // currently selected response symbol
  @observable public responseIndex: number = -1;
  @computed get nresponses() { return this.responses.length; }
  @action.bound public nextResponseIndex() {
    this.responseIndex = (this.responseIndex + 1) % this.nresponses;
  }
  @action.bound public setResponseIndex(i: number) {
    this.responseIndex = i;
  }
  // current response
  @computed get word() { return this.responses[this.responseIndex]; }

  // visibility of the controls modal
  @observable public controlsVisible: boolean = false;
  @action.bound public toggleControlsVisible() {
    this.controlsVisible = !this.controlsVisible;
  }
  // visibility of page turn buttons on book page
  @observable public pageTurnVisible: boolean = true;
  @action.bound public togglePageTurnVisible() {
    this.pageTurnVisible = !this.pageTurnVisible;
  }
  // screen dimensions updated on resize
  @observable public screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  @action.bound public resize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }
  // json string to persist the state
  @computed get persist(): string {
    const obj = {
      layout: this.layout,
      responseSize: this.responseSize,
      pageTurnVisible: this.pageTurnVisible,
      bookListOpen: this.bookListOpen.toJSON()
    };
    const r = JSON.stringify(obj);
    return r;
  }
  // restore the state from json
  @action.bound public setPersist(js: string) {
    const v = JSON.parse(js);
    this.layout = v.layout;
    this.responseSize = v.responseSize;
    this.pageTurnVisible = v.pageTurnVisible;
    Object.keys(v.bookListOpen).forEach(key => this.bookListOpen.set(key, v.bookListOpen[key]));
  }

  @observable spotlight_css: React.CSSProperties = {};
  @observable spotlight_base: number = 100;

  // draws a spotlight on the image 
  @action.bound public draw_box(e?) {
    // return if number of pages in book has been exceeded 
    if (this.pageno > this.npages) {
      return;
    }

    // click coordinate if available 
    let click_x;
    let click_y;
    if (e !== undefined) {
      click_x = e.clientX;
      click_y = e.clientY;
    }

    // reference to the spotlight-container element 
    let offset_x, offset_y = 0;
    let spotlight_container = document.querySelector('.book-page-spotlight') as HTMLDivElement;
    if (spotlight_container !== null) {
      offset_y = spotlight_container.getBoundingClientRect().top;
    }

    // reference to the book page image 
    let image_reference = document.querySelector('.pic') as HTMLImageElement;
    let image_width, image_height, previous_src;
    if (image_reference !== null) {
      image_width = image_reference.width;
      image_height = image_reference.height;
      previous_src = image_reference.src;
      offset_x = image_reference.offsetLeft;
    }

    // fixes bug where image does not load (even with onload)
    if (e === undefined && this.bookid === 'a-trip-to-the-zoo-8') {
      let timeout = 0;
      let id = setInterval(() => {
        if (this.pageno === 1 || this.pageno === 2) {
          clearInterval(id);
          next(this);
        } else if (image_reference.src !== previous_src) {
          clearInterval(id);
          image_width = image_reference.width;
          image_height = image_reference.height;
          offset_x = image_reference.offsetLeft;
          next(this);
        } 
  
        // timeout if after 10 seconds image has not been updated 
        timeout += 50;
        if (timeout === 5000) {
          clearInterval(id);
          console.log('timed out.');
        }
      }, 50);
    } else {
      next(this);
    }

    function next(t) {
      // relative distance from top left of image to the click location itself 
      let spotlight_x = (offset_x + (click_x - offset_x)) - (t.spotlight_base / 2);
      let spotlight_y = (click_y - offset_y) - (t.spotlight_base / 2);
      if (e === undefined) {
        if (t.bookid === 'a-trip-to-the-zoo-8') {
          if (t.pageno !== 1 && t.pageno !== 2) {
            spotlight_x = offset_x + sampleJSON.pages[t.pageno - 1].x - (t.spotlight_base / 2);
            spotlight_y = offset_y + sampleJSON.pages[t.pageno - 1].y - (t.spotlight_base / 2);
          }
        } else {
          return;
        }
      }

      // spotlight CSS
      t.spotlight_css = {
        position: 'fixed',
        width: t.spotlight_base + 'px',
        height: t.spotlight_base + 'px',
        borderRadius: (t.spotlight_base / 2) + 'px',
        backgroundColor: 'black',
        left: spotlight_x + 'px',
        top: spotlight_y + 'px',
        opacity: 0.4
      };

      // below comment is necessary for debugging, do not delete 
      // console.log(`"x": ` + (click_x - offset_x) + `, "y": ` + (click_y - offset_y) + `, "offset_x": ` + offset_x + `, "offset_y": ` + offset_y + `,`)
    }
  }

  // log state changes
  public log(response?: string) {
    const lr: LogRecord = {
      teacher: this.teacherid,
      student: this.studentid,
      bookid: this.bookid,
      page: this.pageno,
      reading: this.reading
    };
    if (response) {
      lr.response = response;
    }
    this.db.log(lr);
  }
}

export default Store;

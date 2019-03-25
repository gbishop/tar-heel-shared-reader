import { observable, computed, action, ObservableMap } from 'mobx';
import { DB, LogRecord } from './db';
import * as React from 'react';
let sampleJSON = require('./things-in-a-classroom.json');

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

  // sets the correct spotlight index
  @action.bound public set_spotlight_index(word: string) {
    this.spotlight_descriptions.forEach((item, ind) => {
      if (word === item && word !== "") {
        this.spotlight_index = ind;
      }
    });
  }

  // description of spotlight 
  @observable spotlight_descriptions = [
    sampleJSON.pages[0][0].description, 
    sampleJSON.pages[0][1].description, 
    sampleJSON.pages[0][2].description, 
    sampleJSON.pages[0][3].description
  ];
  // index that determines which spotlight description to select from spotlight_descriptions 
  @observable spotlight_index = 0;
  // width and height of diameter 
  @observable spotlight_base: number = 100;
  // whether or not the spotlight demo is in effect 
  @observable is_spotlight_demo = true;
  // css properties of spotlight element
  @observable spotlight_css: React.CSSProperties = this.set_initial_spotlight_css();

  public set_initial_spotlight_css() {
    let spotlight_css: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'absolute',
      width: this.spotlight_base + 'px',
      height: this.spotlight_base + 'px',
      borderRadius: (this.spotlight_base / 2) + 'px',
      visibility: 'hidden',
      textAlign: 'center',
      color: 'white',
      boxShadow: '0px 0px 4px 10px rgba(0,0,0,0.5) inset, 0px 0px 0px 1000px rgba(0,0,0,0.5)',
    };
    if (this.is_spotlight_demo) {
      let title: string | undefined = '';
      let pageno = Number(window.location.pathname.split('/').pop());
      if (isNaN(pageno)) {
        pageno = 1;
        title = window.location.pathname.split('/').pop();
      } else if (window.location.pathname.split('/').length <= 2) {
        pageno = 1;
        console.log('here');
      } else {
        let history = window.location.pathname.split('/');
        title = history[history.length - 2];
      }

      if (pageno > sampleJSON.pages.length) { return spotlight_css; } 

      console.log("pageno is", sampleJSON.pages[pageno - 1]);
      spotlight_css.left = sampleJSON.pages[pageno - 1][0].x + '%';;
      spotlight_css.top = sampleJSON.pages[pageno - 1][0].y + '%';
      spotlight_css.visibility = 'visible';
    } 
    return spotlight_css;
  }

  // draws a spotlight on the image 
  @action.bound public draw_spotlight(e) {
    let image_properties = e.currentTarget.getBoundingClientRect();
    let normalized_x = e.clientX - image_properties.left;
    let normalized_y = e.clientY - image_properties.top;

    if (normalized_x < 0) {
      normalized_x = 0;
    } else if (normalized_x > image_properties.width) {
      normalized_x = image_properties.width;
    }

    if (normalized_y < 0) {
      normalized_y = 0;
    } else if (normalized_y > image_properties.height) {
      normalized_y = image_properties.height;
    }

    let center_x = normalized_x - (this.spotlight_base / 2);
    let center_y = normalized_y - (this.spotlight_base / 2); 
    let percentage_x = center_x / image_properties.width * 100;
    let percentage_y = center_y / image_properties.height * 100;
    this.spotlight_css.left = percentage_x + '%';
    this.spotlight_css.top = percentage_y + '%';
    this.spotlight_css.visibility = 'visible';

    // let spotlight_area = Math.PI * (this.spotlight_base / 2) ^ 2;
    // let picture_area = image_properties.width * image_properties.height;
    // console.log('spotlight area', spotlight_area, 'picture area', picture_area);
    // console.log((spotlight_area / picture_area * 100) + '%');

    // console.log(`{ "x": ` + percentage_x + `, "y": ` + percentage_y + `, "description": "" },`);
  }

  @action.bound public draw_spotlight_demo(index: number) {
    if (sampleJSON.title !== this.bookid) { return; }
    if (this.is_spotlight_demo === false || this.pageno > sampleJSON.pages.length) { return; } 
    this.spotlight_css.left = sampleJSON.pages[this.pageno - 1][index].x + '%';
    this.spotlight_css.top = sampleJSON.pages[this.pageno - 1][index].y + '%';
    this.spotlight_css.visibility = 'visible';
    this.spotlight_descriptions = ["", "", "", ""];
    sampleJSON.pages[this.pageno - 1].forEach((item, ind) => {
      this.spotlight_descriptions[ind] = sampleJSON.pages[this.pageno - 1][ind].description;
    });
  }

  // hides the spotlight element
  @action.bound public hide_spotlight() {
    this.spotlight_css.visibility = 'hidden';
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

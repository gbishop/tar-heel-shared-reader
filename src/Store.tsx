import { observable, computed, action, ObservableMap } from 'mobx';
import { DB, LogRecord } from './db';
import * as React from 'react';

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

  @action.bound public draw_box(e) {
    // reference to reading-container element 
    let offset_x = e.currentTarget.parentElement.offsetLeft;
    let offset_y = 0;
    let reading_container = document.querySelector('.reading-container') as HTMLDivElement;
    if (reading_container !== null) {
      offset_y = reading_container.offsetTop;
    }

    // reference to the book page image 
    let image_reference = document.querySelector('.pic') as HTMLImageElement;
    let image_width, image_height = 0;
    if (image_reference !== null) {
      image_width = image_reference.width;
      image_height = image_reference.height;
    }

    // relative coordinates of the book page image 
    let image_coordinates = {
      topLeft: { x: offset_x, y: offset_y },
      topRight: { x: offset_x + image_width, y: offset_y },
      bottomLeft: { x: offset_x, y: offset_y + image_height },
      bottomRight: { x: offset_x + image_width, y: offset_y + image_height }
    };

    // relative distance from top left of image to the click location itself 
    let relative_x = ((e.clientX - offset_x) - (this.spotlight_base / 2)) - image_coordinates.topLeft.x;
    let relative_y = ((e.clientY - offset_y) - (this.spotlight_base / 2)) - image_coordinates.topLeft.y;

    // relative coordinates of the spotlight itself 
    let spotlight_x = image_coordinates.topLeft.x + relative_x;
    let spotlight_y = image_coordinates.topLeft.y + relative_y;

    // spotlight CSS
    this.spotlight_css = {
      position: 'absolute',
      width: this.spotlight_base + 'px',
      height: this.spotlight_base +'px',
      borderRadius: (this.spotlight_base / 2) + 'px',
      backgroundColor: 'white',
      left: spotlight_x,
      top: spotlight_y,
      opacity: 0.4
    };
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

import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { SharedBook, fetchBook, fetchBookList } from './SharedBook';
import { DB, LogRecord } from './db';

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
  // auth with THR setting the id and role
  public authUser() {
    this.db.auth();
  }

  @observable studentid: string = '';
  // set student's id
  @action.bound setstudentid(id: string) {
    this.studentid = id;
  }
  // list of books to display
  @computed get sharedBookListP() {
    return fromPromise(fetchBookList());
  }
  // state of booklist display
  @observable booklistOpen = observable.map();
  @action.bound bookListToggle(level: string) {
    this.booklistOpen.set(level, !this.booklistOpen.get(level));
  }

  // the id of the book to read or '' for the landing page
  @observable bookid: string = '';
  @action.bound setBookid(s: string) {
    this.bookid = s;
  }

  // an observable promise for the book associated with bookid
  @computed get bookP() {
    return fromPromise(fetchBook(this.bookid)) as
        IPromiseBasedObservable<SharedBook>; }
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
    this.pageno = page;
  }
  // map the state to a url
  @computed get currentPath() {
    if (!this.studentid) {
      return '/';
    }
    return `/${encodeURIComponent(this.studentid)}/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : '');
  }
  // step to the next page
  // turnPage event
  @action.bound public nextPage() {
    if (this.pageno <= this.npages) {
      this.pageno += 1;
    }
  }
  // step back to previous page
  // turnPage event
  @action.bound public backPage() {
    if (this.pageno > 1) {
      this.pageno -= 1;
      // doesPageNumberEventExist = true;
    } else {
      this.pageno = this.npages + 1;
      return;
    }

  }
  // set the page number
  @action.bound public setPage(i: number) {
    this.pageno = i;
  }
  // index to the readings array
  @observable public reading: number = 0;
  @action.bound public setReading(n: number) {
    this.reading = n;
    this.responseIndex = 0;
  }
  @computed get nreadings() {
    return this.bookP.case({
      rejected: () => 0,
      pending: () => 0,
      fulfilled: (book) => book.readings.length
    })
  }
  // get comment for page and reading
  @computed get comment() {
    return this.bookP.case({
      rejected: () => '',
      pending: () => '',
      fulfilled: (book) => 
        this.pageno <= this.npages ?
          book.readings[this.reading].comments[this.pageno - 1] :
          ''
    })
  }
  // allow excluding responses from the list
  @observable public responsesExcluded = new Map<string, boolean>();
  @action.bound public setExcluded(word: string, value: boolean) {
    this.responsesExcluded.set(word, value);
  }

  @observable public responseOffset = 0;
  @observable public responsesPerPage = 4;

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
    return JSON.stringify({
      layout: this.layout,
      responseSize: this.responseSize,
      pageTurnVisible: this.pageTurnVisible,
      bookListOpen: this.booklistOpen.toJS()
    });
  }
  // restore the state from json
  @action.bound public setPersist(js: string) {
    const v = JSON.parse(js);
    this.layout = v.layout;
    this.responseSize = v.responseSize;
    this.pageTurnVisible = v.pageTurnVisible;
    Object.keys(v.bookListOpen).forEach(key => this.booklistOpen.set(key, v.bookListOpen[key]));
  }

  // log state changes
  public log(response?: string) {
    const lr: LogRecord = {
      teacher: this.teacherid,
      student: this.studentid,
      book: this.bookid,
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

import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { SharedBook, fetchBook } from './SharedBook';
import DB from './db';

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
  db: DB;

  // does user have admin privileges 
  @computed get isAdmin() { return this.db.isAdmin; }

  // thr login name
  @computed get teacherid() {
    return this.db.login;
  }
  // auth with THR setting the id and role
  authUser() {
    this.db.auth();
  }

  @observable studentid: string = '';
  // set student's id
  @action.bound setstudentid(id: string) {
    this.studentid = id;
  }
  // the id of the book to read or '' for the landing page
  @observable bookid: string = '';
  // an observable promise for the book associated with bookid
  @computed get bookP() {
    return fromPromise(fetchBook(`/api/sharedbooks/${this.bookid}.json`)) as
        IPromiseBasedObservable<SharedBook>; }
  // get the book without having to say bookP.value all the time
  // these computed are cached so this function only runs once after a change
  @computed get book() { return this.bookP.value; }
  // the page number we're reading
  @observable pageno: number = 1;
  // number of pages in the book
  @computed get npages() { return this.book.pages.length; }
  // update the state typically from a URL
  @action.bound setIdPage(id: string, page: number) {
    this.bookid = id;
    this.pageno = page;
  }
  // map the state to a url
  @computed get currentPath() {
    return `/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : '');
  }
  // step to the next page
  // turnPage event
  @action.bound nextPage() {
    if (this.pageno <= this.npages) {
      this.pageno += 1;
      /*
      this.firebaseEvent(
        this.teacherid, 
        this.studentInitials, 
        this.book.title, 
        'PAGE NUMBER ' + this.pageno,
        () => {
          this.firebaseEvent(
            this.teacherid,
            this.studentInitials,
            this.book.title,
            'TURN PAGE'
          );
        }
      );
      this.firebaseUsageEvent([
        { attrName: 'number_page_number_events', attrValue: 1 },
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 }
      ]);
      */
    }
    console.log('nextPage', this.pageno);
  }
  // step back to previous page
  // turnPage event
  @action.bound backPage() {
  /*
    let doesPageNumberEventExist: boolean = false;
    let updatedAttributes: Array<{attrName: string, attrValue: string | number }> = [];
    */

    if (this.pageno > 1) {
      this.pageno -= 1;
      // doesPageNumberEventExist = true;
    } else {
      this.pageno = this.npages + 1;
      return;
    }

    /*
    if (doesPageNumberEventExist) {
      this.firebaseEvent(
        this.teacherid,
        this.studentInitials,
        this.book.title,
        'PAGE NUMBER ' + this.pageno,
        () => {
          this.firebaseEvent(
            this.teacherid,
            this.studentInitials,
            this.book.title,
            'TURN PAGE'
          );
        }
      );
      updatedAttributes.push(
        { attrName: 'number_page_number_events', attrValue: 1 }, 
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 }
      );
    } else {
      this.firebaseEvent(
        this.teacherid,
        this.studentInitials,
        this.book.title,
        'TURN PAGE'
      );
      updatedAttributes.push(
        { attrName: 'number_turn_page_events', attrValue: 1 },
        { attrName: 'number_pages_read', attrValue: 1 } 
      );
    }
    */
    /*
    this.firebaseUsageEvent(updatedAttributes);
    */
    console.log('backPage', this.pageno);
  }
  // set the page number
  @action.bound setPage(i: number) {
    this.pageno = i;
    /*
    this.firebaseEvent(
      this.teacherid,
      this.studentInitials,
      this.book.title,
      'PAGE NUMBER ' + this.pageno
    );
    this.firebaseUsageEvent([
      { attrName: 'number_page_number_events', attrValue: 1}
    ]);
    */
  }
  // index to the readings array
  @observable reading: number = 0;
  @action.bound setReading(n: number) {
    this.reading = n;
    this.responseIndex = 0;
  }
  @computed get nreadings() { return this.book.readings.length; }
  // get comment for page and reading
  @computed get comment() {
    if (this.pageno <= this.npages) {
      return this.book.readings[this.reading].comments[this.pageno - 1];
    } else {
      return '';
    }
  }
  // allow excluding responses from the list
  @observable responsesExcluded = new Map<string, boolean>();
  @action.bound setExcluded(word: string, value: boolean) {
    this.responsesExcluded.set(word, value);
  }

  @observable responseOffset = 0;
  @observable responsesPerPage = 4;

  @computed get allowedResponses() {
    return allResponses.filter(r => !this.responsesExcluded.get(r));
  }
  // get responses for this reading
  @computed get responses() {
    return this.allowedResponses.slice(this.responseOffset, this.responseOffset + this.responsesPerPage);
  }
  @action.bound stepResponsePage(direction: number) {
    var rpp = this.responsesPerPage,
        pageNo = Math.floor(this.responseOffset / rpp),
        N = this.allowedResponses.length;
    this.responseOffset = (((pageNo + direction) * rpp) % N + N) % N;
    this.responseIndex = -1;
  }

  // placement of the response symbols
  @observable layout: string = 'bottom';
  @action.bound setLayout(side: string) {
    this.layout = side;
  }

  // size of the response symbols
  @observable responseSize: number = 30;
  @action.bound setResponseSize(i: number) {
    this.responseSize = i;
  }

  // currently selected response symbol
  @observable responseIndex: number = -1;
  @computed get nresponses() { return this.responses.length; }
  @action.bound nextResponseIndex() {
    this.responseIndex = (this.responseIndex + 1) % this.nresponses;
  }
  @action.bound setResponseIndex(i: number) {
    this.responseIndex = i;
  }
  // current response
  @computed get word() { return this.responses[this.responseIndex]; }

  // visibility of the controls modal
  @observable controlsVisible: boolean = false;
  @action.bound toggleControlsVisible() {
    this.controlsVisible = !this.controlsVisible;
  }
  // visibility of page turn buttons on book page
  @observable pageTurnVisible: boolean = true;
  @action.bound togglePageTurnVisible() {
    this.pageTurnVisible = !this.pageTurnVisible;
  }
  // screen dimensions updated on resize
  @observable screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  @action.bound resize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }
  // json string to persist the state
  @computed get persist(): string {
    return JSON.stringify({
      layout: this.layout,
      responseSize: this.responseSize,
      pageTurnVisible: this.pageTurnVisible
    });
  }
  // restore the state from json
  @action.bound setPersist(js: string) {
    var v = JSON.parse(js);
    this.layout = v.layout;
    this.responseSize = v.responseSize;
    this.pageTurnVisible = v.pageTurnVisible;
  }
}

export default Store;

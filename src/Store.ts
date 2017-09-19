import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { SharedBook, fetchBook } from './SharedBook';
import * as firebase from 'firebase';

// sides of the display to include responses
type Layout = {
  left: boolean, right: boolean, top: boolean, bottom: boolean;
};

class Store {
  // versatile function used to push events to database 
  firebaseEvent(teacherID: string, studentID: string, book: string, event: string): void {
    firebase.database().ref('events').push().set({
      teacherID: teacherID,
      studentID: studentID,
      date: new Date(new Date().getTime()).toLocaleString(),
      book: book,
      event: event
    });
  }

  // login message 
  @observable message: string = 'Please sign in to Google to continue';
  // change login message 
  @action.bound setMessage(message: string): void {
    this.message = message;
  }
  // is the user signing in to firebase
  @observable isSigningIn: boolean = false;
  // change status of logging
  @action.bound setIsSigningIn(isSigningIn: boolean) {
    this.isSigningIn = isSigningIn;
  }
  // is the user signed in to firebase
  @observable isSignedIn: boolean = false;
  // change status of login
  @action.bound setIsSignedIn(isSignedIn: boolean) {
    this.isSignedIn = isSignedIn;
  }
  // the Landing page number
  @observable mode: number = 0;
  // set Landing page number
  @action.bound setmode(mode: number) {
    this.mode = mode;
  }
  // the firebase id (teacherID)
  @observable teacherid: string = '';
  // set the firebase id (teacherID)
  @action.bound setteacherid(id: string) {
    this.teacherid = id;
  }
  // the firebase email
  @observable email: string = '';
  // set the firebase email 
  @action.bound setemail(email: string) {
    this.email = email;
  }
  // the student's id
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
      this.firebaseEvent(
        this.teacherid, 
        this.studentid, 
        this.book.title, 
        'PAGE NUMBER ' + this.pageno
      );
    }
    this.firebaseEvent(
      this.teacherid,
      this.studentid,
      this.book.title,
      'TURN PAGE'
    );
    console.log('nextPage', this.pageno);
  }
  // step back to previous page
  // turnPage event
  @action.bound backPage() {
    if (this.pageno > 1) {
      this.pageno -= 1;
      this.firebaseEvent(
        this.teacherid,
        this.studentid,
        this.book.title,
        'PAGE NUMBER ' + this.pageno
      );
    } else {
      this.pageno = this.npages + 1;
    }
    this.firebaseEvent(
      this.teacherid,
      this.studentid,
      this.book.title,
      'TURN PAGE'
    );
    console.log('backPage', this.pageno);
  }
  // set the page number
  @action.bound setPage(i: number) {
    this.pageno = i;
    this.firebaseEvent(
      this.teacherid,
      this.studentid,
      this.book.title,
      'PAGE NUMBER ' + this.pageno
    );
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
  // get responses for this reading
  @computed get responses() { return this.book.readings[this.reading].responses; }

  // placement of the response symbols
  @observable layout: Layout = {
    left: true, right: true, top: false, bottom: false };
  @action.bound setLayout(side: string, value: boolean) {
    this.layout[side] = value;
  }

  // size of the response symbols
  @observable responseSize: number = 30;
  @action.bound setResponseSize(i: number) {
    this.responseSize = i;
  }

  // currently selected response symbol
  @observable responseIndex: number = 0;
  @computed get nresponses() { return this.book.readings[this.reading].responses.length; }
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

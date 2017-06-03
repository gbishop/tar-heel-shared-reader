import { observable, computed, action, reaction } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';
import { SharedBook, fetchBook } from './SharedBook';

type Layout = {
  left: boolean, right: boolean, top: boolean, bottom: boolean;
};

class Store {
  @observable bookid: number = 0;
  @observable bookP: IPromiseBasedObservable<SharedBook>;
  @computed get book() { return this.bookP.value; }
  @observable pageno: number = 1;
  @computed get npages() { return this.book.pages.length; }
  @action.bound setIdPage(id: number, page: number) {
    this.bookid = id;
    this.pageno = page;
  }
  @computed get currentPath() { return `/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : ''); }
  @action.bound nextPage() {
    if (this.pageno <= this.npages) {
      this.pageno += 1;
    }
  }
  @action.bound backPage() {
    if (this.pageno > 1) {
      this.pageno -= 1;
    } else {
      this.pageno = this.npages + 1;
    }
  }
  @action.bound setPage(i: number) {
    this.pageno = i;
  }
  @observable reading: number = 0;
  @action.bound setReading(n: number) {
    this.reading = n;
  }
  @computed get nreadings() { return this.book.readings.length; }

  @observable layout: Layout = {
    left: true, right: true, top: false, bottom: false };
  @action.bound setLayout(side: string, value: boolean) {
    this.layout[side] = value;
  }

  @observable responseSize: number = 30;
  @action.bound setResponseSize(i: number) {
    this.responseSize = i;
  }

  @observable responseIndex: number = 0;
  @computed get nresponses() { return this.book.readings[this.reading].responses.length; }
  @action.bound nextResponseIndex() {
    this.responseIndex = (this.responseIndex + 1) % this.nresponses;
    console.log('nri', this.responseIndex);
  }
  @action.bound setResponseIndex(i: number) {
    this.responseIndex = i;
  }

  @observable showControls: boolean = false;
  @action.bound toggleControls() {
    this.showControls = !this.showControls;
  }

  @observable showPageTurn: boolean = false;
  @action.bound togglePageTurn() {
    this.showPageTurn = !this.showPageTurn;
  }

  @observable screen = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  @action.bound resize() {
    this.screen.width = window.innerWidth;
    this.screen.height = window.innerHeight;
  }

  @computed get persist(): string {
    return JSON.stringify({
      layout: this.layout,
      responseSize: this.responseSize,
      showPageTurn: this.showPageTurn,
      reading: this.reading
    });
  }

  @action.bound setPersist(js: string) {
    var v = JSON.parse(js);
    this.layout = v.layout;
    this.responseSize = v.responseSize;
    this.showPageTurn = v.showPageTurn;
    this.reading = v.reading;
  }

  fetchHandler: {};

  constructor() {
    // fetch the book when the id changes
    // figure out when to dispose of this
    this.fetchHandler = reaction(
      () => this.bookid,
      (bookid) => {
        this.bookP = fromPromise(fetchBook(`/api/sharedbooks/${this.bookid}.json`)) as
          IPromiseBasedObservable<SharedBook>;
      });
  }
}

export default Store;

import { extendObservable, computed, action, reaction } from 'mobx';
import { fromPromise } from 'mobx-utils';

function wrap(func, tag) {
  return function(arg) {
    console.log(tag, arg);
    return func(arg);
  }
}

class FetchError extends Error {
  constructor(orig) {
    super();
    this.message = "fetch error";
    this.details = orig;
  }
}

function simpleFetch(url) {
  return new Promise((resolve, reject) => {
    window.fetch(url)
      .catch(err => new FetchError(err))
      .then(res => {
        if (res.ok) {
          res.json().then(resolve).catch(wrap(reject, 'r1'))
        } else {
          reject(res)
        }
      })
      .catch(wrap(reject, 'r3'))
  });
}

class Store {
  constructor() {
    extendObservable(this, {
      // db key
      bookid: 0,
      // promise for the book
      bookP: null,
      // avoiding having to type bookP.value all the time
      // is there a better way?
      book: computed(() => this.bookP.value),

      // page we are reading
      pageno: 1,
      // number of pages
      npages: computed(() => this.book.pages.length),

      // set state from url
      setIdPage: action((id, page) => {
        this.bookid=id; this.pageno=page } ),

      // generate url from state
      currentPath: computed(() => `/${this.bookid}` + (this.pageno > 1 ? `/${this.pageno}` : '')),

      // turn pages
      nextPage: action(() => {
        if (this.pageno <= this.npages) {
          this.pageno += 1;
        }
      }),

      backPage: action(() => {
        if (this.pageno > 1) {
          this.pageno -= 1;
        } else {
          this.pageno = this.npages+1;
        }
      }),
      setPage: action((i) => this.pageno = +i),

      // index for which set of comments and responses to use
      reading: 0, 
      // set the reading
      setReading: action((i) => this.reading = i),

      // number of readings supplied
      nreadings: computed(() => this.book.readings.length),

      // where the responses are on the screen
      layout: { left: true, right: true, top: false, bottom: false },
      // set the layout
      setLayout: action((side, value) => this.layout[side] = value),

      // size of each response button in secondary direction % of screen size
      responseSize: 30,
      // set response button size
      setResponseSize: action((i) => this.responseSize = +i),

      // currently selected response
      responseIndex: 0,
      // number of responses for this reading
      nresponses: computed(() =>
        this.book.readings[this.reading].responses.length),
      // bump to the next response
      nextResponseIndex: action(() => {
        this.responseIndex = (this.responseIndex + 1) % this.nresponses;
        console.log('nri', this.responseIndex);
      }),
      // focus on a response
      setResponseIndex: action((i) => {
        this.responseIndex = +i;
      }),

      // reading controls are visible when true
      showControls: false,
      // change visibility of controls
      toggleControls: action(() => this.showControls = !this.showControls),


      // page turn buttons are vibible when true
      showPageTurn: true,
      // change visibility of page turn buttons
      togglePageTurn: action(() => this.showPageTurn = !this.showPageTurn),
      // screen size
      screen: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      resize: action(() => {
        this.screen.width = window.innerWidth;
        this.screen.height = window.innerHeight;
      }),

      get persist() {
        return {
          layout: this.layout,
          responseSize: this.responseSize,
          showPageTurn: this.showPageTurn,
          reading: this.reading
        }
      },

      set persist(v) {
        this.layout = v.layout;
        this.responseSize = v.responseSize;
        this.showPageTurn = v.showPageTurn;
        this.reading = v.reading;
      }

    });
    // fetch the book when the id changes
    // figure out when to dispose of this
    this.fetchHandler = reaction(
      () => this.bookid,
      (bookid) => {
        this.bookP = fromPromise(simpleFetch(`/api/sharedbooks/${this.bookid}.json`))
      });

  }
}

export default Store;

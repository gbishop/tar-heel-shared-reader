import { Number, String, Array, Record, Static } from 'runtypes';

// construct the validator for shared books
const Page = Record({
  text: String,
  url: String,
  width: Number,
  height: Number
});

const Reading = Record({
  responses: Array(String),
  comments: Array(String),
});

const SharedBookValidator = Record({
  title: String,
  slug: String,
  author: String,
  pages: Array(Page),
  readings: Array(Reading)
}).withConstraint(validateLengths);

function validateLengths(sba: {}) {
  const sb = sba as SharedBook;
  const npages = sb.pages.length;
  const nreadings = sb.readings.length;
  for (let i = 0; i < nreadings; i++) {
    if (sb.readings[i].comments.length !== npages) {
      return 'Array lengths do not match';
    }
  }
  return true;
}

const SharedBookListValidator = 
  Record({
    results: Array(Record({
    title: String,
    author: String,
    pages: Number,
    slug: String,
    level: String,
    image: String,
    id: Number
  }))
  });

// construct the typescript type
export type SharedBook = Static<typeof SharedBookValidator>;
export type SharedBookList = Static<typeof SharedBookListValidator>;

export function fetchBook(id: string): Promise<SharedBook> {
  return new Promise((resolve, reject) => {
    window.fetch(`/api/db/books/${id}`)
      .then(res => {
        if (res.ok) {
          res.json().then(obj => resolve(SharedBookValidator.check(obj))).catch(reject);
        } else {
          reject(res);
        }
      })
      .catch(reject);
  });
}

export function fetchBookList(): Promise<SharedBookList> {
  return new Promise((resolve, reject) => {
    window.fetch('/api/db/books')
      .then(res => {
        if (res.ok) {
          res.json().then(obj => resolve(SharedBookListValidator.check(obj))).catch(reject);
        } else {
          reject(res);
        }
      })
      .catch(reject);
  });
}
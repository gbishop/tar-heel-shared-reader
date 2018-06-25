import { Number, String, Array, Record, Static } from 'runtypes';
import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';

// export const THRURL = 'https://gbserver3.cs.unc.edu/';
export const THRURL = 'https://tarheelreader.org/';

export interface LogRecord {
  teacher: string;
  student: string;
  book: string;
  reading: number;
  page: number;
  response?: string;
}

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

const SharedBookListItemValidator = Record({
    title: String,
    author: String,
    pages: Number,
    slug: String,
    level: String,
    image: String,
    id: Number
  });

const SharedBookListValidator = 
  Record({
    results: Array(SharedBookListItemValidator)
  });

// construct the typescript type
export type SharedBook = Static<typeof SharedBookValidator>;
export type SharedBookListItem = Static<typeof SharedBookListItemValidator>;
export type SharedBookList = Static<typeof SharedBookListValidator>;

export class DB {
  @observable login: string = '';
  @observable role: string = '';
  token: string = '';
  @computed get isAdmin() {
    return this.role === 'admin';
  }

  @action.bound setLoginRole(login: string, role: string, token: string) {
    this.login = login;
    this.role = role;
    this.token = token;
  }

  auth() {
    fetch(THRURL + '/login?shared=1', {
      credentials: 'include'
    })
    .then(resp => resp.json())
    .then(json => this.setLoginRole(json.login, json.role, json.hash));
  }

  @observable StudentListReload = 0;

  @computed get studentListP(): IPromiseBasedObservable<string[]> {
    return fromPromise(new Promise((resolve, reject) => {
      window.fetch(`/api/db/students?teacher=${encodeURIComponent(this.login)}&reload=${this.StudentListReload}`)
        .then(res => {
          if (res.ok) {
            res.json().then(obj => resolve(obj.students as string[])).catch(reject);
          } else {
            reject(res);
          }
        })
        .catch(reject);
    })) as IPromiseBasedObservable<string[]>;
  }    
  @computed get studentList(): string[] {
    return this.studentListP.case({
      fulfilled: (v) => v,
      pending: () => [],
      rejected: (e) => []
    });
  }
  @action addStudent(studentid: string) {
    if (studentid.length > 0) {
      window.fetch(`/api/db/students`, {
        method: 'POST',
        body: JSON.stringify({teacher: this.login, student: studentid}),
        headers: { 'Content-Type': 'application/json' }
      });
      this.StudentListReload += 1;
    }
  }

  log(state: LogRecord) {
    window.fetch('/api/db/log', {
      method: 'POST',
      body: JSON.stringify(state),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  fetchBook(id: string) {
    return fromPromise(
      new Promise((resolve, reject) => {
        window.fetch(`/api/db/books/${id}`)
          .then(res => {
            if (res.ok) {
              res.json().then(obj => resolve(SharedBookValidator.check(obj))).catch(reject);
            } else {
              reject(res);
            }
          })
          .catch(reject);
      })) as IPromiseBasedObservable<SharedBook>;
  }

  fetchBookList(teacher: string) {
    return fromPromise(new Promise((resolve, reject) => {
      window.fetch(`/api/db/books?teacher=${encodeURIComponent(teacher)}`)
        .then(res => {
          if (res.ok) {
            res.json().then(obj => resolve(SharedBookListValidator.check(obj))).catch(reject);
          } else {
            reject(res);
          }
        })
        .catch(reject);
    })) as IPromiseBasedObservable<SharedBookList>;
  }

}
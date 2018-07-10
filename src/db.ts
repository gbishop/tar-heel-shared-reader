import { Number, String, Array, Record, Static, Runtype } from 'runtypes';
import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';

export const THRURL = 'https://gbserver3.cs.unc.edu/';
// export const THRURL = 'https://tarheelreader.org/';

export const LevelNames = [
  'K-2',
  '3rd Grade',
  '4th Grade',
  '5th Grade',
  '6th Grade',
  '7th Grade',
  '8th Grade',
  '9-10th Grade',
  '11-12th Grade'
];

export interface LogRecord {
  teacher: string;
  student: string;
  bookid: string;
  reading: number;
  page: number;
  response?: string;
}

// construct the validator for shared books
const Page = Record({
  text: String,
  url: String,
  width: Number,
  height: Number,
});

const SharedBookValidator = Record({
  title: String,
  slug: String,
  status: String,
  level: String,
  author: String,
  owner: String,
  pages: Array(Page),
  comments: Array(Array(String))
});

const SharedBookListItemValidator = Record({
  title: String,
  author: String,
  pages: Number,
  slug: String,
  level: String,
  image: String,
  status: String,
  owner: String
});

const SharedBookListValidator = 
  Array(SharedBookListItemValidator);

const SharedBookResponseValidator =
  Record({
    books: SharedBookListValidator,
    recent: SharedBookListValidator,
    yours: SharedBookListValidator
  });

const AuthValidator =
  Record({
    login: String,
    role: String,
    hash: String
  });

const CreateResponseValidator = Record({ slug: String });

// construct the typescript type
export type SharedBook = Static<typeof SharedBookValidator>;
export type SharedBookListItem = Static<typeof SharedBookListItemValidator>;
export type SharedBookList = Static<typeof SharedBookListValidator>;
export type SharedBookResponse = Static<typeof SharedBookResponseValidator>;
export type CreateResponse = Static<typeof CreateResponseValidator>;
export type Auth = Static<typeof AuthValidator>;

export class DB {
  @observable login: string = '';
  @observable role: string = '';
  token: string = '';
  @computed get isAdmin() {
    return this.role === 'admin';
  }
  @computed get canWrite() {
    return this.role === 'admin' || this.role === 'author';
  }
  @computed get authentication() {
    return `MYAUTH user:"${this.login}", role:"${this.role}", token:"${this.token}"`;
  }

  @action.bound setLoginRole(login: string, role: string, token: string) {
    this.login = login;
    this.role = role;
    this.token = token;
  }

  @computed get authP(): IPromiseBasedObservable<Auth> {
    return fromPromise(new Promise((resolve, reject) => {
      window.fetch(THRURL + 'login/?shared=1', {
        credentials: 'include'
      })
        .then(res => {
          if (res.ok) {
            res.json().then(obj => resolve(obj));
          } else {
            reject(res);
          }
        })
        .catch(reject);
    }))
  }

  @observable StudentListReload = 0;

  @computed get studentListP(): IPromiseBasedObservable<string[]> {
    return fromPromise(new Promise((resolve, reject) => {
      const url = `/api/db/students?reload=${this.StudentListReload}`
      window.fetch(url, {headers: {Authentication: this.authentication}})
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
        headers: {
          'Content-Type': 'application/json',
          'Authentication': this.authentication
        }
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

  fetchJson<T>(url: string, init: RequestInit, validator: Runtype<T>): IPromiseBasedObservable<T> {
    return fromPromise(fetch(url, init)
      .then((resp) => {
        console.log('resp', resp);
        if (!resp.ok) {
          return Promise.reject(new Error(resp.statusText));
        }
        return resp.json();})
      .then(data => validator.check(data))
    );
  }

  fetchBook(id: string) {
    return this.fetchJson(`/api/db/books/${id}`, {}, SharedBookValidator);
  }

  fetchBookList(teacher: string) {
    return this.fetchJson(`/api/db/books?teacher=${encodeURIComponent(teacher)}`,
      { headers: {Authentication: this.authentication}}, SharedBookResponseValidator);
  }

    /*
  fetchBookList(teacher: string) {
    return fromPromise(new Promise((resolve, reject) => {
      window.fetch(`/api/db/books?teacher=${encodeURIComponent(teacher)}`,
          { headers: {Authentication: this.authentication}})
        .then(res => {
          if (res.ok) {
            res.json().then(obj => resolve(SharedBookResponseValidator.check(obj))).catch(reject);
          } else {
            reject(res);
          }
        })
        .catch(reject);
    })) as IPromiseBasedObservable<SharedBookResponse>;
  }
     */

  createNewBook(slug: string) {
    return this.fetchJson('/api/db/books', {
      method: 'post',
      body: JSON.stringify({slug}),
      headers: {
        Authentication: this.authentication,
        'Content-type': 'application/json; charset=utf-8'
      }},
      CreateResponseValidator);
  }
    /*
  createNewBook(slug: string) {
    return new Promise((resolve, reject) => {
      window.fetch('/api/db/books', {
        method: 'post',
        body: JSON.stringify({slug}),
        headers: {
          Authentication: this.authentication,
          'Content-type': 'application/json; charset=utf-8'}}
      ).then(res => {
        if (res.ok) {
          res.json().then(obj => resolve(CreateResponseValidator.check(obj).slug)).catch(reject);
        } else {
          reject(res);
        }
      }).catch(reject);
    });
  }
     */

}

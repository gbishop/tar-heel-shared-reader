import { Number, String, Array, Record, Static } from 'runtypes';
import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';

export const THRURL = 'https://gbserver3.cs.unc.edu/';
// export const THRURL = 'https://tarheelreader.org/';

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
  comments: Array(String)
});

const SharedBookValidator = Record({
  title: String,
  slug: String,
  status: String,
  level: String,
  author: String,
  owner: String,
  pages: Array(Page)
});

const SharedBookListItemValidator = Record({
    title: String,
    author: String,
    pages: Number,
    slug: String,
    level: String,
    image: String
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

// construct the typescript type
export type SharedBook = Static<typeof SharedBookValidator>;
export type SharedBookListItem = Static<typeof SharedBookListItemValidator>;
export type SharedBookList = Static<typeof SharedBookListValidator>;
export type SharedBookResponse = Static<typeof SharedBookResponseValidator>;
export type Auth = Static<typeof AuthValidator>;

export class DB {
  @observable login: string = '';
  @observable role: string = '';
  token: string = '';
  @computed get isAdmin() {
    return this.role === 'admin';
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

  fetchBook(id: string) {
    return fromPromise(
      new Promise((resolve, reject) => {
        console.log(`id "${id}"`);
        if (id.length === 0) {
          reject();
          return;
        }
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
            res.json().then(obj => resolve(SharedBookResponseValidator.check(obj))).catch(reject);
          } else {
            reject(res);
          }
        })
        .catch(reject);
    })) as IPromiseBasedObservable<SharedBookResponse>;
  }

}

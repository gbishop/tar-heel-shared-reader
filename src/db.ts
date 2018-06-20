import { observable, computed, action } from 'mobx';
import { fromPromise, IPromiseBasedObservable } from 'mobx-utils';

export const THRURL = 'https://gbserver3.cs.unc.edu/';

export interface LogRecord {
  teacher: string;
  student: string;
  book: string;
  reading: number;
  page: number;
  response?: string;
}

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
}
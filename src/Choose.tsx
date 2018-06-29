import * as React from 'react';
import { observer } from 'mobx-react';
import Store from './Store';
import { observable, action } from 'mobx';
import { THRURL, SharedBookList } from './db';
import './Choose.css';

const LevelNames = [
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

@observer
class Choose extends React.Component<{store: Store}, {}> {
  @observable newstudent = '';
  @action updateNewStudent(s: string) {
    this.newstudent = s;
  }
  @observable newgroup = '';
  @action updateNewGroup(s: string) {
    this.newgroup = s;
  }
  @action addStudent(s: string) {
    this.props.store.db.addStudent(s);
    this.props.store.studentid = s;
  }
  render() {
    const store = this.props.store;
    function BookList(sharedBookList: SharedBookList, levelNames: string[]) {
      return sharedBookList.length === 0 ? null : (
        <div style={{textAlign: 'center'}}>
          {levelNames.map(level => (
            <div key={level}>
              <button
                className="LevelButton"
                onClick={() => store.bookListToggle(level)}
              >
                {level}
              </button>
              {
                (store.bookListOpen.get(level)) ? (
                  <ul className="Find-Results">
                    {sharedBookList
                      .filter(item => item.level === level || level === 'Recent')
                      .sort((a, b) => a.title.localeCompare(b.title))
                      .map(item => (
                        <li key={item.slug}>
                          <button className="Find-ReadButton" onClick={() => store.setBookid(item.slug)}>
                            <img src={THRURL + item.image} />
                          </button>
                          <h1>{item.title}</h1>
                          <p className="Find-Author">{item.author}</p>
                        </li>
                      ))
                    }
                  </ul>) : null
              }
            </div>
          ))}
        </div>
      );
    }
    return (
      <div id="StudentList">
        <h2>Select a student or group</h2>
        <label><b>{store.teacherid}</b> is reading with:&nbsp;
          <select value={store.studentid} onChange={(e) => store.setstudentid(e.target.value)}>
            <option value="">none selected</option>
            {store.db.studentList.map(id => (<option key={id} value={id}>{id}</option>))}
          </select>
        </label><br/>
        <label>Add a student:&nbsp;
          <input
            type="text"
            value={this.newstudent}
            onChange={(e) => this.updateNewStudent(e.target.value)}
            placeholder="Enter student initials"
          />
        </label>
        <button
          onClick={()=>{this.addStudent(this.newstudent); this.updateNewStudent('');}}
        >+</button><br/>
        <label>Add a group:&nbsp;
          <input
            type="text"
            value={this.newgroup}
            onChange={(e) => this.updateNewGroup(e.target.value)}
            placeholder="Enter group name"
          />
        </label>
        <button
          onClick={()=>{this.addStudent('Group: ' + this.newgroup); this.updateNewGroup('')}}
        >+</button><br/>
        {!store.studentid ? null : store.teacherBookListP.case({
          pending: () => (<p>Recent books loading</p>),
          rejected: () => (<p>Recent books failed</p>),
          fulfilled: recentBooksList => (
            <div>
              {BookList(recentBooksList.recent, ['Recent'])}
              {BookList(recentBooksList.yours, ['Your Books'])}
            </div>
          )})
        }
        {!store.studentid ? null : store.sharedBookListP.case({
          pending: () => (<p>Wait for it...</p>),
          rejected: (e) => {console.log('e', e); return (<p>Something went wrong</p>)},
          fulfilled: sharedBookList => 
            BookList(sharedBookList.books, LevelNames)
          })
        }
      </div>
    );
  }

}

export default Choose;

import * as React from 'react';
import { observer } from 'mobx-react';
import Store from './Store';
import { observable, action } from 'mobx';

@observer
class StudentList extends React.Component<{store: Store}, {}> {
  @observable newstudent = '';
  @action updateNewStudent(s: string) {
    this.newstudent = s;
  }
  @action addStudent(s: string) {
    this.props.store.db.addStudent(s);
    this.props.store.studentid = s;
    console.log('store', this.props.store);
  }
  render() {
    const store = this.props.store;
    return (
      <div>
        <label>Student:
          <select value={store.studentid} onChange={(e) => store.setstudentid(e.target.value)}>
            <option value="">Select a student</option>
            {store.db.studentList.map(id => (<option key={id} value={id}>{id}</option>))}
          </select>
        </label>
        <label>Add student:
          <input type="text" value={this.newstudent} onChange={(e) => this.updateNewStudent(e.target.value)} />
        </label>
        <button onClick={() => this.addStudent(this.newstudent)}>+</button>
      </div>
    );
  }
}

export default StudentList;

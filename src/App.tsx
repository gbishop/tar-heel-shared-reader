import * as React from 'react';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import './App.css';
import Store from './Store';
import Reader from './Reader';
import StudentList from './StudentList';

@observer
class App extends React.Component<{store: Store}, {}> {
  render() {
    const {store} = this.props;
    if (store.teacherid.length === 0) {
      return <div>You need to login</div>;

    } else if (store.studentid.length === 0 || store.bookid.length === 0) {
      return (
        <StudentList store={store} />
      );

    } else if (store.bookP.state === 'pending') {
      return <h1>Loading</h1>;

    } else if (store.bookP.state === 'rejected') {
      console.log('store', store);
      return (
        <p>Something went wrong</p>
      );

    } else {
      return (
        <div>
          <Reader store={store} />
          <DevTools />
        </div>
      );
    }
  }
}

export default App;
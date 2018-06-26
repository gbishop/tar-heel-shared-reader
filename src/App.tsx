import * as React from 'react';
import { observer } from 'mobx-react';
import './App.css';
import Store from './Store';
import Reader from './Reader';
import Choose from './Choose';
import { THRURL } from './db';

@observer
class App extends React.Component<{store: Store}, {}> {
  public render() {
    const {store} = this.props;
    return store.db.authP.case({
      pending: () => <p>Checking your login credentials</p>,
      rejected: () => <p>Something went wrong checking your login credentials</p>,
      fulfilled: (auth) => {
        store.db.setLoginRole(auth.login, auth.role, auth.hash);

        if (store.teacherid.length === 0) {
          return (
            <div>
              <p>Please login to Tar Heel Reader below and then click
                <button onClick={()=>window.location.reload(true)}>here</button>
              </p>
              <iframe
                /* THR needs remove_action('login_init', 'send_frame_options_header'); */
                src={`${THRURL}/login`}
                width="500"
                height="550"
              />
            </div>
          );

        } else if (store.db.role.length === 0) {
          return (<p>Contact Karen to get registered for the study</p>);

        } else if (store.studentid.length === 0 || store.bookid.length === 0) {
          return (
            <Choose store={store} />
          );

        } else {
          return (
            <Reader store={store} />
          );
        }
      }
    });
  }
}

export default App;
import * as React from 'react';
import { observer } from 'mobx-react';
import DevTools from 'mobx-react-devtools';
import './App.css';
import Store from './Store';
import Reader from './Reader';

@observer
class App extends React.Component<{store: Store}, void> {
  render() {
    const {store} = this.props;
    if (store.bookid.length === 0) {
      return <h1>Landing Page</h1>;

    } else if (store.bookP.state === 'pending') {
      return <h1>Loading</h1>;

    } else if (store.bookP.state === 'rejected') {
      console.log('store', store);
      return (
        <div>
          <ErrorMsg error={store.bookP.reason} />
          <p> /1 is the only functioning url right now</p>
        </div>
      );

    } else {
      return (
        <div className="App">
          <Reader store={store} />
          <DevTools />
        </div>
      );
    }
  }
}

const ErrorMsg = observer((props: { error: Response|Error }) => {
  const error = props.error;
  if (error instanceof Response) {
    return <h1>{'Error: ' + error.status + '/' + error.statusText}</h1>;
  } else if (error instanceof Error) {
    return <h1>{'Error: ' + error.message}</h1>;
  } else {
    return <h1>Unknown Error</h1>;
  }
});

export default App;

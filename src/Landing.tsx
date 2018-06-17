import * as React from 'react';
import Store from './Store';
import { observer } from 'mobx-react';
import './Landing.css';

interface LandingProps {
  store: Store;
}

@observer
export default class Landing extends React.Component <LandingProps, {}> {
  render () {
    let store = this.props.store;
    if (store.teacherid.length === 0) {
      return (<div>You need to login to Tar Heel Reader</div>);
    } else {
        return (
          <div className="landing-outer-div">
            <div className="landing-inner-div">
              <h1 style={{color: '#a35167', fontSize: '30px'}}>Tar Heel Shared Reader</h1>
            </div>
          </div>
        );
    }
  }
}

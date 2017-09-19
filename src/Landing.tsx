import * as React from 'react';
import * as firebase from 'firebase';
import Store from './Store';
import BookSelection from './BookSelection';
import ClassRoll from './ClassRoll';
import { observer } from 'mobx-react';
import './Landing.css';

interface LandingProps {
    store: Store;
}

interface LandingState {}

@observer
export default class Landing extends React.Component <LandingProps, LandingState> {
    constructor () {
        super();

        this.handleInput = this.handleInput.bind(this);
        this.validate = this.validate.bind(this);
    }

    componentDidMount() {
        const self = this;

        firebase.auth().onAuthStateChanged(function(user: firebase.User) {
            if (user) {
                if (self.props.store.mode !== 2) {
                    // Set the firebase teacherid in store
                    self.props.store.setteacherid(user.uid);
                    // If the user is already logged on, 
                    // then go straight to ClassRoll
                    firebase.database().ref('users/admin/' + user.uid + '/active').
                    once('value', function (snapshot: firebase.database.DataSnapshot) {
                        let active = snapshot.val();
                        if (active) {
                            self.props.store.setIsSignedIn(true);
                            self.props.store.setmode(1);
                        } else {
                            self.props.store.
                            setMessage('Email is not verified. Please contact Dr. Erickson for assistance.');
                        }
                    }).catch(function(error: Error) {
                        console.log(error);
                    });
                }
            }
        });
    }

    handleInput = (e) => {
        e.preventDefault();
        let name = e.target.name;
        this.setState({[name]: e.target.value});
    }

    validate(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        const self = this;

        // If user is already signed in or is in process of
        // doing so, don't redirect 
        if (this.props.store.isSignedIn || this.props.store.isSigningIn) {
            return;
        }

        // The user is in the process of signing in 
        self.props.store.setIsSigningIn(true);

        // Sign in to Google
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result: firebase.auth.UserCredential) {
            // Make sure Firebase is not null during log in process 
            if (result !== null) {
                if (result.user !== null && result.user) {
                    if (result.user.uid !== null && result.user.email !== null) {
                        // set the teacherID in store
                        self.props.store.setteacherid(result.user.uid);
                        // set the user's email in store
                        self.props.store.setemail(result.user.email);
                    }
                }
            }

            // Check if user has active flag, grant access 
            let active: boolean = false;
            firebase.database().ref('users/admin/' + self.props.store.teacherid + '/active').
            once('value', function(snapshot: firebase.database.DataSnapshot) {
                active = snapshot.val();
            }).then(function() {
                // The user is active. Grant access. 
                if (active) {
                    self.props.store.setmode(1);
                    self.props.store.setIsSignedIn(true);
                } else {
                    // Run activation script
                    fetch('http://localhost:8080/activate', {
                        method: 'POST',
                        headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            teacherID: self.props.store.teacherid,
                            email: self.props.store.email
                        })
                    }).then((response) => response.json()).then((responseJson) => {
                        // The user is now registered. Grant access.
                        console.log('response', responseJson);
                        if (responseJson.active) {
                            self.props.store.setmode(1);
                            self.props.store.setIsSignedIn(true);
                        // The user is not registered. Do not grant access. 
                        } else {
                            self.props.store.
                            setMessage('Email is not verified. Please contact Dr. Erickson for assistance.');
                        }
                    }).catch((error) => {
                        console.log(error);
                    });
                }
            });
        }).catch(function(error: Error) {
            console.log(error.message);
        }).then(function() {
            // The user is no longer signing in
            self.props.store.setIsSigningIn(false);
        });
    }

    render () {
        // Sign in page
        if (this.props.store.mode === 0) {
            return (
                <div className="landing-outer-div">
                <div className="landing-inner-div">
                    <h1 style={{color: '#a35167', fontSize: '30px'}}>Tar Heel Shared Reader</h1>
                    <div className="landing-innermost-div">
                        {this.props.store.message}
                    </div>
                    <br/>
                    &nbsp;
                    <button className="nested-register-button" type="button" onClick={this.validate}>Sign In
                    </button>
                </div>
            </div>
            );
        // Class page 
        } else if (this.props.store.mode === 1) {
            return <ClassRoll store={this.props.store} />;
        // Books page
        } else  {
            return <BookSelection store={this.props.store}/>;
        }
    }
}
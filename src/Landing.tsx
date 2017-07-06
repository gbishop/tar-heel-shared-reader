import * as React from 'react';
import * as firebase from 'firebase';

interface LandingProps {

}

interface LandingState {
    message: string;
    innermostDivStyle: any;
    innerDivStyle: any;
    outerDivStyle: any;
    inputStyle: any;
    email: string;
    register: string;
    mode: number;
}

class Landing extends React.Component <LandingProps, LandingState> {
    constructor () {
        super();
        this.state = {
            message: 'Welcome to Tar Heel Shared Reader! Please enter your email address to continue. Then, login using your Google account.',
            outerDivStyle: {
                position: 'absolute',
                display: 'inline-flex',
                height: '500px',
                width: '500px',
                borderRadius: '25px',
                left: '50%',
                top: '50%',
                marginLeft: '-250px',
                marginTop: '-250px',
                background: 'linear-gradient(#a35167, #91455a)'
            },
            innerDivStyle: {
                position: 'relative',
                margin: 'auto 0',
                width: '500px',
                textAlign: 'center'
            },
            innermostDivStyle: {
                backgroundColor: 'white',
                padding: '10px',
                background: 'linear-gradient(white, #e0dede)',
                color: '#192231',
                fontSize: "12px"
            },
            inputStyle: {
                width: '200px'
            },
            email: '',
            register: '',
            mode: 1 /* Default 0 */
        };

        this.handleInput = this.handleInput.bind(this);
        this.validate = this.validate.bind(this);
        this.addEmail = this.addEmail.bind(this);
    }

    componentWillMount() {
        var config = {
            apiKey: 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
            authDomain: 'tarheelsharedreader-9f793.firebaseapp.com',
            databaseURL: 'https://tarheelsharedreader-9f793.firebaseio.com',
            projectId: 'tarheelsharedreader-9f793',
            storageBucket: 'tarheelsharedreader-9f793.appspot.com',
            messagingSenderId: '686575466062'
        };
        firebase.initializeApp(config);

        firebase.auth().onAuthStateChanged(function(user: any) {
            if (user) {

            } else {

            }
        })
    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({[e.target.name]: e.target.value});
    }

    validate(e: any) {
        const self = this;
        e.preventDefault();
        var tempBool = false;
        firebase.database().ref('/registeredEmails').once('value', function(snapshot) {
            snapshot.forEach(function(childSnapshot) {
                if (self.state.email === childSnapshot.child('email').val()) {
                    self.googleSignIn();
                    tempBool = true;
                }
                return false;
            });
        }).catch(function(error) {
            console.log(error.message);
        }).then(function() {
            if (tempBool === false) {
                self.setState({message: "Email does not exist in database. Please contact the web master for assistance."});
            }
        });
    }

    googleSignIn() {
        const self = this;
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result: any) {
            self.setState({message: 'Welcome, ' + result.user.email + ". Please wait while we redirect you..."});
            setTimeout(function() {
                self.setState({mode: 1});
            }, 5000);
        }).catch(function(error: any) {
            self.setState({message: error.message});
        });
    }

    addEmail(e: any) {
        const self = this;
        e.preventDefault();
        var newRef = firebase.database().ref('/registeredEmails').push();
        newRef.set({
            email: self.state.register
        });

    }

    render () {
        if (this.state.mode === 0) {
            return (
                <div style={this.state.outerDivStyle}>
                    <div style={this.state.innerDivStyle}>
                        <h3 style={{color: '#242d3d', fontSize: '30px'}}>Tar Heel Shared Reader</h3>
                        <div style={this.state.innermostDivStyle}>
                            {this.state.message}
                        </div>
                        <br/>
                        &nbsp;
                        <input style={{position: 'relative', width: '200px', left: '1px'}} type="text" name="register" placeholder="register" value={this.state.register} onChange={this.handleInput}/>
                        &nbsp;
                        <button type="button" onClick={this.addEmail}>Register</button> <br/>
                        <input style={this.state.inputStyle} type="text" name="email" placeholder="email" value={this.state.email} onChange={this.handleInput}/>
                        &nbsp;
                        <button type="button" onClick={this.validate}>Validate</button>
                    </div>
                </div>
            );
        }
        return <ClassRoll/>;
    }
}

interface ClassRollProps {

}

interface ClassRollState {
    outerDivStyle: any;
}

class ClassRoll extends React.Component<ClassRollProps, ClassRollState> {
    constructor() {
        super();

        this.state = {
            outerDivStyle: {
                position: "absolute",
                width: "750px",
                height: "600px",
                background: "linear-gradient(white, #8e8e8e)",
                display: "inline-flex",
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: "25px"
            }
        };
    }

    render() {
        return (
            <div style={this.state.outerDivStyle}>
                <table className="student-table">
                    <tr>
                        <th>Student ID</th>
                        <th>Student First Name</th>
                        <th>Student Last Name</th>
                    </tr>
                    <tr>
                        <td>Apple</td>
                        <td>banana</td>
                        <td>Cheese</td>
                    </tr>
                    <tr>
                        <td>Cheese</td>
                        <td>Watermelon</td>
                        <td>Cheese</td>
                    </tr>
                </table>
            </div>
        );
    }
}

export default Landing;
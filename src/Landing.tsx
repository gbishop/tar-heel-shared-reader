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
            mode: 0 /* Default 0 */
        };

        this.handleInput = this.handleInput.bind(this);
        this.validate = this.validate.bind(this);
        this.addEmail = this.addEmail.bind(this);
    }

    componentWillMount() {
        var config = {
            apiKey: "AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc",
            authDomain: "tarheelsharedreader-9f793.firebaseapp.com",
            databaseURL: "https://tarheelsharedreader-9f793.firebaseio.com",
            projectId: "tarheelsharedreader-9f793",
            storageBucket: "tarheelsharedreader-9f793.appspot.com",
            messagingSenderId: "686575466062"
        };
        firebase.initializeApp(config);
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
        firebase.auth().signInWithPopup(provider).then(function(result) {
            self.setState({message: 'Welcome, ' + result.user.email + ". Please wait while we redirect you..."});
            setTimeout(function() {
                self.setState({mode: 1});
            }, 3000);
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
                        <h3 style={{color: 'snow', fontSize: '30px'}}>Tar Heel Shared Reader</h3>
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
    firstName: string;
    lastName: string;
    registerStudentStyle: any;
    isRegisterHidden: boolean;
    tableCellsArray: any[];
}

class ClassRoll extends React.Component<ClassRollProps, ClassRollState> {
    constructor() {
        super();
        this.state = {
            outerDivStyle: {
                fontFamily: "Didot",
                position: "absolute",
                width: "750px",
                height: "600px",
                background: "linear-gradient(white, #8e8e8e)",
                display: "inline-flex",
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: "25px",
                userSelect: "none"
            },
            registerStudentStyle: {
                fontFamily: "Didot",
                position: 'fixed',
                width: '500px',
                height: '55px',
                background: 'linear-gradient(transparent, transparent)',
                marginLeft: '-250px',
                marginTop: '-27.5px',
                left: '50%',
                top: '50%',
                zIndex: "1",
                borderRadius: '5px',
                color: 'black',
                textAlign: 'center',
                border: '1px solid black',
                padding: '10px'
            },
            firstName: '',
            lastName: '',
            isRegisterHidden: true,
            tableCellsArray: []
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.checkSelection = this.checkSelection.bind(this);
    }

    componentWillMount() {
        const self = this;
        var tempArray: any[] = [];
        setTimeout(function() {
            let uid = self.getUserID();
            let ref = firebase.database().ref('/users/' + uid + '/students');
            ref.once('value', function(snapshot: any) {
                snapshot.forEach(function(childSnapshot: any) {
                    let student =
                        <tr key={childSnapshot.key}>
                            <td>{childSnapshot.key}</td>
                            <td>{childSnapshot.child('firstName').val()}</td>
                            <td>{childSnapshot.child('lastName').val()}</td>
                        </tr>;
                    tempArray.push(student);
                    return false;
                });
            }).then(function() {
                self.setState({tableCellsArray: tempArray});
            });

            // Listeners
            var studentsRef = firebase.database().ref('/users/' + uid + '/students');
            studentsRef.on('child_added', function (data: any | null | undefined) {
                let student =
                    <tr key={data.key}>
                        <td>{data.key}</td>
                        <td>{data.child('firstName').val()}</td>
                        <td>{data.child('lastName').val()}</td>
                    </tr>;
                var newArr = self.state.tableCellsArray.slice();
                newArr.push(student);
                self.setState({tableCellsArray: newArr});
            });
        }, 350);
    }

    getUserID() {
        let auth: any | null | undefined;
        auth = firebase.auth();
        let currentUser: any | null | undefined;
        currentUser = auth.currentUser;
        let uid: any | null | undefined;
        uid = currentUser.uid;
        return uid;
    }

    handleBlur(e: any) {
        e.preventDefault();
        this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        this.setState({
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
                borderRadius: '25px',
                userSelect: 'none',
                filter: (this.state.outerDivStyle.filter === 'blur(5px)') ? 'blur(0px)' : 'blur(5px)'
            }
        });
    }

    closeWindow() {
        this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        this.setState({
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
                borderRadius: '25px',
                userSelect: 'none',
                filter: (this.state.outerDivStyle.filter === 'blur(5px)') ? 'blur(0px)' : 'blur(5px)'
            }
        });
    }

    addStudent(e: any) {
        const self = this;
        e.preventDefault();
        let auth: any | null | undefined;
        auth = firebase.auth();
        let currentUser: any | null | undefined;
        currentUser = auth.currentUser;
        let uid: any | null | undefined;
        uid = currentUser.uid;
        var oldRef = firebase.database().ref('/users/' + uid + '/students');
        var newRef = oldRef.push();
        newRef.set({
            firstName: self.state.firstName,
            lastName: self.state.lastName
        }).catch(function(error) {
            console.log(error.message);
        }).then(function() {
            self.setState({firstName: '', lastName: ''});
            self.closeWindow();
        })
    }

    removeStudent(e: any) {

    }

    updateStudent(e: any) {

    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({[e.target.name]: e.target.value});
    }

    checkSelection(e: any) {
        e.preventDefault();
        // TODO
        e.target.parentElement.style.backgroundColor = "white";
    }

    render() {
        return (
            <div>
                <div style={this.state.outerDivStyle}>
                    <table className="register-button">
                        <tr>
                            <td><button className="student-button add-student" type="text" onClick={this.handleBlur}>Add Student</button></td>
                            <td><button className="student-button remove-student" type="text" onClick={this.removeStudent}>Remove Student</button></td>
                            <td><button className="student-button update-student" type="text" onClick={this.updateStudent}>Update Student</button></td>
                        </tr>
                    </table>
                    <table className="student-table" onClick={this.checkSelection}>
                        <tr>
                            <th>Student ID</th>
                            <th>Student First Name</th>
                            <th>Student Last Name</th>
                        </tr>
                        {this.state.tableCellsArray}
                    </table>
                </div>
                <div style={this.state.registerStudentStyle} hidden={this.state.isRegisterHidden}>
                    First Name: <input type="text" name="firstName" value={this.state.firstName}
                                       onChange={this.handleInput} placeholder="First Name"/>
                    &nbsp;
                    Last Name: <input type="text" name="lastName" value={this.state.lastName}
                                      onChange={this.handleInput} placeholder="Last Name"/><br/><br/>
                    <button type="button" onClick={this.addStudent}>Add Student</button>
                    &nbsp;
                    <button type="button" onClick={this.handleBlur}>Close</button>
                </div>
            </div>
        );
    }
}

export default Landing;
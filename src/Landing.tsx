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
            message: 'Welcome to Tar Heel Shared Reader! Please enter your email address to continue. ' +
            'Then, login using your Google account.',
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
                fontSize: '12px'
            },
            inputStyle: {
                width: '200px'
            },
            email: '',
            register: '',
            mode: 2 /* Default 0 */
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
    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({[e.target.name]: e.target.value});
    }

    validate(e: any) {
        const self = this;
        e.preventDefault();
        var tempBool = false;
        firebase.database().ref('/registeredEmails').once('value', function(snapshot: any) {
            snapshot.forEach(function(childSnapshot: any) {
                if (self.state.email === childSnapshot.child('email').val()) {
                    self.googleSignIn();
                    tempBool = true;
                }
                return false;
            });
        }).catch(function(error: any) {
            console.log(error.message);
        }).then(function() {
            if (tempBool === false) {
                self.setState({message: 'Email does not exist in database. ' +
                'Please contact the web master for assistance.'});
            }
        });
    }

    googleSignIn() {
        const self = this;
        var provider = new firebase.auth.GoogleAuthProvider();
        firebase.auth().signInWithPopup(provider).then(function(result: any) {
            self.setState({message: 'Welcome, ' + result.user.email + '. Please wait while we redirect you...'});
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
                        <input style={{position: 'relative', width: '200px', left: '1px'}} type="text" name="register"
                               placeholder="register" value={this.state.register} onChange={this.handleInput}/>
                        &nbsp;
                        <button type="button" onClick={this.addEmail}>Register</button> <br/>
                        <input style={this.state.inputStyle} type="text" name="email" placeholder="email"
                               value={this.state.email} onChange={this.handleInput}/>
                        &nbsp;
                        <button type="button" onClick={this.validate}>Validate</button>
                    </div>
                </div>
            );
        } else if (this.state.mode === 1) {
            return <ClassRoll/>;
        } else {
            return <BookSelection/>;
        }
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
    isUpdateHidden: boolean;
    isRemoveHidden: boolean;
    tableCellsArray: any[];
    checkedSelection: any;
    defaultFirstName: string;
    defaultLastName: string;
}

class ClassRoll extends React.Component<ClassRollProps, ClassRollState> {
    constructor() {
        super();
        this.state = {
            outerDivStyle: {
                fontFamily: 'Didot',
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                overflowY: 'auto',
                overflowX: 'hidden'
            },
            registerStudentStyle: {
                fontFamily: 'Didot',
                position: 'fixed',
                width: '500px',
                height: '55px',
                background: 'linear-gradient(transparent, transparent)',
                marginLeft: '-250px',
                marginTop: '-27.5px',
                left: '50%',
                top: '50%',
                zIndex: '1',
                borderRadius: '5px',
                color: 'black',
                textAlign: 'center',
                border: '1px solid black',
                padding: '10px'
            },
            firstName: '',
            lastName: '',
            isRegisterHidden: true,
            isUpdateHidden: true,
            isRemoveHidden: true,
            tableCellsArray: [],
            checkedSelection: '',
            defaultFirstName: '',
            defaultLastName: ''
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.checkSelection = this.checkSelection.bind(this);
        this.closeWindow = this.closeWindow.bind(this);
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

            // child_added listener
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

            // child_changed listener
            firebase.database().ref('/users/' + uid + '/students').on('child_changed', function(data: any | null | undefined) {
                let tempArr = self.state.tableCellsArray.slice();
                let ind: number = self.getRowIndex(data.key);
                let student =
                    <tr key={data.key}>
                        <td>{data.key}</td>
                        <td>{data.child('firstName').val()}</td>
                        <td>{data.child('lastName').val()}</td>
                    </tr>;
                tempArr.splice(ind, 1, student);
                self.setState({tableCellsArray: tempArr});
            });

            // child_removed listener
            firebase.database().ref('/users/' + uid + '/students').on('child_removed', function(data: any | null | undefined) {
                let tempArr = self.state.tableCellsArray.slice();
                let ind: number = self.getRowIndex(data.key);
                tempArr.splice(ind, 1);
                self.setState({tableCellsArray: tempArr});
            });
        }, 500);
    }

    getRowIndex(key: any) {
        let ind: number = 0;
        for (let i = 0; i < this.state.tableCellsArray.length; i++) {
            if (this.state.tableCellsArray[i].key === key) {
                ind = i;
                break;
            }
        }
        return ind;
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
        if (this.state.isRegisterHidden === false || this.state.isUpdateHidden === false ||
            this.state.isRemoveHidden === false) {
            return;
        }

        if (e.target.innerHTML === 'Add Student') {
            this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        } else if (e.target.innerHTML === 'Remove Student') {
            if (this.state.checkedSelection === '') {
                alert('Please select a student first.');
                return;
            }
            this.setState({isRemoveHidden: !this.state.isRemoveHidden});
        } else if (e.target.innerHTML === 'Update Student') {
            if (this.state.checkedSelection === '') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isUpdateHidden: !this.state.isUpdateHidden,
                defaultFirstName: this.state.checkedSelection.childNodes[1].innerHTML,
                defaultLastName: this.state.checkedSelection.childNodes[2].innerHTML
            });
        }
        this.setState({
            outerDivStyle: {
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                filter: (this.state.outerDivStyle.filter === 'blur(10px)') ? 'blur(0px)' : 'blur(10px)',
                overflowY: 'auto',
                overflowX: 'hidden'
            }
        });
    }

    closeWindow() {
        if (this.state.isRegisterHidden === false) {
            this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        } else if (this.state.isUpdateHidden === false) {
            this.setState({isUpdateHidden: !this.state.isUpdateHidden});
        } else if (this.state.isRemoveHidden === false) {
            this.setState({isRemoveHidden: !this.state.isRemoveHidden});
        }
        this.setState({
            outerDivStyle: {
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                filter: (this.state.outerDivStyle.filter === 'blur(10px)') ? 'blur(0px)' : 'blur(10px)',
                overflowY: 'auto',
                overflowX: 'hidden'
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
        }).catch(function(error: any) {
            console.log(error.message);
        }).then(function() {
            self.setState({firstName: '', lastName: ''});
            self.closeWindow();
        });
    }

    removeStudent(e: any) {
        const self = this;
        e.preventDefault();
        if (e.target.innerHTML === 'Yes') {
            let uid = this.getUserID();
            let key = this.state.checkedSelection.childNodes[0].innerHTML;
            firebase.database().ref('/users/' + uid + '/students/' + key).remove().then(function() {
                self.setState({checkedSelection: ''});
                self.closeWindow();
            });
        } else if (e.target.innerHTML === 'No') {
            self.closeWindow();
        }
    }

    updateStudent(e: any) {
        const self = this;
        e.preventDefault();
        let uid = this.getUserID();
        let key = this.state.checkedSelection.childNodes[0].innerHTML;
        let newData = {
            uid: uid,
            firstName: this.state.defaultFirstName,
            lastName: this.state.defaultLastName
        };
        firebase.database().ref('/users/' + uid + '/students/' + key).update(
            newData
        ).catch(function(error: any) {
            console.log(error.message);
        }).then(function() {
            self.setState({defaultFirstName: '', defaultLastName: ''});
            self.closeWindow();
        });
    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({[e.target.name]: e.target.value});
    }

    activate(e: any) {
        console.log('activate');
        if (this.state.checkedSelection === '') {
            alert('Please select a student first.');
        }
    }

    checkSelection(e: any) {
        e.preventDefault();
        if (e.target.parentElement.childNodes[0].tagName === 'TH' ||
            e.target.parentElement.tagName === 'TABLE') {
            return;
        }

        let originalTarget = this.state.checkedSelection;
        let newTarget = e.target.parentElement;

        if (originalTarget !== '' && newTarget !== originalTarget) {
            alert('Please deselect previous student first.');
            return;
        }

        if (e.target.parentElement.style.backgroundColor !== 'white') {
            e.target.parentElement.style.backgroundColor = 'white';
            this.setState({checkedSelection: e.target.parentElement});
        } else {
            e.target.parentElement.style.backgroundColor = 'transparent';
            this.setState({checkedSelection: ''});
        }
    }

    render() {
        return (
            <div>
                <div style={this.state.outerDivStyle}>
                    <table className="register-button">
                        <tr>
                            <td><button className="student-button add-student" type="text"
                                        onClick={this.handleBlur}>Add Student</button></td>
                            <td><button className="student-button remove-student" type="text"
                                        onClick={this.handleBlur}>Remove Student</button></td>
                            <td><button className="student-button update-student" type="text"
                                        onClick={this.handleBlur}>Update Student</button></td>
                            <td><button className="student-button update-student" type="text"
                                        onClick={this.activate}>Activate Student</button></td>
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
                    <button type="button" onClick={this.closeWindow}>Close</button>
                </div>
                <div style={this.state.registerStudentStyle} hidden={this.state.isUpdateHidden}>
                    First Name: <input type="text" name="defaultFirstName" value={this.state.defaultFirstName}
                                       onChange={this.handleInput}/>
                    &nbsp;
                    Last Name: <input type="text" name="defaultLastName" value={this.state.defaultLastName}
                                      onChange={this.handleInput}/><br/>
                    <button type="button" onClick={this.updateStudent}>Update Student</button>
                    &nbsp;
                    <button type="button" onClick={this.closeWindow}>Close</button>
                </div>
                <div style={this.state.registerStudentStyle} hidden={this.state.isRemoveHidden}>
                    Are you sure you would like to remove this student from the database?
                    <br/>
                    <button type="button" onClick={this.removeStudent}>Yes</button>
                    &nbsp;
                    <button type="button" onClick={this.removeStudent}>No</button>
                </div>
            </div>
        );
    }
}

interface BookSelectionProps {

}

interface BookSelectionState {
    outerDivStyle: Object;
    messageDivStyle: Object;
    isMessageHidden: boolean;
    bookArray: any[];
    checkedSelection: any;
    bookSelectionStyle: Object;
    isBookSelectionHidden: boolean;
}

class BookSelection extends React.Component<BookSelectionProps, BookSelectionState> {
    constructor() {
        super();

        this.state = {
            outerDivStyle: {
                fontFamily: 'Didot',
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                filter: 'blur(10px)'
            },
            messageDivStyle: {
                fontFamily: 'Didot',
                position: 'fixed',
                width: '500px',
                height: '40px',
                background: 'linear-gradient(transparent, transparent)',
                marginLeft: '-250px',
                marginTop: '-20px',
                left: '50%',
                top: '50%',
                zIndex: '1',
                borderRadius: '5px',
                color: 'black',
                textAlign: 'center',
                border: '1px solid black',
                padding: '10px'
            },
            bookSelectionStyle: {
                fontFamily: 'Didot',
                position: 'fixed',
                width: '500px',
                height: '40px',
                background: 'linear-gradient(transparent, transparent)',
                marginLeft: '-250px',
                marginTop: '-20px',
                left: '50%',
                top: '50%',
                zIndex: '1',
                borderRadius: '5px',
                color: 'black',
                textAlign: 'center',
                border: '1px solid black',
                padding: '10px'
            },
            isBookSelectionHidden: true,
            isMessageHidden: false,
            bookArray: [],
            checkedSelection: ''
        };

        this.removeMessage = this.removeMessage.bind(this);
        this.chooseBook = this.chooseBook.bind(this);
        this.openBookMenu = this.openBookMenu.bind(this);
        this.confirmBook = this.confirmBook.bind(this);
        this.closeBookMenu = this.closeBookMenu.bind(this);
    }

    removeMessage(e: any) {
        e.preventDefault();

        this.setState({
            isMessageHidden: true,
            outerDivStyle: {
                fontFamily: 'Didot',
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                filter: 'blur(0px)'
            }
        });
    }

    componentWillMount() {

    }

    chooseBook(e: any) {
        e.preventDefault();
        if (this.state.isBookSelectionHidden === false) {
            return;
        }
        if (e.target.className === 'book-table') {
            return;
        }
        if (this.state.checkedSelection !== '' && e.target !== this.state.checkedSelection) {
            alert('Please deselect previous book first.');
            return;
        }
        if (this.state.checkedSelection === '') {
            this.setState({checkedSelection: e.target});
        } else {
            this.setState({checkedSelection: ''});
        }
        if (e.target.style.background === 'linear-gradient(to left, white, rgb(188, 184, 184))') {
            e.target.style.background = 'linear-gradient(to left, transparent, transparent)';
        } else {
            e.target.style.background = 'linear-gradient(to left, white, rgb(188, 184, 184))';
        }
    }

    openBookMenu(e: any) {
        e.preventDefault();

        if (this.state.checkedSelection === '') {
            alert('Please select a book first.');
            return;
        }
        this.setState({isBookSelectionHidden: false});
        this.blur();
    }

    confirmBook(e: any) {
        e.preventDefault();
        this.closeBookMenu(null);
        this.state.checkedSelection.style.background = 'linear-gradient(to left, transparent, transparent)';
        this.setState({checkedSelection: ''});
        // TODO whatever needs to be done after selecting the book
    }

    closeBookMenu(e: any) {
        if (e !== null) {
            e.preventDefault();
        }
        this.setState({isBookSelectionHidden: true});
        this.unblur();
    }

    blur() {
        this.setState({
            outerDivStyle: {
                fontFamily: 'Didot',
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                filter: 'blur(10px)'
            }
        });
    }

    unblur() {
        this.setState({
            outerDivStyle: {
                fontFamily: 'Didot',
                position: 'absolute',
                width: '750px',
                height: '600px',
                background: 'linear-gradient(white, #8e8e8e)',
                display: 'inline-flex',
                left: '50%',
                top: '50%',
                marginLeft: '-375px',
                marginTop: '-300px',
                borderRadius: '25px',
                userSelect: 'none',
                overflowY: 'auto',
                overflowX: 'hidden',
                filter: 'blur(0px)'
            }
        });
    }

    render () {
        return (
            <div>
                <div style={this.state.messageDivStyle} hidden={this.state.isMessageHidden}>
                    Please select a book to continue. <br/>
                    <button type="button" onClick={this.removeMessage}>
                        Ok
                    </button>
                </div>
                <div style={this.state.outerDivStyle}>
                    <button className="book-selection" onClick={this.openBookMenu}>Choose</button>
                    <div className="book-table" onClick={this.chooseBook}>
                        <Book title="I Like Bugs"/>
                        <Book title="I Like Cheese"/>
                        <Book title="I Like Cheese"/>
                        <Book title="I Like Cheese"/>
                    </div>
                </div>
                <div style={this.state.bookSelectionStyle} hidden={this.state.isBookSelectionHidden}>
                    You haven chosen {"'" + this.state.checkedSelection.innerHTML + ".'"}
                    <br/>
                    <button type="button" onClick={this.confirmBook}>Confirm</button>
                    &nbsp;
                    <button type="button" onClick={this.closeBookMenu}>Cancel</button>
                </div>
            </div>
        );
    }
}

interface BookProps {
    title: string;
}

interface BookState {

}

class Book extends React.Component<BookProps, BookState> {
    constructor () {
        super();
    }

    render() {
        return (
            <div className="book">
                {this.props.title}
            </div>
        );
    }
}

export default Landing;
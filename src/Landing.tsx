import * as React from 'react';
import * as firebase from 'firebase';
import * as $ from 'jquery';

interface LandingProps {
    store: any;
}

interface LandingState {
    message: string;
    email: string;
    mode: number;
    register: string;
    isSigningIn: boolean;
    isSignedIn: boolean;
}

class Landing extends React.Component <LandingProps, LandingState> {
    constructor () {
        super();
        this.state = {
            message: 'Welcome! Please sign in to Google to continue.',
            email: '',
            mode: 0, /* Default 0 */
            register: '',
            isSigningIn: false,
            isSignedIn: false,
        };

        this.handleInput = this.handleInput.bind(this);
        this.validate = this.validate.bind(this);
        this.changeMode = this.changeMode.bind(this);
        this.googleSignOut = this.googleSignOut.bind(this);
    }

    componentWillMount() {
        const self = this;
        // var config = {
        //     apiKey: 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
        //     authDomain: 'tarheelsharedreader-9f793.firebaseapp.com',
        //     databaseURL: 'https://tarheelsharedreader-9f793.firebaseio.com',
        //     projectId: 'tarheelsharedreader-9f793',
        //     storageBucket: 'tarheelsharedreader-9f793.appspot.com',
        //     messagingSenderId: '686575466062'
        // };
        // firebase.initializeApp(config);

        firebase.auth().onAuthStateChanged(function(user: any) {
            if (user) {
                self.setState({email: user.email});
            } else {

            }
        });
    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({[e.target.name]: e.target.value});
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

    getUserEmail() {
        let auth: any | null | undefined;
        auth = firebase.auth();
        let currentUser: any | null | undefined;
        currentUser = auth.currentUser;
        let userEmail: any | null | undefined;
        userEmail = currentUser.email;
        return userEmail;
    }

    validate(e: any) {
        e.preventDefault();
        const self = this;

        if (this.state.isSigningIn || this.state.isSignedIn) {
            return;
        }

        self.setState({isSigningIn: true}, signIn);
        function signIn() {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function(result: any) {
                let firstRef = firebase.database().ref('/users/admin_data/').push();
                firstRef.set({
                    uid: self.getUserID(),
                    email: self.getUserEmail()
                }).catch(function(error) {
                    // User is already registered at admin_data
                    // console.log(error.message);
                }).then(function() {
                    let key = firstRef.key;
                    firebase.database().ref('/users/private_user/' + self.getUserID()).set({
                        uid: self.getUserID(),
                        email: self.getUserEmail(),
                        admin_data_key: key
                    }).catch(function(error) {
                        // User is already registered at private_user
                        // console.log(error.message);
                    }).then(function() {
                        firebase.database().ref('/users/admin/' + self.getUserID() + '/active').once('value', function(data) {
                            if (data.val() === true) {
                                self.setState({isSignedIn: true, mode: 1});
                            } else {
                                self.setState({message: 'Email is not verified. Please contact the web master for assistance.'});
                            }
                        });
                    });
                });
            }).catch(function(error: any) {
                console.log(error.message);
            }).then(function() {
                self.setState({isSigningIn: false});
            });
        }
    }

    googleSignOut(e: any) {
        e.preventDefault();
        firebase.auth().signOut().then(function() {
            console.log('Sign out successful');
        }).catch(function(error) {
            console.log(error.message);
        });
    }

    changeMode(mode: number) {
        this.setState({mode: mode});
    }

    render () {
        if (this.state.mode === 0) {
            return (
                <div className="landing-outer-div">
                    <div className="landing-inner-div">
                        <h1 style={{color: '#a35167', fontSize: '30px'}}>Tar Heel Shared Reader</h1>
                        <div className="landing-innermost-div">
                            {this.state.message}
                        </div>
                        <br/>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.validate}>Sign In</button><br/>
                        <button hidden={true} type="button" onClick={this.googleSignOut}>Sign Out</button><br/>
                    </div>
                </div>
            );
        } else if (this.state.mode === 1) {
            return <ClassRoll mode={this.changeMode} store={this.props.store}/>;
        } else {
            return <BookSelection mode={this.changeMode} store={this.props.store}/>;
        }
    }
}

interface ClassRollProps {
    mode: any;
    store: any;
}

interface ClassRollState {
    outerDivStyle: any;
    studentInitials: string;
    isRegisterHidden: boolean;
    isUpdateHidden: boolean;
    isRemoveHidden: boolean;
    tableCellsArray: any[];
    checkedSelection: any;
    defaultStudentInitials: string;
    registerMessage: string;
    updateMessage: string;
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
            isRegisterHidden: true,
            isUpdateHidden: true,
            isRemoveHidden: true,
            tableCellsArray: [],
            checkedSelection: '',
            studentInitials: '',
            defaultStudentInitials: '',
            registerMessage: 'Please enter student initials.',
            updateMessage: 'Please enter new student initials.'
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.checkSelection = this.checkSelection.bind(this);
        this.closeWindow = this.closeWindow.bind(this);
        this.activate = this.activate.bind(this);
    }

    componentWillMount() {
        const self = this;
        var tempArray: any[] = [];
        setTimeout(function() {
            let uid = self.getUserID();
            let ref = firebase.database().ref('/users/private_students/' + uid);
            ref.once('value', function(snapshot: any) {
                snapshot.forEach(function(childSnapshot: any) {
                    let student =
                        <tr key={childSnapshot.key}>
                            <td>{childSnapshot.child('studentInitials').val()}</td>
                            <td hidden={true}>{childSnapshot.key}</td>
                        </tr>;
                    tempArray.push(student);
                    return false;
                });
            }).then(function() {
                self.setState({tableCellsArray: tempArray});
            });

            // child_added listener
            var studentsRef = firebase.database().ref('/users/private_students/' + uid);
            studentsRef.on('child_added', function (data: any | null | undefined) {
                let student =
                    <tr key={data.key}>
                        <td>{data.child('studentInitials').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>;
                var newArr = self.state.tableCellsArray.slice();
                newArr.push(student);
                self.setState({tableCellsArray: newArr});
            });

            // child_changed listener
            firebase.database().ref('/users/private_students/' + uid).on('child_changed', function(data: any | null | undefined) {
                let tempArr = self.state.tableCellsArray.slice();
                let ind: number = self.getRowIndex(data.key);
                let student =
                    <tr key={data.key}>
                        <td>{data.child('studentInitials').val()}</td>
                        <td hidden={true}>{data.key}</td>
                    </tr>;
                tempArr.splice(ind, 1, student);
                self.setState({tableCellsArray: tempArr});
            });

            // child_removed listener
            firebase.database().ref('/users/private_students/' + uid).on('child_removed', function(data: any | null | undefined) {
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
            this.setState({
                isRemoveHidden: !this.state.isRemoveHidden,
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });
        } else if (e.target.innerHTML === 'Update Student') {
            if (this.state.checkedSelection === '') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isUpdateHidden: !this.state.isUpdateHidden,
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });
        } else if (e.target.innerHTML === 'Activate Student') {
            if (this.state.checkedSelection === '') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });

            this.activate(null);
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
            this.setState({
                isRegisterHidden: !this.state.isRegisterHidden,
                studentInitials: '',
                registerMessage: 'Please enter student initials.'
            });
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
        var oldRef = firebase.database().ref('/users/private_students/' + uid);
        var newRef = oldRef.push();
        var errorSet = false;
        newRef.set({
            studentInitials: self.state.studentInitials.toUpperCase()
        }).catch(function(error: any) {
            console.log(error.message);
            errorSet = true;
            self.setState({registerMessage: 'Student initials must be 3 characters long.'});
        }).then(function() {
            if (errorSet === false) {
                self.closeWindow();
            }
        });
    }

    removeStudent(e: any) {
        const self = this;
        e.preventDefault();
        if (e.target.innerHTML === 'Yes') {
            let uid = this.getUserID();
            let key = this.state.checkedSelection.childNodes[1].innerHTML;
            firebase.database().ref('/users/private_students/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedSelection: ''});
                self.closeWindow();
            });
        } else if (e.target.innerHTML === 'No') {
            self.closeWindow();
        }
    }

    updateStudent(e: any) {
        e.preventDefault();
        const self = this;
        let uid = this.getUserID();
        let key = this.state.checkedSelection.childNodes[1].innerHTML;
        firebase.database().ref('/users/private_students/' + uid + '/' + key).update({
            studentInitials: self.state.defaultStudentInitials
        }).catch(function(error: any) {
            console.log(error.message);
        }).then(function() {
            self.closeWindow();
        });
    }

    handleInput(e: any) {
        e.preventDefault();
        this.setState({
            [e.target.name]: e.target.value
        });
    }

    activate(e: any) {
        this.props.mode(2);
        this.props.store.setstudentid(this.state.checkedSelection.childNodes[1].innerHTML);
        this.state.checkedSelection.style.backgroundColor = 'transparent';
        this.setState({checkedSelection: ''});
        this.closeWindow();
    }

    checkSelection(e: any) {
        e.preventDefault();
        if (e.target.parentElement.childNodes[0].tagName === 'TH' ||
            e.target.parentElement.tagName === 'TABLE' || e.target.parentElement.tagName === 'DIV') {
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
                                        onClick={this.handleBlur}>Activate Student</button></td>
                        </tr>
                    </table>
                    <table className="student-table" onClick={this.checkSelection}>
                        <tr>
                            <th>Student Initials</th>
                        </tr>
                        {this.state.tableCellsArray}
                    </table>
                </div>
                <div className="generic-register-div" hidden={this.state.isRegisterHidden}>
                    Student Initials: <input type="text" name="studentInitials" value={this.state.studentInitials}
                                       onChange={this.handleInput} placeholder="Student Initials"/><br/>
                    <span className="nested-register-span">
                        {this.state.registerMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.addStudent}>Add Student</button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>Close</button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isUpdateHidden}>
                    Student Initials: <input type="text" name="defaultStudentInitials" value={this.state.defaultStudentInitials}
                                       onChange={this.handleInput}/><br/>
                    <span className="nested-register-span">
                        {this.state.updateMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.updateStudent}>Update Student</button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>Close</button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isRemoveHidden}>
                    <span className="nested-register-span">
                        {'Are you sure you would like to remove ' + this.state.defaultStudentInitials + ' from the database?'}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>Yes</button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>No</button>
                    </span>
                </div>
                {/*<div className="generic-register-div" hidden={this.state.isActivateHidden}>*/}
                    {/*<span className="nested-register-span">*/}
                        {/*{'Are you sure you would like to select ' + this.state.defaultStudentInitials + '?'}*/}
                        {/*<br/><br/>*/}
                        {/*<button className="nested-register-button" type="button" onClick={this.activate}>Yes</button>*/}
                        {/*&nbsp;*/}
                        {/*<button className="nested-register-button" type="button" onClick={this.closeWindow}> No </button>*/}
                    {/*</span>*/}
                {/*</div>*/}
            </div>
        );
    }
}

interface BookSelectionProps {
    mode: any;
    store: any;
}

interface BookSelectionState {
    outerDivStyle: Object;
    isMessageHidden: boolean;
    bookArray: any[];
    checkedSelection: any;
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
            isMessageHidden: false,
            bookArray: [],
            checkedSelection: ''
        };

        this.removeMessage = this.removeMessage.bind(this);
        this.chooseBook = this.chooseBook.bind(this);
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
        const self = this;
        let url = window.location.protocol + '//' + window.location.host + '/api/sharedbooks/';
        let bookArray: any[] = [];
        let currentBook = 'index.json';
        let fullURL = url + currentBook;
        $.get(fullURL, function(result) {
            for (let i = 0; i < Object.keys(result).length; i++) {
                bookArray.push(<Book key={i} title={result[i].title} author={result[i].author} slug={result[i].slug}/>);
            }
        }).done(function() {
            self.setState({bookArray: bookArray});
        })
    }

    chooseBook(e: any) {
        e.preventDefault();
        const self = this;
        if (e.target.className === 'book-table') {
            return;
        }

        let selection = '';
        if (e.target.className === 'book') {
            selection = e.target;
        } else {
            selection = e.target.parentElement;
        }

        this.setState({checkedSelection: selection}, confirmBook);
        function confirmBook() {
            let ref = firebase.database().ref('events/pageNumber').push();
            ref.set({
                teacherID: self.getUserID(),
                studentID: self.props.store.studentid,
                book: self.state.checkedSelection.childNodes[0].innerHTML,
                date: new Date(new Date().getTime()).toLocaleString(),
                page: 1
            });

            // startReading event
            let anotherRef = firebase.database().ref('/events/startReading').push();
            anotherRef.set({
                teacherID: self.getUserID(),

                studentID: self.props.store.studentid,
                date: new Date(new Date().getTime()).toLocaleString(),
                book: self.state.checkedSelection.childNodes[0].innerHTML
            }).then(function() {
                let temp = self.state.checkedSelection;
                self.setState({checkedSelection: ''});
                self.props.store.setIdPage(temp.childNodes[2].innerHTML, 1);
            });
        }
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

    render () {
        return (
            <div>
                <div className="generic-register-div" hidden={this.state.isMessageHidden}>
                    <span className="nested-register-span">
                        Please select a book to continue.
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.removeMessage}>
                            Ok
                        </button>
                    </span>
                </div>
                <div style={this.state.outerDivStyle}>
                    <div className="book-table" onClick={this.chooseBook}>
                        {this.state.bookArray}
                    </div>
                </div>
                {/*<div className="generic-register-div" hidden={this.state.isBookSelectionHidden}>*/}
                    {/*<span className="nested-register-span">*/}
                        {/*You have chosen {"'" + this.state.checkedSelection.innerHTML + ".'"}*/}
                        {/*<br/><br/>*/}
                        {/*<button className="nested-register-button" type="button" onClick={this.confirmBook}>Confirm</button>*/}
                        {/*&nbsp;*/}
                        {/*<button className="nested-register-button" type="button" onClick={this.closeBookMenu}>Cancel</button>*/}
                    {/*</span>*/}
                {/*</div>*/}
            </div>
        );
    }
}

interface BookProps {
    title: string;
    author: string;
    slug: string;
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
                <p className='book-title'>{this.props.title}</p>
                <p className='book-author'>{this.props.author}</p>
                <p className='book-slug' hidden={true}>{this.props.slug}</p>
            </div>
        );
    }
}

export default Landing;
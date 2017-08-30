import * as React from 'react';
import * as firebase from 'firebase';
import * as $ from 'jquery';
import Accordion from 'react-responsive-accordion';
import Store from './Store';

interface LandingProps {
    store: Store;
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
            message: 'Please sign in to Google to continue',
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

        firebase.auth().onAuthStateChanged(function(user: firebase.User | null) {
            if (user && user.email) {
                self.setState({email: user.email});
            }
        });
    }

    handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault();
        this.setState({[e.target.name as any]: e.target.value});
    }

    getUserID() {
        if (firebase.auth() !== null && firebase.auth() !== undefined) {
            let auth = firebase.auth();
            if (auth.currentUser !== null && auth.currentUser !== undefined) {
                let currentUser = auth.currentUser;
                if (currentUser.uid !== null && currentUser.uid !== undefined) {
                    return currentUser.uid;
                }
            }
        }
        return false;

    }

    getUserEmail() {
        if (firebase.auth() !== null && firebase.auth() !== undefined) {
            let auth = firebase.auth();
            if (auth.currentUser !== null && auth.currentUser !== undefined) {
                let currentUser = auth.currentUser;
                if (currentUser.uid !== null && currentUser.uid !== undefined) {
                    return currentUser.uid;
                }
            }
        }
        return false;
    }

    validate(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        const self = this;

        if (this.state.isSigningIn || this.state.isSignedIn) {
            return;
        }

        self.setState({isSigningIn: true}, signIn);
        function signIn() {
            var provider = new firebase.auth.GoogleAuthProvider();
            firebase.auth().signInWithPopup(provider).then(function() {
                let firstRef = firebase.database().ref('/users/admin_data/').push();
                firstRef.set({
                    uid: self.getUserID(),
                    email: self.getUserEmail()
                }).catch(function(error: Error) {
                    // User is already registered at admin_data
                    // console.log(error.message);
                }).then(function() {
                    let key = firstRef.key;
                    firebase.database().ref('/users/private_user/' + self.getUserID()).set({
                        uid: self.getUserID(),
                        email: self.getUserEmail(),
                        admin_data_key: key
                    }).catch(function(error: Error) {
                        // User is already registered at private_user
                        // console.log(error.message);
                    }).then(function() {
                        firebase.database().ref('/users/admin/' + self.getUserID() + '/active').
                        once('value', function(data: firebase.database.DataSnapshot) {
                            if (data.val() === true) {
                                self.setState({isSignedIn: true, mode: 1});
                            } else {
                                self.setState({
                                    message: 'Email is not verified. Please contact the web master for assistance.'
                                });
                            }
                        });
                    });
                });
            }).catch(function(error: Error) {
                console.log(error.message);
            }).then(function() {
                self.setState({isSigningIn: false});
            });
        }
    }

    googleSignOut(e: React.MouseEvent<HTMLButtonElement>) {
        e.preventDefault();
        firebase.auth().signOut().then(function() {
            console.log('Sign out successful');
        }).catch(function(error: Error) {
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
                        <button className="nested-register-button" type="button" onClick={this.validate}>Sign In
                        </button>
                        <br/>
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
    mode: (mode: number) => void;
    store: Store;
}

interface ClassRollState {
    outerDivStyle: any;
    studentInitials: string;
    isRegisterHidden: boolean;
    isUpdateHidden: boolean;
    isRemoveHidden: boolean;
    tableCellsArray: JSX.Element[];
    checkedSelection: any;
    defaultStudentInitials: string;
    registerMessage: string;
    updateMessage: string;
    checkedGroup: any;
    isAddGroupHidden: boolean;
    isRemoveGroupHidden: boolean;
    groupName: string;
    addGroupMessage: string;
    groupCellsArray: JSX.Element[];
    isUpdateGroupHidden: boolean;
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
            updateMessage: 'Please enter new student initials.',
            checkedGroup: '',
            isAddGroupHidden: true,
            isRemoveGroupHidden: true,
            groupName: '',
            addGroupMessage: '',
            groupCellsArray: [],
            isUpdateGroupHidden: true
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.checkSelection = this.checkSelection.bind(this);
        this.closeWindow = this.closeWindow.bind(this);
        this.addGroup = this.addGroup.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
        this.updateGroup = this.updateGroup.bind(this);
    }

    componentWillMount() {
        const self = this;
        var tempArray: JSX.Element[] = [];
        setTimeout(function() {
            let uid = self.getUserID();
            let ref = firebase.database().ref('/users/private_students/' + uid);
            ref.once('value', function(snapshot: firebase.database.DataSnapshot) {
                snapshot.forEach(function(childSnapshot: firebase.database.DataSnapshot) {
                    if (childSnapshot.key !== null && childSnapshot.key !== undefined) {
                        let student = (
                            <tr key={childSnapshot.key}>
                                <td>{childSnapshot.child('studentInitials').val()}</td>
                                <td hidden={true}>{childSnapshot.key}</td>
                            </tr>
                        );
                        tempArray.push(student);
                    }
                    return false;
                });
            }).then(function() {
                self.setState({tableCellsArray: tempArray});
            });

            let groupArray: JSX.Element[] = [];
            firebase.database().ref('/users/private_groups/' + self.getUserID()).
            once('value', function(snapshot: firebase.database.DataSnapshot) {
                snapshot.forEach(function(childSnapshot: firebase.database.DataSnapshot) {
                    let group: JSX.Element;
                    if (childSnapshot.key !== null && childSnapshot.key !== undefined) {
                        group = (
                            <tr key={childSnapshot.key} className="group-table-tr">
                                <td>{childSnapshot.child('groupName').val()}</td>
                                <td hidden={true}>{childSnapshot.key}</td>
                            </tr>
                        );
                        groupArray.push(group);
                    }
                    return false;
                });
            }).then(function() {
                self.setState({groupCellsArray: groupArray});
            });

            // child_added listener
            var studentsRef = firebase.database().ref('/users/private_students/' + uid);
            studentsRef.on('child_added', function (data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let student = (
                        <tr key={data.key}>
                            <td>{data.child('studentInitials').val()}</td>
                            <td hidden={true}>{data.key}</td>
                        </tr>
                    );
                    var newArr = self.state.tableCellsArray.slice();
                    newArr.push(student);
                    self.setState({tableCellsArray: newArr});
                }
            });

            firebase.database().ref('users/private_groups/' + uid).
            on('child_added', function(data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let group = (
                        <tr key={data.key} className="group-table-tr">
                            <td>{data.child('groupName').val()}</td>
                            <td hidden={true}>{data.key}</td>
                        </tr>
                    );
                    let newArr = self.state.groupCellsArray.slice();
                    newArr.push(group);
                    self.setState({groupCellsArray: newArr});
                }
            });

            // child_changed listener
            firebase.database().ref('/users/private_students/' + uid).
            on('child_changed', function(data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let tempArr = self.state.tableCellsArray.slice();
                    let ind: number = self.getRowIndex(data.key);
                    let student = (
                        <tr key={data.key}>
                            <td>{data.child('studentInitials').val()}</td>
                            <td hidden={true}>{data.key}</td>
                        </tr>
                    );
                    tempArr.splice(ind, 1, student);
                    self.setState({tableCellsArray: tempArr});
                }
            });

            firebase.database().ref('users/private_groups/' + uid).
            on('child_changed', function(data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let tempArr = self.state.groupCellsArray.slice();
                    let ind: number = self.getGroupRowIndex(data.key);
                    let group = (
                        <tr key={data.key} className="group-table-tr">
                            <td>{data.child('groupName').val()}</td>
                            <td hidden={true}>{data.key}</td>
                        </tr>
                    );
                    tempArr.splice(ind, 1, group);
                    self.setState({groupCellsArray: tempArr});
                }
            });

            // child_removed listener
            firebase.database().ref('/users/private_students/' + uid).
            on('child_removed', function(data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let tempArr = self.state.tableCellsArray.slice();
                    let ind: number = self.getRowIndex(data.key);
                    tempArr.splice(ind, 1);
                    self.setState({tableCellsArray: tempArr});
                }
            });

            firebase.database().ref('users/private_groups/' + uid).
            on('child_removed', function(data: firebase.database.DataSnapshot) {
                if (data.key !== null && data.key !== undefined) {
                    let tempArr = self.state.groupCellsArray.slice();
                    let ind: number = self.getGroupRowIndex(data.key);
                    tempArr.splice(ind, 1);
                    self.setState({groupCellsArray: tempArr});
                }
            });
        }, 500);
    }

    getRowIndex(key: number | string) {
        let ind: number = 0;
        for (let i = 0; i < this.state.tableCellsArray.length; i++) {
            if (this.state.tableCellsArray[i].key === key) {
                ind = i;
                break;
            }
        }
        return ind;
    }

    getGroupRowIndex(key: number | string) {
        let ind: number = 0;
        for (let i = 0; i < this.state.groupCellsArray.length; i++) {
            if (this.state.groupCellsArray[i].key === key) {
                ind = i;
                break;
            }
        }
        return ind;
    }

    getUserID() {
        if (firebase.auth() !== null && firebase.auth() !== undefined) {
            let auth = firebase.auth();
            if (auth.currentUser !== null && auth.currentUser !== undefined) {
                let currentUser = auth.currentUser;
                if (currentUser.uid !== null && currentUser.uid !== undefined) {
                    return currentUser.uid;
                }
            }
        }
        return false;
    }

    handleBlur = (e) => {
        e.preventDefault();
        if (this.state.isRegisterHidden === false || this.state.isUpdateHidden === false ||
            this.state.isRemoveHidden === false) {
            return;
        }

        if (e.target.innerHTML === 'Add Student') {
            this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        } else if (e.target.innerHTML === 'Remove Student') {
            if (this.state.checkedSelection === '' || this.state.checkedSelection.className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isRemoveHidden: !this.state.isRemoveHidden,
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });
        } else if (e.target.innerHTML === 'Update Student') {
            if (this.state.checkedSelection === '' || this.state.checkedSelection.className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isUpdateHidden: !this.state.isUpdateHidden,
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });
        } else if (e.target.innerHTML === 'Activate Student') {
            if (this.state.checkedSelection === '' || this.state.checkedSelection.className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                defaultStudentInitials: this.state.checkedSelection.childNodes[0].innerHTML
            });
            this.activate();
        } else if (e.target.innerHTML === 'Add Group') {
            this.setState({isAddGroupHidden: !this.state.isAddGroupHidden});
        } else if (e.target.innerHTML === 'Remove Group') {
            if (this.state.checkedGroup === '') {
                alert('Please select a group first.');
                return;
            }
            console.log(this.state.checkedSelection);
            this.setState({isRemoveGroupHidden: !this.state.isRemoveGroupHidden});
        } else if (e.target.innerHTML === 'Update Group') {
            if (this.state.checkedGroup === '') {
                alert('Please select a group first.');
                return;
            }
            this.setState({isUpdateGroupHidden: false});
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
        } else if (this.state.isAddGroupHidden === false) {
            this.setState({isAddGroupHidden: !this.state.isAddGroupHidden});
        } else if (this.state.isRemoveGroupHidden === false) {
            this.setState({isRemoveGroupHidden: !this.state.isRemoveGroupHidden});
        } else if (this.state.isUpdateGroupHidden === false) {
            this.setState({isUpdateGroupHidden: !this.state.isUpdateGroupHidden});
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

    activate() {
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
            alert('Please deselect previous item first.');
            return;
        }

        if (e.target.parentElement.style.backgroundColor !== 'white') {
            if (e.target.parentElement.className === 'group-table-tr') {
                this.setState({checkedGroup: e.target.parentElement, groupName: e.target.innerHTML});
            }
            e.target.parentElement.style.backgroundColor = 'white';
            this.setState({checkedSelection: e.target.parentElement});
        } else {
            if (e.target.parentElement.className === 'group-table-tr') {
                this.setState({checkedGroup: '', groupName: ''});
            }
            e.target.parentElement.style.backgroundColor = 'transparent';
            this.setState({checkedSelection: ''});
        }
    }

    addGroup(e: any) {
        e.preventDefault();
        const self = this;
        firebase.database().ref('users/private_groups/' + self.getUserID()).push().set({
            groupName: this.state.groupName
        }).then(function() {
            self.closeWindow();
        });
    }

    removeGroup(e: any) {
        const self = this;
        e.preventDefault();
        if (e.target.innerHTML === 'Yes') {
            let uid = self.getUserID();
            let key = self.state.checkedGroup.childNodes[1].innerHTML;
            firebase.database().ref('users/private_groups/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedGroup: '', groupName: ''});
                self.closeWindow();
            });
        } else if (e.target.innerHTML === 'No') {
            self.closeWindow();
        }
    }

    updateGroup(e: any) {
        e.preventDefault();
        const self = this;
        let uid = this.getUserID();
        let key = this.state.checkedGroup.childNodes[1].innerHTML;
        firebase.database().ref('/users/private_groups/' + uid + '/' + key).update({
            groupName: self.state.groupName
        }).then(function() {
            self.closeWindow();
        });
    }

    render() {
        return (
            <div>
                <div style={this.state.outerDivStyle}>
                    <table className="register-button">
                        <tr>
                            <td>
                                <button className="student-button add-student" type="text" onClick={this.handleBlur}> 
                                    Add Student
                                </button>
                            </td>
                            <td>
                                <button className="student-button remove-student" type="text" onClick={this.handleBlur}>
                                    Remove Student
                                </button>
                            </td>
                            <td>
                                <button className="student-button update-student" type="text" onClick={this.handleBlur}>
                                    Update Student
                                </button>
                            </td>
                            <td>
                                <button 
                                        className="student-button activate-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                >
                                    Activate Student
                                </button>
                            </td>
                        </tr>
                        <br/>
                        <tr>
                            <td>
                                <button 
                                    className="student-button add-group" 
                                    type="text"
                                    onClick={this.handleBlur}
                                >
                                        Add Group
                                </button>
                            </td>
                            <td>
                                <button 
                                    className="student-button remove-group" 
                                    type="text"
                                    onClick={this.handleBlur}
                                >
                                    Remove Group
                                </button>
                            </td>
                            <td>
                                <button 
                                    className="student-button update-group" 
                                    type="text"
                                    onClick={this.handleBlur}
                                >
                                    Update Group
                                </button>
                            </td>
                        </tr>
                    </table>
                    <table className="student-table" onClick={this.checkSelection}>
                        <tr>
                            <th>Student Initials</th>
                        </tr>
                        {this.state.tableCellsArray}
                        <tr className="group-table-tr">
                            <th>Groups</th>
                        </tr>
                        {this.state.groupCellsArray}
                    </table>
                </div>
                <div className="generic-register-div" hidden={this.state.isRegisterHidden}>
                    Student Initials: 
                    <input 
                        type="text" 
                        name="studentInitials" 
                        value={this.state.studentInitials}
                        onChange={this.handleInput} 
                        placeholder="Student Initials" 
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.registerMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.addStudent}>
                            Add Student
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isUpdateHidden}>
                    Student Initials: 
                    <input 
                        type="text" 
                        name="defaultStudentInitials" 
                        value={this.state.defaultStudentInitials} 
                        onChange={this.handleInput}
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.updateMessage}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.updateStudent}>
                            Update Student
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isRemoveHidden}>
                    <span className="nested-register-span">
                        {'Are you sure you would like to remove ' + 
                        this.state.defaultStudentInitials + ' from the database?'}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>
                            Yes
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.removeStudent}>
                            No
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isAddGroupHidden}>
                    Group Name: 
                    <input 
                        type="text" 
                        name="groupName" 
                        value={this.state.groupName}
                        onChange={this.handleInput} 
                        placeholder="Group Name"
                    />
                    <br/>
                    <span className="nested-register-span">
                        {this.state.addGroupMessage}
                        <br/>
                        <button className="nested-register-button" type="button" onClick={this.addGroup}>
                            Add Group
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isRemoveGroupHidden}>
                    <span className="nested-register-span">
                        {'Are you sure you would like to remove ' + this.state.groupName + ' from the database?'}
                        <br/>
                        <button className="nested-register-button" type="button" onClick={this.removeGroup}>Yes</button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>No</button>
                    </span>
                </div>
                <div className="generic-register-div" hidden={this.state.isUpdateGroupHidden}>
                    Group Name: 
                    <input 
                        type="text" 
                        name="groupName" 
                        value={this.state.groupName}
                        onChange={this.handleInput}
                    />
                    <br/>
                    <span className="nested-register-span">
                        {'Please enter new group name.'}
                        <br/><br/>
                        <button className="nested-register-button" type="button" onClick={this.updateGroup}>
                            Update Group
                        </button>
                        &nbsp;
                        <button className="nested-register-button" type="button" onClick={this.closeWindow}>
                            Close
                        </button>
                    </span>
                </div>
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
    accordion: any;
    initialAccordion: any;
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
                filter: 'blur(0px)'
            },
            isMessageHidden: false,
            bookArray: [],
            checkedSelection: '',
            accordion: '',
            initialAccordion: ''
        };

        this.chooseBook = this.chooseBook.bind(this);
    }

    componentWillMount() {
        const self = this;

        let url = window.location.protocol + '//' + window.location.host + '/api/sharedbooks/';
        let currentBook = 'index.json';
        let fullURL = url + currentBook;

        let bookArray: any[] = [];
        let arr: any[] = [];

        // TODO - remove setTimeout()
        setTimeout(function() {
            // child_changed listener
            firebase.database().ref('/users/private_variables/' + self.getUserID()).
            on('child_changed', function(data: any) {
                console.log('child_changed');
                renderRecentBooks();
            });

            firebase.database().ref('/users/private_variables/' + self.getUserID()).
            on('child_added', function (data: any) {
                renderRecentBooks();
            });

            function renderRecentBooks() {
                let bar: any[] = [];
                firebase.database().ref('/users/private_variables/' + self.getUserID()).
                once('value', function (snapshot: any) {
                    if (snapshot.child('first_slug').val() !== null) {
                        bar.push(
                            (
                                <Book 
                                    key={0} 
                                    title={snapshot.child('first_title').val()}
                                    author={snapshot.child('first_author').val()}
                                    slug={snapshot.child('first_slug').val()}
                                />
                            )
                        );
                        if (snapshot.child('second_slug').val() !== null) {
                            bar.push(                            
                                (
                                    <Book 
                                        key={1}
                                        title={snapshot.child('second_title').val()}
                                        author={snapshot.child('second_author').val()}
                                        slug={snapshot.child('second_slug').val()}
                                    />
                                )
                            );
                            if (snapshot.child('third_slug').val() !== null) {
                                bar.push(
                                    (
                                        <Book 
                                            key={2}
                                            title={snapshot.child('third_title').val()}
                                            author={snapshot.child('third_author').val()}
                                            slug={snapshot.child('third_slug').val()}
                                        />
                                    )
                                );

                            }
                        }
                        let initialDiv =
                            (
                                <div data-trigger={'Recent Books'} className="book-table">
                                    {bar}
                                </div>
                            );
                        let foo: any[] = [];
                        foo.push(initialDiv);
                        self.setState({
                            initialAccordion:
                                (
                                    <Accordion startPosition={0} transitionTime={200}>
                                        {foo}
                                    </Accordion>
                                )
                        });
                    }
                });
            }
        }, 300);

        $.get(fullURL, function(result) {
            let currentCategory = result[0].sheet;
            for (let i = 0; i < Object.keys(result).length; i++) {
                let newCategory = result[i].sheet;
                if (i === Object.keys(result).length - 1) {
                    bookArray.push(
                        <Book 
                              key={i} 
                              title={result[i].title} 
                              author={result[i].author} 
                              slug={result[i].slug}
                        />
                    );
                    let div =
                        (
                            <div data-trigger={currentCategory} className="book-table">
                                {bookArray}
                            </div>
                        );
                    arr.push(div);
                    currentCategory = newCategory;
                    bookArray = [];
                    break;
                }

                if (currentCategory === newCategory) {
                    bookArray.push(
                        <Book 
                            key={i} 
                            title={result[i].title} 
                            author={result[i].author} 
                            slug={result[i].slug}
                        />
                    );
                } else if (currentCategory !== newCategory) {
                    let div = (
                        <div data-trigger={currentCategory} className="book-table">
                            {bookArray}
                        </div>
                    );
                    arr.push(div);
                    currentCategory = newCategory;
                    bookArray = [];
                    bookArray.push(
                        <Book 
                            key={i} 
                            title={result[i].title} 
                            author={result[i].author} 
                            slug={result[i].slug}
                        />
                    );
                }
            }
        }).done(function() {
            self.setState({
                accordion: (
                    <Accordion startPosition={-1} transitionTime={200}>
                        {arr}
                    </Accordion>
                )
            });
        });
    }

    // TODO - could not figure out what to do with React.MouseEvent<HTMLElement>
    chooseBook(e: any) {
        e.preventDefault();
        const self = this;
        let className = e.target.className;
        let selection = '';

        if (className === 'book' || className === 'book-title' || className === 'book-author') {
            if (className === 'book') {
                selection = e.target;
            } else if (className === 'book-title') {
                selection = e.target.parentNode;
            } else if (className === 'book-author') {
                selection = e.target.parentNode;
            }
        } else {
            return;
        }

        this.setState({checkedSelection: selection}, confirmBook);
        function confirmBook() {
            // pageNumber event
            let title = self.state.checkedSelection.childNodes[0].innerHTML;
            let author = self.state.checkedSelection.childNodes[1].innerHTML;
            let slug = self.state.checkedSelection.childNodes[2].innerHTML;
            let ref = firebase.database().ref('events').push();
            ref.set({
                teacherID: self.getUserID(),
                studentID: self.props.store.studentid,
                book: self.state.checkedSelection.childNodes[0].innerHTML,
                date: new Date(new Date().getTime()).toLocaleString(),
                event: 'PAGE NUMBER 1'
            });

            // startReading event
            let anotherRef = firebase.database().ref('events').push();
            anotherRef.set({
                teacherID: self.getUserID(),
                studentID: self.props.store.studentid,
                date: new Date(new Date().getTime()).toLocaleString(),
                book: self.state.checkedSelection.childNodes[0].innerHTML,
                event: 'START READING'
            }).then(function() {
                let temp = self.state.checkedSelection;
                self.setState({checkedSelection: ''});
                self.props.store.setIdPage(temp.childNodes[2].innerHTML, 1);
            });

            firebase.database().ref('users/private_variables/' + self.getUserID()).
            once('value', function (snapshot: firebase.database.DataSnapshot) {
                let firstBook = {
                    slug: snapshot.child('first_slug').val(),
                    title: snapshot.child('first_title').val(),
                    author: snapshot.child('first_author').val()
                };
                let secondBook = {
                    slug: snapshot.child('second_slug').val(),
                    title: snapshot.child('second_title').val(),
                    author: snapshot.child('second_author').val()
                };
                let thirdBook = {
                    slug: snapshot.child('third_slug').val(),
                    title: snapshot.child('third_title').val(),
                    author: snapshot.child('third_author').val()
                };

                // There are no books in the database
                if (firstBook.slug === null && secondBook.slug === null && thirdBook.slug === null) {
                    firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_slug').set(slug).
                    then(function () {
                        firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_title').
                        set(title).then(function () {
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_author').
                            set(author);
                        });
                    });
                // There is one book in the database
                } else if (firstBook.slug !== null && secondBook.slug === null && thirdBook.slug === null) {
                    if (firstBook.slug !== slug) {
                        // Shift over all of book 1 --> book 2
                        firebase.database().ref('/users/private_variables/' + self.getUserID() + '/second_slug').
                        set(firstBook.slug).then(function () {
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/second_title').
                            set(firstBook.title).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/second_author').
                                set(firstBook.author);
                            });
                        }).then(function() {
                            // Insert new book properties in book 1
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_slug').
                            set(slug).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/first_title').set(title).then(function () {
                                    firebase.database().ref('/users/private_variables/' + 
                                    self.getUserID() + '/first_author').set(author);
                                });
                            });
                        });
                    }
                // There are two books in the database
                } else if (firstBook.slug !== null && secondBook.slug !== null && thirdBook.slug === null) {
                    if (firstBook.slug !== slug && secondBook.slug !== slug) {
                        console.log('two different books');
                        // Shift book 2 --> book 3, book 1 --> book 2)
                        firebase.database().ref('/users/private_variables/' + self.getUserID() + '/third_slug').
                        set(secondBook.slug).then(function () {
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/third_title').
                            set(secondBook.title).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/third_author').set(secondBook.author);
                            });
                        }).then(function() {
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/second_slug').
                            set(firstBook.slug).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/second_title').set(firstBook.title).then(function () {
                                    firebase.database().ref('/users/private_variables/' + 
                                    self.getUserID() + '/second_author').set(firstBook.author);
                                });
                            });
                        }).then(function() {
                            // Insert new book properties in book 1
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_slug').
                            set(slug).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/first_title').set(title).then(function () {
                                    firebase.database().ref('/users/private_variables/' + 
                                    self.getUserID() + '/first_author').set(author);
                                });
                            });
                        });
                    }
                // There are three books, but book 1 will be replaced
                } else {
                    if (slug !== firstBook.slug && slug !== secondBook.slug && slug !== thirdBook.slug) {
                        // Move book 1 --> book 2
                        firebase.database().ref('/users/private_variables/' + self.getUserID() + '/second_slug').
                        set(firstBook.slug).then(function () {
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/second_title').
                            set(firstBook.title).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/second_author').set(firstBook.author);
                            });
                        }).then(function() {
                            // Move book 2 --> book 3
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/third_slug').
                            set(secondBook.slug).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/third_title').set(secondBook.title).then(function () {
                                    firebase.database().ref('/users/private_variables/' + 
                                    self.getUserID() + '/third_author').set(secondBook.author);
                                });
                            });
                        }).then(function() {
                            // Insert new book properties in book 1
                            firebase.database().ref('/users/private_variables/' + self.getUserID() + '/first_slug').
                            set(slug).then(function () {
                                firebase.database().ref('/users/private_variables/' + 
                                self.getUserID() + '/first_title').set(title).then(function () {
                                    firebase.database().ref('/users/private_variables/' + 
                                    self.getUserID() + '/first_author').set(author);
                                });
                            });
                        });
                    }
                }
            });
        }
    }

    getUserID() {
        if (firebase.auth() !== null && firebase.auth() !== undefined) {
            let auth = firebase.auth();
            if (auth.currentUser !== null && auth.currentUser !== undefined) {
                let currentUser = auth.currentUser;
                if (currentUser.uid !== null && currentUser.uid !== undefined) {
                    return currentUser.uid;
                }
            }
        }
        return false;
    }

    render () {
        return (
            <div>
                <div style={this.state.outerDivStyle}>
                    <div className="book-table" onClick={this.chooseBook}>
                        {this.state.initialAccordion}
                        {this.state.accordion}
                    </div>
                </div>
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
                <p className="book-title">{this.props.title}</p>
                <p className="book-author">{this.props.author}</p>
                <p className="book-slug" hidden={true}>{this.props.slug}</p>
            </div>
        );
    }
}

export default Landing;

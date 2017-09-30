import * as React from 'react';
import * as firebase from 'firebase';
import Store from './Store';

interface ClassRollProps {
    store: Store;
}

interface ClassRollState {
    outerDivStyle: React.CSSProperties;
    studentInitials: string;
    isRegisterHidden: boolean;
    isUpdateHidden: boolean;
    isRemoveHidden: boolean;
    tableCellsArray: JSX.Element[];
    checkedSelection: HTMLTableElement | string;
    defaultStudentInitials: string;
    registerMessage: string;
    updateMessage: string;
    checkedGroup: HTMLTableElement | string;
    isAddGroupHidden: boolean;
    isRemoveGroupHidden: boolean;
    groupName: string;
    addGroupMessage: string;
    groupCellsArray: JSX.Element[];
    isUpdateGroupHidden: boolean;
}

export default class ClassRoll extends React.Component<ClassRollProps, ClassRollState> {
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
            isUpdateGroupHidden: true,
            checkedSelection: ''
        };

        this.handleBlur = this.handleBlur.bind(this);
        this.handleInput = this.handleInput.bind(this);
        this.closeWindow = this.closeWindow.bind(this);
        this.handleKeyInput = this.handleKeyInput.bind(this);
        this.removeGroup = this.removeGroup.bind(this);
        this.removeStudent = this.removeStudent.bind(this);
        this.updateStudent = this.updateStudent.bind(this);
        this.updateGroup = this.updateGroup.bind(this);
        this.activate = this.activate.bind(this);
        this.addGroup = this.addGroup.bind(this);
        this.addStudent = this.addStudent.bind(this);
        this.logout = this.logout.bind(this);
    }

    componentDidMount() {
        const self = this;

        let tempArray: JSX.Element[] = [];
        let uid = self.props.store.teacherid;

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
        firebase.database().ref('/users/private_groups/' + self.props.store.teacherid).
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

        // child_added listeners
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

        // child_changed listeners
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

        // child_removed listeners
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

    handleBlur = (e) => {
        e.preventDefault();
        if (
            this.state.isRegisterHidden === false || 
            this.state.isUpdateHidden === false ||
            this.state.isRemoveHidden === false ||
            this.state.isAddGroupHidden === false ||
            this.state.isUpdateGroupHidden === false
        ) {
            return;
        }

        let className, childNodes, initials;
        if (
            (this.state.checkedSelection as HTMLTableElement).className !== undefined &&
            (this.state.checkedSelection as HTMLTableElement).childNodes[0] !== undefined
        ) {
                className = (this.state.checkedSelection as HTMLTableElement).className;
                childNodes = (this.state.checkedSelection as HTMLTableElement).childNodes[0];
                initials = (childNodes as HTMLTableElement).innerHTML;
        }

        if (e.target.innerHTML === 'Add Student') {
            this.setState({isRegisterHidden: !this.state.isRegisterHidden});
        } else if (e.target.innerHTML === 'Remove Student') {
            if (this.state.checkedSelection === '' || className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isRemoveHidden: !this.state.isRemoveHidden,
                defaultStudentInitials: initials
            });
        } else if (e.target.innerHTML === 'Update Student') {
            if (this.state.checkedSelection === '' || className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                isUpdateHidden: !this.state.isUpdateHidden,
                defaultStudentInitials: initials
            });
        } else if (e.target.innerHTML === 'Activate Student') {
            if (this.state.checkedSelection === '' || className === 'group-table-tr') {
                alert('Please select a student first.');
                return;
            }
            this.setState({
                defaultStudentInitials: initials
            });
            this.activate();
        } else if (e.target.innerHTML === 'Add Group') {
            this.setState({isAddGroupHidden: !this.state.isAddGroupHidden});
        } else if (e.target.innerHTML === 'Remove Group') {
            if (this.state.checkedGroup === '') {
                alert('Please select a group first.');
                return;
            }
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

    addStudent() {
        const self = this;
        let uid = self.props.store.teacherid;
        var oldRef = firebase.database().ref('/users/private_students/' + uid);
        var newRef = oldRef.push();
        var errorSet = false;
        newRef.set({
            studentInitials: self.state.studentInitials.toUpperCase()
        }).catch(function(error: Error) {
            console.log(error.message);
            errorSet = true;
            self.setState({
                    registerMessage: 'Student initials must be no longer than three characters long.'
                }
            );
        }).then(function() {
            if (errorSet === false) {
                self.closeWindow();
                self.props.store.firebaseUsageEvent([{ attrName: 'number_students', attrValue: 1 }]);
            }
        });
    }

    removeStudent(e: React.MouseEvent<HTMLButtonElement>) {
        const self = this;
        e.preventDefault();
        let targetHTML;
        if (e.nativeEvent.srcElement !== null) {
            targetHTML = e.nativeEvent.srcElement.innerHTML;
        }
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        if (targetHTML === 'Yes') {
            let uid = self.props.store.teacherid;
            firebase.database().ref('/users/private_students/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedSelection: ''});
                self.closeWindow();
            }).then(function() {
                self.props.store.firebaseUsageEvent([{ attrName: 'number_students', attrValue: -1 }]);
            });
        } else if (targetHTML === 'No') {
            self.closeWindow();
        }
    }

    updateStudent() {
        const self = this;
        let uid = self.props.store.teacherid;
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        firebase.database().ref('/users/private_students/' + uid + '/' + key).update({
            studentInitials: self.state.defaultStudentInitials
        }).catch(function(error: Error) {
            console.log(error.message);
        }).then(function() {
            self.closeWindow();
        });
    }

    handleInput = (e) => {
        e.preventDefault();
        let name = e.target.name;
        this.setState({[name]: e.target.value});
    }

    activate() {
        let id = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        this.props.store.setmode(2);
        this.props.store.setstudentid(id);
        (this.state.checkedSelection as HTMLTableElement).style.backgroundColor = 'transparent';
        this.setState({checkedSelection: ''});
        this.closeWindow();
    }

    checkSelection = (e) => {
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

    addGroup() {
        const self = this;
        firebase.database().ref('users/private_groups/' + self.props.store.teacherid).push().set({
            groupName: this.state.groupName
        }).then(function() {
            self.closeWindow();
            self.props.store.firebaseUsageEvent([{ attrName: 'number_groups', attrValue: 1 }]);
        });
    }

    removeGroup = (e) => {
        const self = this;
        e.preventDefault();
        if (e.target.innerHTML === 'Yes') {
            let uid = self.props.store.teacherid;
            let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
            firebase.database().ref('users/private_groups/' + uid + '/' + key).remove().then(function() {
                self.setState({checkedSelection: '', checkedGroup: '', groupName: ''});
                self.closeWindow();
            }).then(function() {
                console.log('here?');
                self.props.store.firebaseUsageEvent([{ attrName: 'number_groups', attrValue: -1 }]);
            });
        } else if (e.target.innerHTML === 'No') {
            self.closeWindow();
        }
    }

    updateGroup() {
        const self = this;
        let uid = self.props.store.teacherid;
        let key = ((this.state.checkedSelection as HTMLTableElement).childNodes[1] as HTMLTableElement).innerHTML;
        firebase.database().ref('/users/private_groups/' + uid + '/' + key).update({
            groupName: self.state.groupName
        }).then(function() {
            self.closeWindow();
        });
    }

    handleKeyInput(e: React.KeyboardEvent<HTMLInputElement>) {
        let action = (e.target as HTMLInputElement).dataset.action;
        if (e.key === 'Enter') {
            if (action === 'add-student') {
                this.addStudent();
            } else if (action === 'add-group') {
                this.addGroup();
            } else if (action === 'update-student') {
                this.updateStudent();
            } else if (action === 'update-group') {
                this.updateGroup();
            }
        }
    }

    logout = (e) => {
        const self = this;
        firebase.auth().signOut().then(function() {
            self.props.store.setmode(0);
            self.props.store.setIsSignedIn(false);
        }).catch(function(err: Error) {
            console.log(err.message);
        });
    }

    render() {
        return (
            <div>
                <div style={this.state.outerDivStyle}>
                    <table className="register-button">
                        <tbody>
                            <tr>
                                <td>
                                    <button 
                                        className="student-button add-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    > 
                                        Add Student
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button remove-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    >
                                        Remove Student
                                    </button>
                                </td>
                                <td>
                                    <button 
                                        className="student-button update-student" 
                                        type="text" 
                                        onClick={this.handleBlur}
                                    >
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
                                <td>
                                    <button
                                        className="student-button"
                                        type="text"
                                        onClick={this.logout}
                                    >
                                        Logout
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table className="student-table" onClick={this.checkSelection}>
                        <tbody>
                            <tr className="student-table-tr">
                                <th>Students</th>
                            </tr>
                            {this.state.tableCellsArray}
                            <tr className="group-table-tr">
                                <th>Groups</th>
                            </tr>
                            {this.state.groupCellsArray}
                        </tbody>
                    </table>
                </div>
                <div className="generic-register-div" hidden={this.state.isRegisterHidden} >
                    Student Initials: 
                    &nbsp;
                    <input 
                        type="text" 
                        name="studentInitials" 
                        value={this.state.studentInitials}
                        onChange={this.handleInput} 
                        placeholder="Student Initials" 
                        onKeyDown={this.handleKeyInput}
                        data-action={'add-student'}
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
                        onKeyDown={this.handleKeyInput}
                        data-action={'update-student'}
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
                    &nbsp;
                    <input 
                        type="text" 
                        name="groupName" 
                        value={this.state.groupName}
                        onChange={this.handleInput} 
                        placeholder="Group Name"
                        onKeyDown={this.handleKeyInput}
                        data-action={'add-group'}
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
                        <button 
                            className="nested-register-button remove-group-button" 
                            type="button" 
                            onClick={this.removeGroup}
                        > 
                            Yes
                        </button>

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
                        onKeyDown={this.handleKeyInput}
                        data-action={'update-group'}

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
import pyrebase
import sqlite3

# Firebase configuration
config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)


# References to database paths
# finishReadingRef = firebase.database().child('events/finishReading')
# pageNumberRef = firebase.database().child('events/pageNumber')
# responseRef = firebase.database().child('events/response')
# startReadingRef = firebase.database().child('events/turnPage')
# turnPageRef = firebase.database().child('events/turnPage')
#
# adminRef = firebase.database().child('admin')
# admin_dataRef = firebase.database().child('admin_data')
# private_studentsRef = firebase.database().child('private_students')
# private_userRef = firebase.database().child('private_user')

# SQLITE3
conn = sqlite3.connect('backup.db').cursor();


def get_firebase_ref(path):
    return firebase.database().child(path)


def construct_database():
    """Constructs the THSR database locally"""
    conn.execute('''CREATE TABLE IF NOT EXISTS finishReading
                    (book BLOB, date BLOB, teacherID BLOB, studentID BLOB)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS startReading
                    (book BLOB, date BLOB, teacherID BLOB, studentID BLOB)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS pageNumber
                    (book BLOB, date BLOB, teacherID BLOB, studentID BLOB, page INTEGER)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS response
                    (book BLOB, date BLOB, teacherID BLOB, studentID BLOB, response BLOB)''')
    conn.execute('''CREATE TABLE IF NOT EXISTS turnPage
                    (book BLOB, date BLOB, teacherID BLOB, studentID BLOB)''')
    return


def destroy_database():
    """Wipes the THSR database locally"""
    conn.execute("DROP TABLE IF EXISTS finishReading")
    conn.execute("DROP TABLE IF EXISTS startReading")
    conn.execute("DROP TABLE IF EXISTS pageNumber")
    conn.execute("DROP TABLE IF EXISTS response")
    conn.execute("DROP TABLE IF EXISTS turnPage")
    return


def restart_database():
    """Restarts the database by first deleting it then constructing it again"""
    destroy_database()
    construct_database()
    return


def backup():
    # finishReading
    for ref in get_firebase_ref('events/finishReading').get().each():
        refObj = ref.val()
        refObjProperties = (refObj['book'], refObj['date'], refObj['teacherID'], refObj['studentID'])
        conn.execute('INSERT INTO finishReading (book, date, teacherID, studentID) VALUES (?,?,?,?)', refObjProperties)
    for row in conn.execute("SELECT * FROM finishReading"):
        print(row)

    print()

    # startReading
    for ref in get_firebase_ref('events/startReading').get().each():
        refObj = ref.val()
        refObjProperties = (refObj['book'], refObj['date'], refObj['teacherID'], refObj['studentID'])
        conn.execute("INSERT INTO startReading (book, date, teacherID, studentID) VALUES (?,?,?,?)", refObjProperties)
    for row in conn.execute("SELECT * FROM startReading"):
        print(row)

    print()

    # pageNumber
    for ref in get_firebase_ref('events/pageNumber').get().each():
        refObj = ref.val()
        refObjProperties = (refObj['book'], refObj['date'], refObj['teacherID'], refObj['studentID'], refObj['page'])
        conn.execute("INSERT INTO pageNumber (book, date, teacherID, studentID, page) VALUES (?,?,?,?,?)", refObjProperties)
    for row in conn.execute("SELECT * FROM pageNumber"):
        print(row)

    print()

    # response
    for ref in get_firebase_ref('events/response').get().each():
        refObj = ref.val()
        refObjProperties = (refObj['book'], refObj['date'], refObj['teacherID'], refObj['studentID'], refObj['response'])
        conn.execute("INSERT INTO response (book, date, teacherID, studentID, response) VALUES (?,?,?,?,?)", refObjProperties)
    for row in conn.execute("SELECT * FROM response"):
        print(row)

    print()

    # turnPage
    for ref in get_firebase_ref('events/turnPage').get().each():
        refObj = ref.val()
        refObjProperties = (refObj['book'], refObj['date'], refObj['teacherID'], refObj['studentID'])
        conn.execute("INSERT INTO turnPage (book, date, teacherID, studentID) VALUES (?,?,?,?)", refObjProperties)
    for row in conn.execute("SELECT * FROM turnPage"):
        print(row)

    return
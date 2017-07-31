import pyrebase
import json
import csv

config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)


def get_firebase_ref(path):
    """Obtains reference to firebase database path"""
    return firebase.database().child(path)


def backup():
    """Backs up the database in JSON format"""
    with open('backup.json', 'w') as s:
        json.dump(get_firebase_ref('/').get().val(), s)
    return


def export_csv():
    """Exports a spreadsheet of database in CSV format"""
    start_reading = []
    finish_reading = []
    page_number = []
    response = []
    turn_page = []
    admin = []
    students = []
    for ref in get_firebase_ref('events/startReading').get().each():
        refObj = ref.val()
        start_reading.append([refObj['teacherID'], refObj['studentID'], refObj['date'], refObj['book']])

    for ref in get_firebase_ref('events/finishReading').get().each():
        refObj = ref.val()
        finish_reading.append([refObj['teacherID'], refObj['studentID'], refObj['date'], refObj['book']])

    for ref in get_firebase_ref('events/pageNumber').get().each():
        refObj = ref.val()
        page_number.append([refObj['teacherID'], refObj['studentID'], refObj['date'], refObj['book'], refObj['page']])

    for ref in get_firebase_ref('events/response').get().each():
        refObj = ref.val()
        response.append([refObj['teacherID'], refObj['studentID'], refObj['date'], refObj['book'], refObj['response']])

    for ref in get_firebase_ref('events/turnPage').get().each():
        refObj = ref.val()
        turn_page.append([refObj['teacherID'], refObj['studentID'], refObj['date'], refObj['book']])

    for ref in get_firebase_ref('users/admin').get().each():
        refObj = ref.val();
        admin.append([ref.key(), refObj['email']])

    for ref in get_firebase_ref('users/private_students').get().each():
        refObj = ref.val()
        for key, value in refObj.items():
            students.append([ref.key(), key, value['studentInitials']])

    def get_array(reference, index):
        arr = []
        for x in range(0, len(reference)):
            arr.append(reference[x][index])
        return arr

    def extend_array(reference, extension):
        reference.extend(extension)
        return reference

    def write_csv():
        with open('test.csv', 'w', newline='') as csvfile:
            fw = csv.writer(csvfile, delimiter=',')
            fw.writerow(['startReading'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(start_reading, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(start_reading, 1)))
            fw.writerow(extend_array(['', 'date'], get_array(start_reading, 2)))
            fw.writerow(extend_array(['', 'book'], get_array(start_reading, 3)))
            fw.writerow([])
            fw.writerow(['finishReading'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(finish_reading, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(finish_reading, 1)))
            fw.writerow(extend_array(['', 'date'], get_array(finish_reading, 2)))
            fw.writerow(extend_array(['', 'book'], get_array(finish_reading, 3)))
            fw.writerow([])
            fw.writerow(['response'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(response, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(response, 1)))
            fw.writerow(extend_array(['', 'date'], get_array(response, 2)))
            fw.writerow(extend_array(['', 'book'], get_array(response, 3)))
            fw.writerow(extend_array(['', 'response'], get_array(response, 4)))
            fw.writerow([])
            fw.writerow(['pageNumber'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(page_number, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(page_number, 1)))
            fw.writerow(extend_array(['', 'date'], get_array(page_number, 2)))
            fw.writerow(extend_array(['', 'book'], get_array(page_number, 3)))
            fw.writerow(extend_array(['', 'page'], get_array(page_number, 4)))
            fw.writerow([])
            fw.writerow(['turnPage'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(turn_page, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(turn_page, 1)))
            fw.writerow(extend_array(['', 'date'], get_array(turn_page, 2)))
            fw.writerow(extend_array(['', 'book'], get_array(turn_page, 3)))
            fw.writerow([])
            fw.writerow(['users'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(admin, 0)))
            fw.writerow(extend_array(['', 'email'], get_array(admin, 1)))
            fw.writerow([])
            fw.writerow(['students'])
            fw.writerow(extend_array(['', 'teacherID'], get_array(students, 0)))
            fw.writerow(extend_array(['', 'studentID'], get_array(students, 1)))
            fw.writerow(extend_array(['', 'studentInitials'], get_array(students, 2)))
        return
    write_csv()
    return

export_csv()

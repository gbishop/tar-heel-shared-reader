import pyrebase
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
    """Obtains reference to Firebase database path"""
    return firebase.database().child(path)


def export_csv():
    """Exports database events as a CSV file"""
    with open('test.csv', 'w', newline='') as csvfile:
        fw = csv.writer(csvfile, delimiter=',')
        fw.writerow(['Events'])
        for ref in get_firebase_ref('events').order_by_key().get().each():
            try:
                refObj = ref.val()
                fw.writerow([refObj['date'], refObj['teacherID'], refObj['studentID'], refObj['book'], refObj['event']])
            except Exception:
                pass
        return
    return

export_csv()
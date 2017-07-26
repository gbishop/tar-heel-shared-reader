import pyrebase

config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)


def get_firebase_ref(path):
    return firebase.database().child(path)


def test_json():
    ref = get_firebase_ref('/').get()
    print(ref.val())
    return


test_json()
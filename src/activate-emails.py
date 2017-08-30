import pyrebase
import json

config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)

activated_emails = []


def set_activated_emails():
    global activated_emails
    with open('emails.json') as data_file:
        data = json.load(data_file)
        activated_emails = data['emails']
    return


def get_firebase_ref(path):
    """Obtains reference to Firebase database path"""
    return firebase.database().child(path)


def activate_emails():
    set_activated_emails()
    database_emails = []
    matched_emails = []
    try:
        for ref in get_firebase_ref('users/admin_data').get().each():
            ref_obj = ref.val()
            database_emails.append([ref_obj['uid'], ref_obj['email']])
    except Exception:
        pass

    for x in range(0, len(activated_emails)):
        for y in range(0, len(database_emails)):
            if database_emails[y][1] == activated_emails[x]:
                matched_emails.append(database_emails[y])

    for i in range(0, len(matched_emails)):
        uid = matched_emails[i][0]
        email = matched_emails[i][1]
        get_firebase_ref('users/admin/' + uid).set({"email": email, "active": True})

    return

activate_emails()

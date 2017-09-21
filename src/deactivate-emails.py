import json
import pyrebase 

# Initialize Firebase
config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}
firebase = pyrebase.initialize_app(config)

with open('deactivated-emails.json') as data_file:
    data = json.load(data_file)
    deactivated_emails = data['emails']

    for user in firebase.database().child('/users/admin/').get().each():
        uid = user.key()
        val = user.val()
        if (val['email'] in deactivated_emails):
            firebase.database().child('/users/admin/' + uid).remove()
            firebase.database().child('/users/private_students/' + uid).remove()
            firebase.database().child('/users/private_groups/' + uid).remove()
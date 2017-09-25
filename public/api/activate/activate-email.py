from bottle import Bottle, hook, route, response, run, request
import json

# Activates an email if the email is in emails.json

# Initialize Firebase
config = {
    'apiKey': 'AIzaSyCRHcXYbVB_eJn9Dd0BQ7whxyS2at6rkGc',
    'authDomain': 'tarheelsharedreader-9f793.firebaseapp.com',
    'databaseURL': 'https://tarheelsharedreader-9f793.firebaseio.com',
    'storageBucket': 'tarheelsharedreader-9f793.appspot.com',
    'serviceAccount': 'credentials.json'
}

# Initialize Bottle.py
app = application = Bottle()

# Global variables
teacherID = ''
email = ''
verifiedEmails = []

def getFirebaseRef(path):
    """Obtains reference to Firebase database path"""
    import pyrebase
    firebase = pyrebase.initialize_app(config)
    return firebase.database().child(path)


@app.hook('after_request')
def enable_cors():
    """Enable CORS on Bottle.py"""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Origin, Accept, Content-Type, X-Requested-With'
        
@app.route('/activate', method='OPTIONS')
def activate():
    active = False
    """Send an activation request"""
    return {}

@app.route('/activate', method='POST')
def activate():
    """Send an activation request"""
    teacherID = request.json['teacherID']
    email = request.json['email']
    active = False
    
    with open('emails.json') as data_file:
        data = json.load(data_file)
        verifiedEmails = data['emails']
        if email in verifiedEmails:
            active = True
            getFirebaseRef('/users/admin/' + teacherID).set({'email': email, 'active': True})

    return {'active': active}

#run(app, host='localhost', port=8080)

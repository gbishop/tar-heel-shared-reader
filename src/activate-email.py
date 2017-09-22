from bottle import Bottle, hook, route, response, run, request
import pyrebase
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
firebase = pyrebase.initialize_app(config)

# Initialize Bottle.py
app = Bottle()

# Global variables
teacherID = ''
email = ''
verifiedEmails = []

def getFirebaseRef(path):
    """Obtains reference to Firebase database path"""
    return firebase.database().child(path)


@app.hook('after_request')
def enable_cors():
    """Enable CORS on Bottle.py"""
    response.headers['Access-Control-Allow-Origin'] = '*';
    response.headers['Access-Control-Allow-Methods'] = 'PUT, GET, POST, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Origin, Accept, Content-Type, X-Requested-With'
        
@app.route('/activate', method=['OPTIONS', 'POST'])
def activate():
    active = False
    """Send an activation request"""
    if request.method == 'OPTIONS':
        return {}
    else:
        try:
            teacherID = request.json['teacherID']
            email = request.json['email']

            if type(teacherID) is not str or type(email) is not str:
                response.status = 400
                response.content_type = 'application/json'
                return json.dumps('One or more JSON values were not of type string.')
        except KeyError:
            response.status = 500
            response.content_type = 'application/json'
            return json.dumps('The requested key(s) does not exist in supplied json file.')
        
        with open('emails.json') as data_file:
            data = json.load(data_file)
            verifiedEmails = data['emails']
            if email in verifiedEmails:
                active = True
                getFirebaseRef('/users/admin/' + teacherID).set({'email': email, 'active': True})
    
        message
        if active:
            message = 'The user was activated.'
        else:
            message = 'The user was not activated.'
    
        response.status = 200
        response.content_type = 'application/json'
        return {'active': active}

run(app, host='localhost', port=8080)
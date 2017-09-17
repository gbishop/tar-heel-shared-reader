from bottle import Bottle, hook, route, response, run, request

app = Bottle()

# Allow cross origin testing
@app.hook('after_request')
def enable_cors():
    """Enable CORS on Bottle.py"""
    response.headers['Access-Control-Allow-Origin'] = '*';
    response.headers['Access-Control-Allow-Methods'] = 'PUT, GET, POST, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Authorization, Origin, Accept, Content-Type, X-Requested-With'

@app.route('/hello', method=['OPTIONS', 'GET'])
def hello():
    if request.method == 'OPTIONS':
        print('An options request was sent')
        return {}
    else: 
        return {
            'id': 410
        }
        
run(app, host='localhost', port=8080)
#!/usr/bin/python3
'''
A simple db for Tar Heel Shared Reader
'''

import bottle
from bottle import Bottle, request, response
from datetime import datetime
from db import with_db
import os.path as osp
import json

app = application = Bottle()

# enable debugging
bottle.debug(True)

# cookie signing
secret = 'Salt and light'


def static_path(filename):
    '''
    Produce the path to a static file
    '''
    p = osp.join('./static', filename)
    m = osp.getmtime(p)
    s = '%x' % int(m)
    u = app.get_url('static', filename=filename)
    return u + '?' + s


bottle.SimpleTemplate.defaults['static'] = static_path


@app.route('/static/<filename:path>', name='static')
def static(filename):
    '''
    Serve static files in development
    '''
    return bottle.static_file(filename, root='./static')


# simple minded security
def user_is_known(username, password=None):
    '''The user has logged in'''
    return username


def user_is_admin(username, password=None):
    '''The user is authorized'''
    return username in ['gb']


def user_is_me(username, password=None):
    '''The user is admin'''
    return username == 'gb'


def get_user():
    user = request.get_cookie('user', secret=secret)
    return user


def set_user(user):
    response.set_cookie('user', user, secret=secret)


def auth(check):
    '''decorator to apply above functions for auth'''
    def decorator(function):
        def wrapper(*args, **kwargs):
            user = get_user()
            if not user:
                path = app.get_url('root') + request.path[1:]
                bottle.redirect(app.get_url('login') + '?path=' + path)
            elif not check(user):
                raise bottle.HTTPError(403, 'Forbidden')
            return function(*args, **kwargs)
        return wrapper
    return decorator


def allow_json(func):
    ''' Decorator: renders as json if requested '''
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        if ('application/json' in request.header.get('Accept') and
                isinstance(result, dict)):
            return bottle.HTTPResponse(result)
        return result
    return wrapper


def eprint(*args, **kwargs):
    from time import time
    import sys
    global t0
    if t0 is None:
        t0 = time()
    print(time() - t0, *args, file=sys.stderr, **kwargs)
    sys.stderr.flush()


@app.route('/students')
@with_db
def students(db):
    '''
    return a list of student ids
    '''
    result = db.execute('''
        select distinct student from log
          where teacher = ?
    ''', [request.query.get('teacher')]).fetchall()
    return {'students': result}


@app.route('/students', method='POST')
@with_db
def addStudent(db):
    '''
    Add a students for this teacher
    '''
    data = request.json
    teacher, student = data['teacher'], data['student']
    db.execute('''
        insert into log
            (time, teacher, student, action) values (?, ?, ?, 'add')
    ''', [datetime.now(), teacher, student]).fetchall()
    return 'ok'


@app.route('/books')
@with_db
def getBooksIndex(db):
    '''
    List all books
    '''
    results = db.execute('''
        select title, author, pages, slug, level, image, id from sharedbooks
    ''').fetchall()
    return {'results': [{
        'title': r[0],
        'author': r[1],
        'pages': r[2],
        'slug': r[3],
        'level': r[4],
        'image': r[5],
        'id': r[6]
    } for r in results]}


@app.route('/books/:id')
@with_db
def getBook(db, id):
    '''
    Return json for a book
    '''
    result = db.execute('''
        select json from sharedbooks where id = ?
    ''', [id]).fetchone()
    book = json.loads(result[0])
    return book


@app.route('/log', method='POST')
@with_db
def log(db):
    '''
    Add a record to the log
    '''
    d = request.json
    db.execute('''
        insert into log
            (time, teacher, student, book, reading, page, action) values
            (?, ?, ?, ?, ?, ?, ?)
    ''', [datetime.now(), d['teacher'], d['student'], d['book'], d['reading'],
          d['page'], d.get('response')]).fetchall()
    return 'ok'


class StripPathMiddleware(object):
    '''
    Get that slash out of the request
    '''
    def __init__(self, a):
        self.a = a

    def __call__(self, e, h):
        e['PATH_INFO'] = e['PATH_INFO'].rstrip('/')
        return self.a(e, h)


if __name__ == '__main__':
    bottle.run(
        app=StripPathMiddleware(app),
        reloader=True,
        debug=True,
        host='localhost',
        port=5500)

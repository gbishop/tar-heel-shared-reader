'''
db wrapper for shared reader
'''
import sqlite3
import contextlib
import os
import urllib.request
import json

try:
    import uwsgi  # noqa: F401
    if '-dev' in os.getcwd():
        print('Dev')
        DBNAME = '/var/local/thsr-dev/thsr.db'
    else:
        print('Production')
        DBNAME = '/var/local/thsr/thsr.db'
except ImportError:
    print('Testing')
    DBNAME = '/var/tmp/thsr.db'

DBFLAGS = sqlite3.PARSE_COLNAMES | sqlite3.PARSE_DECLTYPES


# a decorator to manage db access
def with_db(func):
    '''Add an extra argument with a database connection'''
    def func_wrapper(*args, **kwargs):
        with contextlib.closing(sqlite3.connect(DBNAME,
                                detect_types=DBFLAGS)) as db:
            result = func(*args, **dict(kwargs, db=db))
            db.commit()
            return result
    return func_wrapper


@with_db
def createTables(db):
    # log activity
    db.execute('''create table if not exists log
        (id integer primary key,
         time timestamp,
         teacher text,
         student text,
         book text,
         reading integer,
         page integer,
         action text)''')

    # shared books
    db.execute('''create table if not exists sharedbooks
        (id integer primary key,
         slug text,         -- slug of the THR book
         version integer,   -- version number
         title text,
         author text,       -- author of the original book
         image text,
         level text,
         owner text,        -- author of the shared comments
         pages integer,
         json text          -- book content
         )''')


@with_db
def loadTables(db):
    URL = 'https://shared.tarheelreader.org/api/sharedbooks/'
    count = db.execute('''
        select count(*) from sharedbooks
    ''').fetchone()
    if count[0] == 0:
        r = urllib.request.urlopen(URL + 'index.json').read()
        index = json.loads(r.decode('utf-8'))
        for sbi in index:
            fp = urllib.request.urlopen(URL + sbi['slug'] + '.json')
            d = fp.read().decode('utf-8')
            b = json.loads(d)
            b['level'] = b['sheet']
            del b['sheet']
            b['owner'] = ''
            b['version'] = 1
            db.execute('''
                insert into sharedbooks
                (title, author, owner, pages, slug, version, level, image,
                 json)
                values (?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                [b['title'], b['author'], '', sbi['pages'], b['slug'], 1,
                 sbi['sheet'], sbi['cover']['url'], json.dumps(b)])


createTables()
loadTables()

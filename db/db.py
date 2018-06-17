'''
db wrapper for shared reader
'''
import sqlite3
import contextlib
import os

try:
    import uwsgi  # noqa: F401
    if '-dev' in os.getcwd():
        print('Dev')
        DBNAME = '/var/local/thsr-dev/poll.db'
    else:
        print('Production')
        DBNAME = '/var/local/thsr/poll.db'
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
         owner text,        -- author of the shared comments
         json text          -- book content
         )''')


createTables()

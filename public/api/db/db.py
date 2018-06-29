'''
db wrapper for shared reader
'''
import sqlite3
import contextlib
import os
import urllib.request
import json
from datetime import datetime

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


def dict_factory(cursor, row):
    '''Return a dict for each row'''
    return {col[0]: row[idx] for idx, col in enumerate(cursor.description)}


# a decorator to manage db access
def with_db(func):
    '''Add an extra argument with a database connection'''
    def func_wrapper(*args, **kwargs):
        with contextlib.closing(sqlite3.connect(DBNAME,
                                detect_types=DBFLAGS)) as db:
            db.row_factory = dict_factory
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
         contentid integer,
         reading integer,
         page integer,
         action text,
         foreign key(contentid) references content(id))''')

    # shared books
    # not modified after creation
    db.execute('''create table if not exists content
        (id integer primary key,
         time timestamp,      -- when created
         parent contentid,    -- index of content this replaces
         content text         -- book content json encoded
        )''')

    # map from slug to book content
    db.execute('''create table if not exists map
        (id integer primary key,
         slug text unique,          -- same as THR slug except for dups
         status text,               -- published or draft
         owner text,                -- teacher who created
         contentid integer,         -- index of the content
         foreign key(contentid) references content(id)
        )''')


@with_db
def loadTables(db):
    URL = 'https://shared.tarheelreader.org/api/sharedbooks/'
    count = db.execute('''
        select count(*) from map
    ''').fetchone()
    if count['count(*)'] == 0:
        r = urllib.request.urlopen(URL + 'index.json').read()
        index = json.loads(r.decode('utf-8'))
        for sbi in index:
            fp = urllib.request.urlopen(URL + sbi['slug'] + '.json')
            d = fp.read().decode('utf-8')
            b = json.loads(d)
            b['level'] = b['sheet']
            del b['sheet']
            try:
                for p, page in enumerate(b['pages']):
                    page['comments'] = [reading['comments'][p]
                                        for reading in b['readings']]
            except IndexError:
                print('skip', b['slug'])
                continue
            del b['readings']
            c = db.execute('''
                insert into content (time, content) values (?, ?)''',
                [datetime.now(), json.dumps(b)])
            contentid = c.lastrowid
            db.execute('''
                insert into map
                  (slug, status, owner, contentid) values (?, ?, ?, ?)''',
                [b['slug'], 'published', 'clds', contentid])


createTables()
loadTables()

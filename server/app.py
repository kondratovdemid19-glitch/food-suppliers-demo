"""Read-only supplier catalog API and static application host."""
import json
import os
import re
import sqlite3
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlsplit
import mimetypes
from contextlib import closing

ROOT = Path(__file__).resolve().parents[1]
CATEGORIES = {'ingredients', 'ready', 'packaging'}
ALLOWED_ORIGIN = 'https://kondratovdemid19-glitch.github.io'

class BadRequest(ValueError):
    pass

def normalize(value):
    return value.lower().replace('ё', 'е').strip()

def tokens(value):
    result=[]
    for word in re.findall(r'[^\W_]+', normalize(value), re.UNICODE):
        if len(word)>4:
            word=re.sub(r'(ами|ями|ого|ему|ов|ам|ом|ах|ях|ый|ий|ая|ые|ое|ой|ку|ки|ка|ы|и|а|е|у)$','',word)
        result.append(word)
    return result

def matches(text, query):
    hay=tokens(text)
    return all(any(w.startswith(term) or term.startswith(w) for w in hay) for term in tokens(query))

class Catalog:
    def __init__(self, path=None):
        self.path=str(path or os.environ.get('CATALOG_DB', '/tmp/snabzhenie-catalog.sqlite3'))
        data=json.loads((ROOT/'data/suppliers.json').read_text())
        with closing(sqlite3.connect(self.path)) as db:
            db.execute('CREATE TABLE IF NOT EXISTS suppliers (id TEXT PRIMARY KEY, payload TEXT NOT NULL, search_text TEXT NOT NULL)')
            db.execute('DELETE FROM suppliers')
            labels={'ingredients':'ингредиенты','ready':'готовая продукция','packaging':'упаковка'}
            db.executemany('INSERT INTO suppliers VALUES (?, ?, ?)',[(s['id'],json.dumps(s,ensure_ascii=False),s['name']+' '+s['description']+' '+' '.join(labels[c] for c in s['categories'])) for s in data])
            db.commit()
    def search(self, params):
        if set(params)-{'q','category','region','limit'}: raise BadRequest('Неизвестный параметр поиска')
        q=params.get('q','').strip()
        category=params.get('category','')
        region=normalize(params.get('region',''))
        if len(q)>200 or len(region)>100: raise BadRequest('Слишком длинный запрос')
        if category and category not in CATEGORIES: raise BadRequest('Неизвестная категория')
        try: limit=int(params.get('limit','50'))
        except (ValueError,TypeError): raise BadRequest('Некорректный лимит')
        if not 1<=limit<=50: raise BadRequest('Лимит должен быть от 1 до 50')
        db=sqlite3.connect(self.path)
        try:
            db.create_function('matches',2,matches,deterministic=True)
            db.create_function('in_category',2,lambda data,c:not c or c in json.loads(data)['categories'],deterministic=True)
            db.create_function('in_region',2,lambda data,r:not r or any(r in normalize(v) for v in json.loads(data)['regions']),deterministic=True)
            rows=db.execute('SELECT payload FROM suppliers WHERE matches(search_text, ?) AND in_category(payload, ?) AND in_region(payload, ?) ORDER BY id LIMIT ?', (q,category,region,limit)).fetchall()
            return [json.loads(row[0]) for row in rows]
        finally: db.close()

class Handler(BaseHTTPRequestHandler):
    catalog=None
    def end_headers(self):
        self.send_header('X-Content-Type-Options','nosniff')
        self.send_header('Referrer-Policy','strict-origin-when-cross-origin')
        self.send_header('Access-Control-Allow-Origin',ALLOWED_ORIGIN)
        super().end_headers()
    def json_response(self, code, payload):
        body=json.dumps(payload,ensure_ascii=False).encode()
        self.send_response(code)
        self.send_header('Content-Type','application/json; charset=utf-8')
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-cache')
        self.end_headers()
        self.wfile.write(body)
    def do_GET(self):
        route=urlsplit(self.path)
        if route.path=='/api/health':
            return self.json_response(200,{'status':'ok','suppliers':len(self.catalog.search({}))})
        if route.path=='/api/suppliers':
            if len(route.query)>2000: return self.json_response(400,{'error':'Слишком длинный запрос'})
            values=parse_qs(route.query,keep_blank_values=True)
            if any(len(v)!=1 for v in values.values()): return self.json_response(400,{'error':'Повторяющийся параметр'})
            try:
                rows=self.catalog.search({k:v[0] for k,v in values.items()})
                return self.json_response(200,{'suppliers':rows,'count':len(rows),'mode':'Официальные источники · Python / SQLite'})
            except BadRequest as exc: return self.json_response(400,{'error':str(exc)})
            except sqlite3.Error: return self.json_response(503,{'error':'Каталог временно недоступен'})
        path=unquote(route.path)
        if path.startswith('/food-suppliers-demo/'):
            path=path[len('/food-suppliers-demo/'):]
        file=(ROOT/'dist'/path.lstrip('/')).resolve()
        if not file.is_relative_to((ROOT/'dist').resolve()): return self.json_response(404,{'error':'Не найдено'})
        if file.is_dir(): file=file/'index.html'
        if not file.is_file(): return self.json_response(404,{'error':'Не найдено'})
        body=file.read_bytes()
        self.send_response(200)
        self.send_header('Content-Type',mimetypes.guess_type(str(file))[0] or 'application/octet-stream')
        self.send_header('Content-Length',str(len(body)))
        self.send_header('Cache-Control','no-cache' if file.suffix=='.html' else 'public, max-age=3600')
        self.end_headers()
        self.wfile.write(body)
    def do_POST(self):
        self.json_response(405,{'error':'Каталог доступен только для чтения'})
    def log_message(self, fmt, *args):
        sys.stderr.write('%s %s\n' % (self.command,urlsplit(self.path).path))

def run():
    Handler.catalog=Catalog()
    server=ThreadingHTTPServer(('0.0.0.0',int(os.environ.get('PORT','5198'))),Handler)
    print('Catalog server ready',flush=True)
    server.serve_forever()

if __name__=='__main__': run()

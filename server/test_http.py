import json
import tempfile
import threading
import unittest
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import HTTPError
from http.server import ThreadingHTTPServer
from server.app import Handler, Catalog

class HTTPTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp=tempfile.TemporaryDirectory()
        Handler.catalog=Catalog(Path(cls.tmp.name)/'catalog.db')
        cls.server=ThreadingHTTPServer(('127.0.0.1',0),Handler)
        cls.thread=threading.Thread(target=cls.server.serve_forever,daemon=True)
        cls.thread.start()
        cls.base='http://127.0.0.1:'+str(cls.server.server_port)
    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown();cls.server.server_close();cls.tmp.cleanup()
    def test_health(self):
        with urlopen(self.base+'/api/health') as response:
            self.assertEqual(json.load(response),{'status':'ok','suppliers':6})
    def test_category(self):
        with urlopen(self.base+'/api/suppliers?category=packaging') as response:
            self.assertEqual(len(json.load(response)['suppliers']),2)
            self.assertEqual(response.headers['X-Content-Type-Options'],'nosniff')
    def test_invalid_category(self):
        with self.assertRaises(HTTPError) as error: urlopen(self.base+'/api/suppliers?category=nope')
        self.assertEqual(error.exception.code,400)
    def test_repeated_parameter(self):
        with self.assertRaises(HTTPError) as error: urlopen(self.base+'/api/suppliers?category=ready&category=packaging')
        self.assertEqual(error.exception.code,400)
    def test_no_mutation_endpoint(self):
        with self.assertRaises(HTTPError) as error: urlopen(Request(self.base+'/api/suppliers',data=b'{}',headers={'Content-Type':'application/json'}))
        self.assertEqual(error.exception.code,405)
    def test_path_escape(self):
        with self.assertRaises(HTTPError) as error: urlopen(self.base+'/%2e%2e/data/suppliers.json')
        self.assertEqual(error.exception.code,404)

if __name__=='__main__': unittest.main()

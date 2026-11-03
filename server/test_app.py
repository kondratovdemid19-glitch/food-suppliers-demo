import json
import tempfile
import unittest
from pathlib import Path
from server.app import Catalog, BadRequest

class CatalogTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.catalog = Catalog(Path(self.tmp.name) / 'catalog.db')
    def tearDown(self):
        self.tmp.cleanup()
    def test_sources_are_preserved(self):
        rows=self.catalog.search({})
        self.assertEqual(len(rows),6)
        self.assertTrue(all(row['sources'] and row['checkedAt'] for row in rows))
    def test_category_and_city_intersection(self):
        self.assertEqual([r['id'] for r in self.catalog.search({'category':'packaging','region':'Новосибирск'})], ['komus'])
    def test_unknown_region_does_not_mean_delivery(self):
        self.assertEqual(self.catalog.search({'category':'ready','region':'Новосибирск'}),[])
    def test_russian_product_inflection(self):
        self.assertIn('puratos',[r['id'] for r in self.catalog.search({'q':'закваска'})])
    def test_sql_input_is_not_executed(self):
        self.assertEqual(self.catalog.search({'q':"' OR 1=1 --"}),[])
        self.assertEqual(len(self.catalog.search({})),6)
    def test_invalid_filters(self):
        for params in [{'category':'other'},{'q':'a'*201},{'region':'a'*101},{'limit':'100000'}]:
            with self.assertRaises(BadRequest): self.catalog.search(params)
    def test_seed_is_repeatable(self):
        self.catalog = Catalog(Path(self.tmp.name) / 'catalog.db')
        self.assertEqual(len(self.catalog.search({})),6)

if __name__ == '__main__': unittest.main()

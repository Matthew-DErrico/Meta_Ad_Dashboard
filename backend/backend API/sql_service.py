import sqlite3

class SQLiteService:

    def get_connection(self):
        return sqlite3.connect("..\\temporary database\\demo_ads.db")

    def run_query(self, query, params=None):
        conn = self.get_connection()
        cur = conn.cursor()

        cur.execute(query, params or {})
        rows = cur.fetchall()

        conn.close()
        return rows
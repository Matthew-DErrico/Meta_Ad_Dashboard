import sqlite3
from settings import SQLITE_DB_PATH


# Database Connection and Query Service for SQLite (temporary solution until Snowflake is configured)
class SQLiteService:

    def get_connection(self):
        return sqlite3.connect(SQLITE_DB_PATH)

    def run_query(self, query: str, params=None):
        conn = self.get_connection()
        cur = conn.cursor()

        try:
            cur.execute(query, params or {})
            rows = cur.fetchall()
            return rows
        finally:
            cur.close()
            conn.close()
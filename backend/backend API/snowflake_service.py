import snowflake.connector
from settings import SNOWFLAKE_CONFIG

class SnowflakeService:

    def get_connection(self):
        return snowflake.connector.connect(**SNOWFLAKE_CONFIG)

    def run_query(self, query: str):
        conn = self.get_connection()
        cur = conn.cursor()

        try:
            cur.execute(query)
            rows = cur.fetchall()
            return rows
        finally:
            cur.close()
            conn.close()

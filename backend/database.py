import os

from dotenv import load_dotenv

from config import DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER

load_dotenv()


def get_db_connection():
    try:
        import psycopg2
    except ModuleNotFoundError:
        try:
            import psycopg
        except ModuleNotFoundError as exc:
            raise RuntimeError("Install psycopg[binary] to connect to PostgreSQL") from exc

        return psycopg.connect(
            host=os.getenv("DB_HOST") or DB_HOST,
            port=os.getenv("DB_PORT") or DB_PORT,
            dbname=os.getenv("DB_NAME") or DB_NAME,
            user=os.getenv("DB_USER") or DB_USER,
            password=os.getenv("DB_PASSWORD") or DB_PASSWORD,
        )

    connection = psycopg2.connect(
        host=os.getenv("DB_HOST") or DB_HOST,
        port=os.getenv("DB_PORT") or DB_PORT,
        database=os.getenv("DB_NAME") or DB_NAME,
        user=os.getenv("DB_USER") or DB_USER,
        password=os.getenv("DB_PASSWORD") or DB_PASSWORD,
    )
    return connection


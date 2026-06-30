import os

from dotenv import load_dotenv

load_dotenv()


def _db_config():
    return {
        "host": os.getenv("DB_HOST"),
        "port": os.getenv("DB_PORT", "5432"),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
        "sslmode": os.getenv("DB_SSLMODE", "prefer"),
    }


def get_db_connection():
    config = _db_config()

    try:
        import psycopg2
    except ModuleNotFoundError:
        try:
            import psycopg
        except ModuleNotFoundError as exc:
            raise RuntimeError("Install psycopg[binary] to connect to PostgreSQL") from exc

        return psycopg.connect(
            host=config["host"],
            port=config["port"],
            dbname=config["database"],
            user=config["user"],
            password=config["password"],
            sslmode=config["sslmode"],
        )

    connection = psycopg2.connect(
        host=config["host"],
        port=config["port"],
        database=config["database"],
        user=config["user"],
        password=config["password"],
        sslmode=config["sslmode"],
    )
    return connection


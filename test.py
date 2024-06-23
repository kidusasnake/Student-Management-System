from database import connect_db

conn = connect_db()

if conn.is_connected():
    print("Connection successful 🚀")

conn.close()
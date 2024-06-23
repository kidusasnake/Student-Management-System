import mysql.connector

def connect_db():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="@Yoyo1921",
        database="student_db"
    )
    return conn
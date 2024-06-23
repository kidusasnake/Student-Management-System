from database import connect_db

# ADD STUDENT
def add_student():
    name = input("Enter name: ")
    age = input("Enter age: ")
    department = input("Enter department: ")

    conn = connect_db()
    cursor = conn.cursor()

    query = "INSERT INTO students (name, age, department) VALUES (%s, %s, %s)"
    values = (name, age, department)

    cursor.execute(query, values)
    conn.commit()

    print("Student added successfully!")

    conn.close()


# VIEW STUDENTS
def view_students():
    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students")
    rows = cursor.fetchall()

    print("\n--- Student List ---")
    for row in rows:
        print(row)

    conn.close()


# DELETE STUDENT
def delete_student():
    student_id = input("Enter student ID to delete: ")

    conn = connect_db()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
    conn.commit()

    print("Student deleted successfully!")

    conn.close()


# MENU
while True:
    print("\n===== Student Management System =====")
    print("1. Add Student")
    print("2. View Students")
    print("3. Delete Student")
    print("4. Update Student")
    print("5. Exit")

    choice = input("Choose option: ")

    if choice == "1":
        add_student()
    elif choice == "2":
        view_students()
    elif choice == "3":
        delete_student()
    elif choice == "4":
        update_student()
    elif choice == "5":
        print("Goodbye!")
        break
    else:
        print("Invalid choice!")

def update_student():
    student_id = input("Enter student ID to update: ")
    new_name = input("Enter new name: ")
    new_age = input("Enter new age: ")
    new_department = input("Enter new department: ")

    conn = connect_db()
    cursor = conn.cursor()

    query = """
    UPDATE students
    SET name=%s, age=%s, department=%s
    WHERE id=%s
    """

    cursor.execute(query, (new_name, new_age, new_department, student_id))
    conn.commit()

    print("Student updated successfully!")

    conn.close()
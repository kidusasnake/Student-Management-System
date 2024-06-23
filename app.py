from flask import Flask, render_template, request, redirect, flash, jsonify
from database import connect_db  # type: ignore

app = Flask(__name__)
app.secret_key = "sms_secret_key_2026"


# HOME PAGE - Dashboard with stats
@app.route("/")
def index():
    conn = connect_db()
    cursor = conn.cursor()

    # Fetch all students
    cursor.execute("SELECT * FROM students")
    students = cursor.fetchall()

    # Fetch stats
    cursor.execute("SELECT COUNT(*) FROM students")
    result = cursor.fetchone()
    total_students = result[0] if result else 0

    cursor.execute("SELECT COUNT(DISTINCT department) FROM students")
    result = cursor.fetchone()
    total_departments = result[0] if result else 0

    cursor.execute("SELECT AVG(age) FROM students")
    result = cursor.fetchone()
    avg_age = round(result[0]) if result and result[0] else 0

    conn.close()

    return render_template(
        "index.html",
        students=students,
        total_students=total_students,
        total_departments=total_departments,
        avg_age=avg_age,
    )


# ADD STUDENT
@app.route("/add", methods=["GET", "POST"])
def add_student():
    if request.method == "POST":
        name = request.form["name"].strip()
        age = request.form["age"]
        department = request.form["department"].strip()

        if not name or not age or not department:
            flash("All fields are required!", "error")
            return redirect("/add")

        conn = connect_db()
        cursor = conn.cursor()

        query = "INSERT INTO students (name, age, department) VALUES (%s, %s, %s)"
        cursor.execute(query, (name, age, department))

        conn.commit()
        conn.close()

        flash(f"Student '{name}' added successfully!", "success")
        return redirect("/")

    return render_template("add.html")


# EDIT STUDENT
@app.route("/edit/<int:student_id>", methods=["GET", "POST"])
def edit_student(student_id):
    conn = connect_db()
    cursor = conn.cursor()

    if request.method == "POST":
        name = request.form["name"].strip()
        age = request.form["age"]
        department = request.form["department"].strip()

        if not name or not age or not department:
            flash("All fields are required!", "error")
            return redirect(f"/edit/{student_id}")

        query = "UPDATE students SET name = %s, age = %s, department = %s WHERE id = %s"
        cursor.execute(query, (name, age, department, student_id))

        conn.commit()
        conn.close()

        flash(f"Student '{name}' updated successfully!", "success")
        return redirect("/")

    # GET - fetch student data
    cursor.execute("SELECT * FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()
    conn.close()

    if not student:
        flash("Student not found!", "error")
        return redirect("/")

    return render_template("edit.html", student=student)


# DELETE STUDENT
@app.route("/delete/<int:student_id>", methods=["POST"])
def delete_student(student_id):
    conn = connect_db()
    cursor = conn.cursor()

    # Get student name for the flash message
    cursor.execute("SELECT name FROM students WHERE id = %s", (student_id,))
    student = cursor.fetchone()

    if not student:
        flash("Student not found!", "error")
        conn.close()
        return redirect("/")

    cursor.execute("DELETE FROM students WHERE id = %s", (student_id,))
    conn.commit()
    conn.close()

    flash(f"Student '{student[0]}' deleted successfully!", "success")
    return redirect("/")


# SEARCH STUDENTS (AJAX endpoint)
@app.route("/search")
def search_students():
    query = request.args.get("q", "").strip()

    conn = connect_db()
    cursor = conn.cursor()

    if query:
        sql = "SELECT * FROM students WHERE name LIKE %s OR department LIKE %s"
        search_term = f"%{query}%"
        cursor.execute(sql, (search_term, search_term))
    else:
        cursor.execute("SELECT * FROM students")

    rows = cursor.fetchall()
    conn.close()

    students = [
        {"id": row[0], "name": row[1], "age": row[2], "department": row[3]}
        for row in rows
    ]

    return jsonify({"students": students})


if __name__ == "__main__":
    app.run(debug=True)

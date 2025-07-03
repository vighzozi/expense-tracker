from flask import Flask, request, render_template
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash

# create Flask app
app = Flask(__name__)

# connect DB
conn = psycopg2.connect(
    host="localhost",
    database="kiadas_app",
    user="postgres",
    password="admin"
)

@app.route('/')
def welcome():
    return render_template('welcome.html')

@app.route('/registration')
def registration():
    return render_template('register.html')

@app.route('/login-page')
def login_page():
    return render_template('login.html')

@app.route('/dasboard')
def index():
    return render_template('index.html')
 
@app.route('/expenses', methods=['POST'])
def add_data():
    data = request.get_json(silent=True)
    cur = conn.cursor()
    try:
        if isinstance(data, dict):
            seller = data.get('seller')
            category = data.get('category')
            amount =  data.get('amount')
            
            cur.execute(
            'INSERT INTO expenses (seller, category, amount) VALUES (%s, %s, %s)', (seller, category, amount)
            )

        elif isinstance(data, list):
            # more input
            for item in data:
                seller = item.get('seller')
                category = item.get('category')
                amount = item.get('amount')

                cur.execute(
                    'INSERT INTO expenses (seller, category, amount) VALUES (%s, %s, %s)', (seller, category, amount)
                )
        else:
            return {'ERROR: No data has been received!'}, 400
        
        conn.commit()
        cur.close()
        
        return {'message': 'Data saved successfully!'}
    except Exception as e:
        conn.rollback()
        return {'error': str(e)},500
    
@app.route('/expenses', methods=['GET'])
def get_expenses():
    curr = conn.cursor()
    curr.execute('SELECT * FROM expenses')
    rows = curr.fetchall()
    curr.close()
    
    expenses=[]
    for row in rows:
        expenses.append(
            {
                'id': row[0],
                'seller': row[1],
                'category': row[2],
                'amount': row[3],
                'created_at': row[4].isoformat()
            }
        )
    return {'expenses': expenses}, 200

@app.route('/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    data = request.get_json(silent=True)
    
    if not data:
        return {'error': 'No data has been provided'}, 400
    
    seller = data.get('seller')
    category = data.get('category')
    amount = data.get('amount')
    
    if not all([seller, category, amount]):
        return {'error': 'Missing one or more fields'}, 400
    
    cur = conn.cursor()
    cur.execute(
        '''
        UPDATE expenses
        SET seller = %s, category = %s, amount = %s
        WHERE id = %s
        ''',
        (seller, category, amount, expense_id)
    )
    conn.commit()
    cur.close()
    
    return {'message': f'Expense {expense_id} updated'}, 200


@app.route('/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    try:
        cur = conn.cursor()
        cur.execute('DELETE FROM expenses WHERE id = %s', (expense_id,))
        conn.commit()
        cur.close()
        
        return {'message': f'Expense {expense_id} has been deleted successfully!'}, 200
    except Exception as e:
        print("ERROR: ", e)
        return {"error": str(e)}, 500

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    print("Kapott adat:", data) 
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return {'ERROR: username and password required!'}, 400
    
    hashed_password = generate_password_hash(password)
    cur = conn.cursor()
    cur.execute('INSERT INTO users (username, password) VALUES (%s, %s)', (username, hashed_password))
    conn.commit()
    cur.close()
    
    return {'message': f'User {username} created successfully!'}, 201


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    if not username or not password:
        return {'ERROR: username and password required!'}, 400
    
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE username = %s', (username,))
    user = cur.fetchall()
    cur.close()
    
    if not user:
        return {'ERROR: Incorret username of password!'}, 401
    
    id, username, hashed_password = user
    
    if not check_password_hash(hashed_password, password):
        return {'ERROR: Incorrect username or password!'}, 401
    
    return {f'Welcome back {username}!'}, 200

if __name__ == '__main__':
    app.run()
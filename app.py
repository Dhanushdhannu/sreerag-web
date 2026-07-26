import os
import json
import random
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory

app = Flask(__name__, static_folder='.', template_folder='.')

# 1. LOAD PRODUCT DATABASE
PRODUCTS_FILE = os.path.join(os.path.dirname(__file__), 'products.json')
try:
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products_db = json.load(f)
except Exception as e:
    print(f"Error loading products database: {e}")
    products_db = []

# Mock order storage
orders_db = {}

# ==========================================
# STATIC FILES SERVERS
# ==========================================
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def serve_static_file(filename):
    # Prevent directory traversal attacks
    safe_path = os.path.basename(filename)
    # Check if file exists in the directory
    if os.path.exists(os.path.join(os.path.dirname(__file__), filename)):
        return send_from_directory('.', filename)
    return jsonify({"error": "File not found"}), 404

# ==========================================
# REST API ENDPOINTS
# ==========================================
@app.route('/api/products', methods=['GET'])
def get_products():
    return jsonify(products_db)

@app.route('/api/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = next((p for p in products_db if p['id'] == product_id), None)
    if product:
        return jsonify(product)
    return jsonify({"error": f"Product with ID {product_id} not found."}), 404

@app.route('/api/checkout', methods=['POST'])
def process_checkout():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Invalid request payload."}), 400

    # Extract info
    shipping = data.get('shipping', {})
    payment = data.get('payment', {})
    cart = data.get('cart', [])
    summary = data.get('summary', {})

    # Server-Side Validations
    # 1. Check Shipping fields
    required_shipping = ['firstName', 'lastName', 'address', 'city', 'zipCode', 'country']
    for field in required_shipping:
        if not shipping.get(field) or not shipping[field].strip():
            return jsonify({"error": f"Shipping field '{field}' is required."}), 400

    # 2. Check Payment fields
    required_payment = ['cardholderName', 'cardNumber', 'expiryDate', 'cvv']
    for field in required_payment:
        if not payment.get(field) or not payment[field].strip():
            return jsonify({"error": f"Payment field '{field}' is required."}), 400

    # 3. Clean Card info
    card_number = payment['cardNumber'].replace(' ', '')
    cvv = payment['cvv'].strip()
    
    if len(card_number) < 13 or len(card_number) > 19 or not card_number.isdigit():
        return jsonify({"error": "Invalid credit card number format."}), 400

    if len(cvv) < 3 or len(cvv) > 4 or not cvv.isdigit():
        return jsonify({"error": "Invalid CVV security code length."}), 400

    # 4. Check Cart items
    if not cart:
        return jsonify({"error": "Your shopping bag is empty."}), 400

    # Construct Simulated Order Invoice
    order_id = f"Noolmade-{random.randint(100000, 999999)}"
    order_date = datetime.now().strftime("%B %d, %Y")
    
    order = {
        "orderId": order_id,
        "date": order_date,
        "shippingName": f"{shipping['firstName'].strip()} {shipping['lastName'].strip()}",
        "shippingAddress": f"{shipping['address'].strip()}, {shipping['city'].strip()} {shipping['zipCode'].strip()}",
        "items": cart,
        "finalTotal": summary.get('finalTotal', '0.00')
    }

    # Store order to backend DB memory
    orders_db[order_id] = order

    return jsonify(order), 201

@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order_invoice(order_id):
    order = orders_db.get(order_id)
    if order:
        return jsonify(order)
    return jsonify({"error": f"Order invoice {order_id} not found."}), 404


if __name__ == '__main__':
    # Run the server on port 5000
    app.run(debug=True, port=5000)

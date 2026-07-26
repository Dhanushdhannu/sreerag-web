import json
import unittest
from app import app

class NoolmadeAppTestCase(unittest.TestCase):

    def setUp(self):
        # Configure Flask application for testing
        app.config['TESTING'] = True
        self.client = app.test_client()

    def test_static_index_route(self):
        """Test that the homepage is served successfully."""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'<!DOCTYPE html>', response.data)

    def test_get_products_list_api(self):
        """Test GET /api/products returns JSON list of items."""
        response = self.client.get('/api/products')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 10)  # Expecting 10 products
        self.assertEqual(data[0]['id'], 1)
        self.assertEqual(data[0]['name'], "Classic Cashmere Trench Coat")

    def test_get_single_product_api(self):
        """Test GET /api/products/<id> returns product details."""
        response = self.client.get('/api/products/2')
        self.assertEqual(response.status_code, 200)
        
        data = json.loads(response.data)
        self.assertEqual(data['id'], 2)
        self.assertEqual(data['name'], "Satin Silk Wrap Dress")

    def test_get_nonexistent_product_api(self):
        """Test GET /api/products/<id> with invalid ID returns 404."""
        response = self.client.get('/api/products/99')
        self.assertEqual(response.status_code, 404)
        
        data = json.loads(response.data)
        self.assertIn('error', data)

    def test_checkout_successful_validation(self):
        """Test POST /api/checkout with valid shipping and card details."""
        valid_payload = {
            "shipping": {
                "firstName": "John",
                "lastName": "Doe",
                "address": "123 High Street",
                "city": "London",
                "zipCode": "E1 6AN",
                "country": "UK"
            },
            "payment": {
                "cardholderName": "JOHN DOE",
                "cardNumber": "4111 1111 1111 1111",
                "expiryDate": "12/28",
                "cvv": "123"
            },
            "cart": [
                {
                    "name": "Classic Cashmere Trench Coat",
                    "price": 289,
                    "quantity": 1
                }
            ],
            "summary": {
                "finalTotal": "327.12"
            }
        }
        
        response = self.client.post('/api/checkout', 
                                    data=json.dumps(valid_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 201)
        
        data = json.loads(response.data)
        self.assertIn('orderId', data)
        self.assertEqual(data['shippingName'], "John Doe")
        self.assertEqual(data['finalTotal'], "327.12")

    def test_checkout_missing_fields_validation(self):
        """Test POST /api/checkout rejects requests with missing fields."""
        invalid_payload = {
            "shipping": {
                "firstName": "John",
                "lastName": "Doe",
                # missing street address
                "city": "London",
                "zipCode": "E1 6AN",
                "country": "UK"
            },
            "payment": {
                "cardholderName": "JOHN DOE",
                "cardNumber": "4111 1111 1111 1111",
                "expiryDate": "12/28",
                "cvv": "123"
            },
            "cart": [
                {
                    "name": "Classic Cashmere Trench Coat",
                    "price": 289,
                    "quantity": 1
                }
            ],
            "summary": {
                "finalTotal": "327.12"
            }
        }
        
        response = self.client.post('/api/checkout', 
                                    data=json.dumps(invalid_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn("address", data['error'])

    def test_checkout_invalid_card_validation(self):
        """Test POST /api/checkout rejects requests with bad card length."""
        invalid_card_payload = {
            "shipping": {
                "firstName": "John",
                "lastName": "Doe",
                "address": "123 High Street",
                "city": "London",
                "zipCode": "E1 6AN",
                "country": "UK"
            },
            "payment": {
                "cardholderName": "JOHN DOE",
                "cardNumber": "4111",  # Invalid short card number
                "expiryDate": "12/28",
                "cvv": "123"
            },
            "cart": [
                {
                    "name": "Classic Cashmere Trench Coat",
                    "price": 289,
                    "quantity": 1
                }
            ],
            "summary": {
                "finalTotal": "327.12"
            }
        }
        
        response = self.client.post('/api/checkout', 
                                    data=json.dumps(invalid_card_payload),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 400)
        
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertIn("credit card", data['error'].lower())


if __name__ == '__main__':
    unittest.main()

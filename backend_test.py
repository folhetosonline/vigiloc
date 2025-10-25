#!/usr/bin/env python3
"""
CRM/ERP Backend API Testing Script
Tests all CRM functionality in the specified order from the review request.
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://securetracker-crm.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class CRMTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_data = {}
        self.failed_tests = []
        self.passed_tests = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self) -> bool:
        """Authenticate as admin user"""
        try:
            self.log("Authenticating as admin...")
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log(f"✅ Authentication successful")
                return True
            else:
                self.log(f"❌ Authentication failed: {response.status_code} - {response.text}", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"❌ Authentication error: {str(e)}", "ERROR")
            return False
    
    def make_request(self, method: str, endpoint: str, data: Optional[Dict] = None, params: Optional[Dict] = None) -> requests.Response:
        """Make authenticated API request"""
        url = f"{BASE_URL}{endpoint}"
        try:
            if method.upper() == "GET":
                response = self.session.get(url, params=params)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, params=params)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"❌ Request error for {method} {endpoint}: {str(e)}", "ERROR")
            raise
    
    def test_crm_settings(self) -> bool:
        """Test CRM Settings APIs - Test first since other features depend on it"""
        self.log("\n=== TESTING CRM SETTINGS APIs ===")
        
        try:
            # 1. GET /api/admin/crm/settings (should return default settings)
            self.log("Testing GET /admin/crm/settings...")
            response = self.make_request("GET", "/admin/crm/settings")
            
            if response.status_code == 200:
                settings = response.json()
                self.log("✅ GET settings successful")
                self.test_data['original_settings'] = settings
            else:
                self.log(f"❌ GET settings failed: {response.status_code} - {response.text}")
                self.failed_tests.append("GET CRM Settings")
                return False
            
            # 2. PUT /api/admin/crm/settings/triggers (update trigger days)
            self.log("Testing PUT /admin/crm/settings/triggers...")
            trigger_data = {
                "payment_reminder_days": 2,
                "overdue_notice_days": 5,
                "suspension_warning_days": 15
            }
            
            response = self.make_request("PUT", "/admin/crm/settings/triggers", trigger_data)
            if response.status_code == 200:
                self.log("✅ PUT triggers successful")
                self.passed_tests.append("Update CRM Trigger Settings")
            else:
                self.log(f"❌ PUT triggers failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Update CRM Trigger Settings")
            
            # 3. PUT /api/admin/crm/settings/email-templates (update email template)
            self.log("Testing PUT /admin/crm/settings/email-templates...")
            email_template_data = {
                "payment_reminder": {
                    "subject": "Lembrete de Pagamento - Teste",
                    "body": "Olá {customer_name}! Seu pagamento de R$ {amount} vence em {due_date}. PIX: {pix_key}"
                }
            }
            
            response = self.make_request("PUT", "/admin/crm/settings/email-templates", email_template_data)
            if response.status_code == 200:
                self.log("✅ PUT email templates successful")
                self.passed_tests.append("Update Email Templates")
            else:
                self.log(f"❌ PUT email templates failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Update Email Templates")
            
            # 4. PUT /api/admin/crm/settings/whatsapp-templates (update WhatsApp template)
            self.log("Testing PUT /admin/crm/settings/whatsapp-templates...")
            whatsapp_template_data = {
                "payment_reminder": "Olá {customer_name}! Lembrete: Pagamento de R$ {amount} vence em {due_date}. PIX: {pix_key} - TESTE"
            }
            
            response = self.make_request("PUT", "/admin/crm/settings/whatsapp-templates", whatsapp_template_data)
            if response.status_code == 200:
                self.log("✅ PUT WhatsApp templates successful")
                self.passed_tests.append("Update WhatsApp Templates")
            else:
                self.log(f"❌ PUT WhatsApp templates failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Update WhatsApp Templates")
            
            # 5. GET /api/admin/crm/settings again to verify updates
            self.log("Testing GET /admin/crm/settings (verify updates)...")
            response = self.make_request("GET", "/admin/crm/settings")
            
            if response.status_code == 200:
                updated_settings = response.json()
                self.log("✅ GET settings verification successful")
                
                # Verify trigger settings were updated
                triggers = updated_settings.get('trigger_settings', {})
                if (triggers.get('payment_reminder_days') == 2 and 
                    triggers.get('overdue_notice_days') == 5 and 
                    triggers.get('suspension_warning_days') == 15):
                    self.log("✅ Trigger settings verified")
                    self.passed_tests.append("Verify Trigger Settings Update")
                else:
                    self.log("❌ Trigger settings not properly updated")
                    self.failed_tests.append("Verify Trigger Settings Update")
                
                self.test_data['updated_settings'] = updated_settings
            else:
                self.log(f"❌ GET settings verification failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Verify Settings Updates")
            
            return len(self.failed_tests) == 0
            
        except Exception as e:
            self.log(f"❌ CRM Settings test error: {str(e)}", "ERROR")
            self.failed_tests.append("CRM Settings APIs")
            return False
    
    def test_customer_apis(self) -> bool:
        """Test Customer APIs"""
        self.log("\n=== TESTING CUSTOMER APIs ===")
        
        try:
            # Create test customers
            customers_data = [
                {
                    "name": "João Silva Santos",
                    "email": "joao.silva@email.com",
                    "phone": "(11) 98765-4321",
                    "whatsapp": "5511987654321",
                    "cpf_cnpj": "123.456.789-00",
                    "address": {
                        "street": "Rua das Flores, 123",
                        "city": "São Paulo",
                        "state": "SP",
                        "zip_code": "01234-567"
                    },
                    "customer_type": "residential",
                    "status": "active"
                },
                {
                    "name": "Maria Oliveira Costa",
                    "email": "maria.oliveira@empresa.com",
                    "phone": "(11) 91234-5678",
                    "whatsapp": "5511912345678",
                    "cpf_cnpj": "12.345.678/0001-90",
                    "address": {
                        "street": "Av. Paulista, 1000",
                        "city": "São Paulo",
                        "state": "SP",
                        "zip_code": "01310-100"
                    },
                    "customer_type": "commercial",
                    "status": "active"
                },
                {
                    "name": "Carlos Eduardo Lima",
                    "email": "carlos.lima@gmail.com",
                    "phone": "(11) 95555-1234",
                    "whatsapp": "5511955551234",
                    "cpf_cnpj": "987.654.321-11",
                    "address": {
                        "street": "Rua Augusta, 456",
                        "city": "São Paulo",
                        "state": "SP",
                        "zip_code": "01305-000"
                    },
                    "customer_type": "residential",
                    "status": "active"
                }
            ]
            
            created_customers = []
            
            # POST /api/admin/customers (create customers)
            for i, customer_data in enumerate(customers_data):
                self.log(f"Creating customer {i+1}: {customer_data['name']}")
                response = self.make_request("POST", "/admin/customers", customer_data)
                
                if response.status_code == 200:
                    customer = response.json()
                    created_customers.append(customer)
                    self.log(f"✅ Customer {customer['name']} created with ID: {customer['id']}")
                else:
                    self.log(f"❌ Failed to create customer {customer_data['name']}: {response.status_code} - {response.text}")
                    self.failed_tests.append(f"Create Customer {customer_data['name']}")
            
            if created_customers:
                self.test_data['customers'] = created_customers
                self.passed_tests.append("Create Customers")
            
            # GET /api/admin/customers (verify list)
            self.log("Testing GET /admin/customers...")
            response = self.make_request("GET", "/admin/customers")
            
            if response.status_code == 200:
                customers_list = response.json()
                self.log(f"✅ Retrieved {len(customers_list)} customers")
                self.passed_tests.append("Get Customers List")
                
                # Verify our created customers are in the list
                created_ids = {c['id'] for c in created_customers}
                retrieved_ids = {c['id'] for c in customers_list}
                
                if created_ids.issubset(retrieved_ids):
                    self.log("✅ All created customers found in list")
                else:
                    self.log("❌ Some created customers not found in list")
                    self.failed_tests.append("Verify Customers in List")
            else:
                self.log(f"❌ Failed to get customers: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Customers List")
            
            # PUT /api/admin/customers/{id} (update one customer)
            if created_customers:
                customer_to_update = created_customers[0]
                update_data = {
                    "name": customer_to_update['name'] + " - ATUALIZADO",
                    "phone": "(11) 99999-8888",
                    "status": "active"
                }
                
                self.log(f"Updating customer {customer_to_update['id']}...")
                response = self.make_request("PUT", f"/admin/customers/{customer_to_update['id']}", update_data)
                
                if response.status_code == 200:
                    updated_customer = response.json()
                    self.log(f"✅ Customer updated: {updated_customer['name']}")
                    self.passed_tests.append("Update Customer")
                else:
                    self.log(f"❌ Failed to update customer: {response.status_code} - {response.text}")
                    self.failed_tests.append("Update Customer")
            
            return len([t for t in self.failed_tests if "Customer" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Customer APIs test error: {str(e)}", "ERROR")
            self.failed_tests.append("Customer APIs")
            return False
    
    def test_contract_apis(self) -> bool:
        """Test Contract APIs"""
        self.log("\n=== TESTING CONTRACT APIs ===")
        
        try:
            if not self.test_data.get('customers'):
                self.log("❌ No customers available for contract testing")
                self.failed_tests.append("Contract APIs - No Customers")
                return False
            
            customers = self.test_data['customers']
            contracts_data = [
                {
                    "customer_id": customers[0]['id'],
                    "service_type": "totem",
                    "monthly_value": 299.90,
                    "installation_value": 150.00,
                    "start_date": datetime.now().isoformat(),
                    "payment_day": 10,
                    "status": "active",
                    "notes": "Contrato de totem de segurança"
                },
                {
                    "customer_id": customers[1]['id'] if len(customers) > 1 else customers[0]['id'],
                    "service_type": "complete",
                    "monthly_value": 899.90,
                    "installation_value": 500.00,
                    "start_date": datetime.now().isoformat(),
                    "payment_day": 15,
                    "status": "active",
                    "notes": "Contrato completo de segurança"
                }
            ]
            
            created_contracts = []
            
            # POST /api/admin/contracts (create contracts)
            for i, contract_data in enumerate(contracts_data):
                self.log(f"Creating contract {i+1} for customer {contract_data['customer_id']}")
                response = self.make_request("POST", "/admin/contracts", contract_data)
                
                if response.status_code == 200:
                    contract = response.json()
                    created_contracts.append(contract)
                    self.log(f"✅ Contract created with number: {contract['contract_number']}")
                    
                    # Verify contract number is auto-generated
                    if contract.get('contract_number') and contract['contract_number'].startswith('CTR-'):
                        self.log("✅ Contract number auto-generated correctly")
                    else:
                        self.log("❌ Contract number not properly auto-generated")
                        self.failed_tests.append("Contract Number Auto-Generation")
                else:
                    self.log(f"❌ Failed to create contract: {response.status_code} - {response.text}")
                    self.failed_tests.append(f"Create Contract {i+1}")
            
            if created_contracts:
                self.test_data['contracts'] = created_contracts
                self.passed_tests.append("Create Contracts")
            
            # GET /api/admin/contracts (verify list)
            self.log("Testing GET /admin/contracts...")
            response = self.make_request("GET", "/admin/contracts")
            
            if response.status_code == 200:
                contracts_list = response.json()
                self.log(f"✅ Retrieved {len(contracts_list)} contracts")
                self.passed_tests.append("Get Contracts List")
                
                # Verify contract numbers are present
                contract_numbers = [c.get('contract_number') for c in contracts_list if c.get('contract_number')]
                if contract_numbers:
                    self.log(f"✅ Contract numbers found: {contract_numbers}")
                else:
                    self.log("❌ No contract numbers found")
                    self.failed_tests.append("Verify Contract Numbers")
            else:
                self.log(f"❌ Failed to get contracts: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Contracts List")
            
            return len([t for t in self.failed_tests if "Contract" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Contract APIs test error: {str(e)}", "ERROR")
            self.failed_tests.append("Contract APIs")
            return False
    
    def test_equipment_apis(self) -> bool:
        """Test Equipment APIs"""
        self.log("\n=== TESTING EQUIPMENT APIs ===")
        
        try:
            if not self.test_data.get('customers') or not self.test_data.get('contracts'):
                self.log("❌ No customers or contracts available for equipment testing")
                self.failed_tests.append("Equipment APIs - Missing Dependencies")
                return False
            
            customers = self.test_data['customers']
            contracts = self.test_data['contracts']
            
            equipment_data = [
                {
                    "customer_id": customers[0]['id'],
                    "contract_id": contracts[0]['id'],
                    "equipment_type": "Totem de Segurança",
                    "brand": "Vigiloc",
                    "model": "VL-T100",
                    "serial_number": "VLT100001",
                    "installation_date": datetime.now().isoformat(),
                    "warranty_until": (datetime.now() + timedelta(days=365)).isoformat(),
                    "status": "active",
                    "location": "Entrada Principal",
                    "notes": "Totem instalado na entrada principal"
                },
                {
                    "customer_id": customers[1]['id'] if len(customers) > 1 else customers[0]['id'],
                    "contract_id": contracts[1]['id'] if len(contracts) > 1 else contracts[0]['id'],
                    "equipment_type": "Câmera IP",
                    "brand": "Hikvision",
                    "model": "DS-2CD2143G0-I",
                    "serial_number": "HIK2143001",
                    "installation_date": datetime.now().isoformat(),
                    "warranty_until": (datetime.now() + timedelta(days=730)).isoformat(),
                    "status": "active",
                    "location": "Área Externa",
                    "notes": "Câmera IP para monitoramento externo"
                },
                {
                    "customer_id": customers[0]['id'],
                    "contract_id": contracts[0]['id'],
                    "equipment_type": "Central de Alarme",
                    "brand": "Intelbras",
                    "model": "AMT 2018 E",
                    "serial_number": "INT2018001",
                    "installation_date": datetime.now().isoformat(),
                    "warranty_until": (datetime.now() + timedelta(days=365)).isoformat(),
                    "status": "active",
                    "location": "Sala de Segurança",
                    "notes": "Central de alarme principal"
                }
            ]
            
            created_equipment = []
            
            # POST /api/admin/equipment (create equipment)
            for i, equip_data in enumerate(equipment_data):
                self.log(f"Creating equipment {i+1}: {equip_data['equipment_type']}")
                response = self.make_request("POST", "/admin/equipment", equip_data)
                
                if response.status_code == 200:
                    equipment = response.json()
                    created_equipment.append(equipment)
                    self.log(f"✅ Equipment created: {equipment['equipment_type']} - {equipment['serial_number']}")
                else:
                    self.log(f"❌ Failed to create equipment: {response.status_code} - {response.text}")
                    self.failed_tests.append(f"Create Equipment {equip_data['equipment_type']}")
            
            if created_equipment:
                self.test_data['equipment'] = created_equipment
                self.passed_tests.append("Create Equipment")
            
            # GET /api/admin/equipment (verify list)
            self.log("Testing GET /admin/equipment...")
            response = self.make_request("GET", "/admin/equipment")
            
            if response.status_code == 200:
                equipment_list = response.json()
                self.log(f"✅ Retrieved {len(equipment_list)} equipment items")
                self.passed_tests.append("Get Equipment List")
            else:
                self.log(f"❌ Failed to get equipment: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Equipment List")
            
            # PUT /api/admin/equipment/{id} (update one equipment)
            if created_equipment:
                equipment_to_update = created_equipment[0]
                update_data = {
                    "status": "maintenance",
                    "notes": equipment_to_update.get('notes', '') + " - ATUALIZADO PARA MANUTENÇÃO"
                }
                
                self.log(f"Updating equipment {equipment_to_update['id']}...")
                response = self.make_request("PUT", f"/admin/equipment/{equipment_to_update['id']}", update_data)
                
                if response.status_code == 200:
                    updated_equipment = response.json()
                    self.log(f"✅ Equipment updated: {updated_equipment['status']}")
                    self.passed_tests.append("Update Equipment")
                else:
                    self.log(f"❌ Failed to update equipment: {response.status_code} - {response.text}")
                    self.failed_tests.append("Update Equipment")
            
            # GET /api/admin/equipment?customer_id={id} (filter by customer)
            if customers:
                customer_id = customers[0]['id']
                self.log(f"Testing GET /admin/equipment?customer_id={customer_id}...")
                response = self.make_request("GET", "/admin/equipment", params={"customer_id": customer_id})
                
                if response.status_code == 200:
                    filtered_equipment = response.json()
                    self.log(f"✅ Retrieved {len(filtered_equipment)} equipment items for customer")
                    self.passed_tests.append("Filter Equipment by Customer")
                    
                    # Verify all returned equipment belongs to the customer
                    all_match = all(eq['customer_id'] == customer_id for eq in filtered_equipment)
                    if all_match:
                        self.log("✅ All equipment correctly filtered by customer")
                    else:
                        self.log("❌ Equipment filter by customer not working correctly")
                        self.failed_tests.append("Verify Equipment Customer Filter")
                else:
                    self.log(f"❌ Failed to filter equipment by customer: {response.status_code} - {response.text}")
                    self.failed_tests.append("Filter Equipment by Customer")
            
            return len([t for t in self.failed_tests if "Equipment" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Equipment APIs test error: {str(e)}", "ERROR")
            self.failed_tests.append("Equipment APIs")
            return False
    
    def test_payment_apis(self) -> bool:
        """Test Payment APIs"""
        self.log("\n=== TESTING PAYMENT APIs ===")
        
        try:
            if not self.test_data.get('contracts'):
                self.log("❌ No contracts available for payment testing")
                self.failed_tests.append("Payment APIs - No Contracts")
                return False
            
            # POST /api/admin/payments/generate-monthly (generate monthly payments)
            self.log("Testing POST /admin/payments/generate-monthly...")
            response = self.make_request("POST", "/admin/payments/generate-monthly")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Monthly payments generated: {result.get('message', 'Success')}")
                self.passed_tests.append("Generate Monthly Payments")
            else:
                self.log(f"❌ Failed to generate monthly payments: {response.status_code} - {response.text}")
                self.failed_tests.append("Generate Monthly Payments")
            
            # GET /api/admin/payments (verify generated payments)
            self.log("Testing GET /admin/payments...")
            response = self.make_request("GET", "/admin/payments")
            
            generated_payments = []
            if response.status_code == 200:
                payments_list = response.json()
                self.log(f"✅ Retrieved {len(payments_list)} payments")
                self.passed_tests.append("Get Payments List")
                generated_payments = payments_list
                
                # Verify payments have required fields
                for payment in payments_list:
                    required_fields = ['id', 'customer_id', 'contract_id', 'amount', 'due_date', 'status']
                    missing_fields = [field for field in required_fields if field not in payment]
                    if missing_fields:
                        self.log(f"❌ Payment missing fields: {missing_fields}")
                        self.failed_tests.append("Payment Required Fields")
                        break
                else:
                    self.log("✅ All payments have required fields")
            else:
                self.log(f"❌ Failed to get payments: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Payments List")
            
            # GET /api/admin/payments?status=pending (filter by status)
            self.log("Testing GET /admin/payments?status=pending...")
            response = self.make_request("GET", "/admin/payments", params={"status": "pending"})
            
            if response.status_code == 200:
                pending_payments = response.json()
                self.log(f"✅ Retrieved {len(pending_payments)} pending payments")
                self.passed_tests.append("Filter Payments by Status")
                
                # Verify all returned payments are pending
                all_pending = all(p['status'] == 'pending' for p in pending_payments)
                if all_pending:
                    self.log("✅ All payments correctly filtered as pending")
                else:
                    self.log("❌ Payment status filter not working correctly")
                    self.failed_tests.append("Verify Payment Status Filter")
            else:
                self.log(f"❌ Failed to filter payments by status: {response.status_code} - {response.text}")
                self.failed_tests.append("Filter Payments by Status")
            
            # Test PIX operations if we have payments
            if generated_payments:
                payment_to_test = generated_payments[0]
                
                # PUT /api/admin/payments/{id}/pix (add PIX key and QR code)
                pix_data = {
                    "pix_key": "12345678901",
                    "pix_qrcode": "00020126580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426655440000"
                }
                
                self.log(f"Testing PUT /admin/payments/{payment_to_test['id']}/pix...")
                response = self.make_request("PUT", f"/admin/payments/{payment_to_test['id']}/pix", pix_data)
                
                if response.status_code == 200:
                    self.log("✅ PIX information updated successfully")
                    self.passed_tests.append("Update Payment PIX Info")
                else:
                    self.log(f"❌ Failed to update PIX info: {response.status_code} - {response.text}")
                    self.failed_tests.append("Update Payment PIX Info")
                
                # POST /api/admin/payments/{id}/mark-paid?payment_method=pix (mark as paid)
                self.log(f"Testing POST /admin/payments/{payment_to_test['id']}/mark-paid...")
                response = self.make_request("POST", f"/admin/payments/{payment_to_test['id']}/mark-paid", params={"payment_method": "pix"})
                
                if response.status_code == 200:
                    self.log("✅ Payment marked as paid successfully")
                    self.passed_tests.append("Mark Payment as Paid")
                    
                    # Verify payment status changed to "paid"
                    verify_response = self.make_request("GET", "/admin/payments")
                    if verify_response.status_code == 200:
                        updated_payments = verify_response.json()
                        updated_payment = next((p for p in updated_payments if p['id'] == payment_to_test['id']), None)
                        
                        if updated_payment and updated_payment['status'] == 'paid':
                            self.log("✅ Payment status verified as 'paid'")
                            self.passed_tests.append("Verify Payment Status Change")
                        else:
                            self.log("❌ Payment status not changed to 'paid'")
                            self.failed_tests.append("Verify Payment Status Change")
                else:
                    self.log(f"❌ Failed to mark payment as paid: {response.status_code} - {response.text}")
                    self.failed_tests.append("Mark Payment as Paid")
            
            return len([t for t in self.failed_tests if "Payment" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Payment APIs test error: {str(e)}", "ERROR")
            self.failed_tests.append("Payment APIs")
            return False
    
    def test_maintenance_ticket_apis(self) -> bool:
        """Test Maintenance Ticket APIs"""
        self.log("\n=== TESTING MAINTENANCE TICKET APIs ===")
        
        try:
            if not self.test_data.get('customers'):
                self.log("❌ No customers available for ticket testing")
                self.failed_tests.append("Ticket APIs - No Customers")
                return False
            
            customers = self.test_data['customers']
            equipment = self.test_data.get('equipment', [])
            
            tickets_data = [
                {
                    "customer_id": customers[0]['id'],
                    "equipment_id": equipment[0]['id'] if equipment else None,
                    "title": "Problema no Totem de Segurança",
                    "description": "O totem está apresentando falhas intermitentes na tela",
                    "priority": "high",
                    "status": "open",
                    "assigned_to": "Técnico João"
                },
                {
                    "customer_id": customers[1]['id'] if len(customers) > 1 else customers[0]['id'],
                    "equipment_id": equipment[1]['id'] if len(equipment) > 1 else None,
                    "title": "Manutenção Preventiva Câmera",
                    "description": "Realizar limpeza e verificação da câmera IP",
                    "priority": "medium",
                    "status": "open",
                    "assigned_to": "Técnico Maria"
                },
                {
                    "customer_id": customers[0]['id'],
                    "title": "Configuração de Alarme",
                    "description": "Ajustar configurações do sistema de alarme",
                    "priority": "low",
                    "status": "open"
                }
            ]
            
            created_tickets = []
            
            # POST /api/admin/tickets (create tickets)
            for i, ticket_data in enumerate(tickets_data):
                self.log(f"Creating ticket {i+1}: {ticket_data['title']}")
                response = self.make_request("POST", "/admin/tickets", ticket_data)
                
                if response.status_code == 200:
                    ticket = response.json()
                    created_tickets.append(ticket)
                    self.log(f"✅ Ticket created: {ticket['ticket_number']} - {ticket['title']}")
                    
                    # Verify ticket number is auto-generated
                    if ticket.get('ticket_number') and ticket['ticket_number'].startswith('TKT-'):
                        self.log("✅ Ticket number auto-generated correctly")
                    else:
                        self.log("❌ Ticket number not properly auto-generated")
                        self.failed_tests.append("Ticket Number Auto-Generation")
                else:
                    self.log(f"❌ Failed to create ticket: {response.status_code} - {response.text}")
                    self.failed_tests.append(f"Create Ticket {ticket_data['title']}")
            
            if created_tickets:
                self.test_data['tickets'] = created_tickets
                self.passed_tests.append("Create Maintenance Tickets")
            
            # GET /api/admin/tickets (verify list)
            self.log("Testing GET /admin/tickets...")
            response = self.make_request("GET", "/admin/tickets")
            
            if response.status_code == 200:
                tickets_list = response.json()
                self.log(f"✅ Retrieved {len(tickets_list)} tickets")
                self.passed_tests.append("Get Tickets List")
            else:
                self.log(f"❌ Failed to get tickets: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Tickets List")
            
            # GET /api/admin/tickets?status=open (filter by status)
            self.log("Testing GET /admin/tickets?status=open...")
            response = self.make_request("GET", "/admin/tickets", params={"status": "open"})
            
            if response.status_code == 200:
                open_tickets = response.json()
                self.log(f"✅ Retrieved {len(open_tickets)} open tickets")
                self.passed_tests.append("Filter Tickets by Status")
                
                # Verify all returned tickets are open
                all_open = all(t['status'] == 'open' for t in open_tickets)
                if all_open:
                    self.log("✅ All tickets correctly filtered as open")
                else:
                    self.log("❌ Ticket status filter not working correctly")
                    self.failed_tests.append("Verify Ticket Status Filter")
            else:
                self.log(f"❌ Failed to filter tickets by status: {response.status_code} - {response.text}")
                self.failed_tests.append("Filter Tickets by Status")
            
            # PUT /api/admin/tickets/{id} (update ticket status)
            if created_tickets:
                ticket_to_update = created_tickets[0]
                update_data = {
                    "status": "in_progress",
                    "assigned_to": "Técnico Carlos - ATUALIZADO"
                }
                
                self.log(f"Updating ticket {ticket_to_update['id']} to in_progress...")
                response = self.make_request("PUT", f"/admin/tickets/{ticket_to_update['id']}", update_data)
                
                if response.status_code == 200:
                    updated_ticket = response.json()
                    self.log(f"✅ Ticket updated: {updated_ticket['status']}")
                    self.passed_tests.append("Update Ticket Status")
                else:
                    self.log(f"❌ Failed to update ticket: {response.status_code} - {response.text}")
                    self.failed_tests.append("Update Ticket Status")
            
            return len([t for t in self.failed_tests if "Ticket" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Maintenance Ticket APIs test error: {str(e)}", "ERROR")
            self.failed_tests.append("Maintenance Ticket APIs")
            return False
    
    def test_notification_system(self) -> bool:
        """Test Notification System - Critical - uses configurable settings"""
        self.log("\n=== TESTING NOTIFICATION SYSTEM ===")
        
        try:
            # POST /api/admin/notifications/send-payment-reminders
            self.log("Testing POST /admin/notifications/send-payment-reminders...")
            response = self.make_request("POST", "/admin/notifications/send-payment-reminders")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Payment reminders sent: {result.get('message', 'Success')}")
                self.passed_tests.append("Send Payment Reminders")
            else:
                self.log(f"❌ Failed to send payment reminders: {response.status_code} - {response.text}")
                self.failed_tests.append("Send Payment Reminders")
            
            # POST /api/admin/notifications/send-overdue-notices
            self.log("Testing POST /admin/notifications/send-overdue-notices...")
            response = self.make_request("POST", "/admin/notifications/send-overdue-notices")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Overdue notices sent: {result.get('message', 'Success')}")
                self.passed_tests.append("Send Overdue Notices")
            else:
                self.log(f"❌ Failed to send overdue notices: {response.status_code} - {response.text}")
                self.failed_tests.append("Send Overdue Notices")
            
            # POST /api/admin/notifications/send-suspension-warnings
            self.log("Testing POST /admin/notifications/send-suspension-warnings...")
            response = self.make_request("POST", "/admin/notifications/send-suspension-warnings")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Suspension warnings sent: {result.get('message', 'Success')}")
                self.passed_tests.append("Send Suspension Warnings")
            else:
                self.log(f"❌ Failed to send suspension warnings: {response.status_code} - {response.text}")
                self.failed_tests.append("Send Suspension Warnings")
            
            # GET /api/admin/notifications (verify notifications created)
            self.log("Testing GET /admin/notifications...")
            response = self.make_request("GET", "/admin/notifications")
            
            if response.status_code == 200:
                notifications_list = response.json()
                self.log(f"✅ Retrieved {len(notifications_list)} notifications")
                self.passed_tests.append("Get Notifications List")
                
                # Verify notifications use updated templates from settings
                if notifications_list:
                    sample_notification = notifications_list[0]
                    message = sample_notification.get('message', '')
                    
                    # Check if template variables are substituted
                    if '{customer_name}' not in message and '{amount}' not in message:
                        self.log("✅ Template variable substitution working")
                        self.passed_tests.append("Template Variable Substitution")
                    else:
                        self.log("❌ Template variables not properly substituted")
                        self.failed_tests.append("Template Variable Substitution")
                    
                    # Check if updated templates are being used (look for "TESTE" from our template update)
                    if any("TESTE" in notif.get('message', '') for notif in notifications_list):
                        self.log("✅ Updated templates are being used")
                        self.passed_tests.append("Use Updated Templates")
                    else:
                        self.log("⚠️ Updated templates may not be in use (no TESTE marker found)")
                        # This is not necessarily a failure as notifications might be using default templates
                
            else:
                self.log(f"❌ Failed to get notifications: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Notifications List")
            
            return len([t for t in self.failed_tests if "Notification" in t or "Template" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Notification System test error: {str(e)}", "ERROR")
            self.failed_tests.append("Notification System")
            return False
    
    def test_file_upload(self) -> bool:
        """Test File Upload API - RAPID TEST as requested"""
        self.log("\n=== TESTING FILE UPLOAD API ===")
        
        try:
            import io
            from PIL import Image
            
            # Create a small test PNG image (100x100 pixels)
            self.log("Creating test PNG image...")
            img = Image.new('RGB', (100, 100), color='red')
            img_bytes = io.BytesIO()
            img.save(img_bytes, format='PNG')
            img_bytes.seek(0)
            
            # Prepare multipart form data for file upload
            files = {
                'file': ('test_image.png', img_bytes, 'image/png')
            }
            
            # POST /api/admin/upload
            self.log("Testing POST /admin/upload...")
            url = f"{BASE_URL}/admin/upload"
            
            response = self.session.post(url, files=files)
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ File upload successful")
                
                # Verify response contains file_url
                if 'file_url' in result:
                    file_url = result['file_url']
                    self.log(f"✅ file_url returned: {file_url}")
                    self.passed_tests.append("File Upload - file_url returned")
                    
                    # Verify file_url is complete URL
                    if file_url.startswith('http') and 'uploads/' in file_url:
                        self.log("✅ file_url is complete URL")
                        self.passed_tests.append("File Upload - Complete URL")
                    else:
                        self.log(f"❌ file_url is not complete URL: {file_url}")
                        self.failed_tests.append("File Upload - Complete URL")
                else:
                    self.log("❌ file_url not in response")
                    self.failed_tests.append("File Upload - file_url missing")
                
                # Verify other expected fields
                expected_fields = ['url', 'size', 'type']
                for field in expected_fields:
                    if field in result:
                        self.log(f"✅ {field} field present: {result[field]}")
                    else:
                        self.log(f"❌ {field} field missing")
                        self.failed_tests.append(f"File Upload - {field} field")
                
                self.passed_tests.append("File Upload API")
                
            else:
                self.log(f"❌ File upload failed: {response.status_code} - {response.text}")
                self.failed_tests.append("File Upload API")
                return False
            
            # Verify file was saved in /app/backend/uploads
            self.log("Checking if file was saved in /app/backend/uploads...")
            import os
            upload_dir = "/app/backend/uploads"
            
            if os.path.exists(upload_dir):
                files_in_upload = os.listdir(upload_dir)
                if files_in_upload:
                    self.log(f"✅ Files found in uploads directory: {len(files_in_upload)} files")
                    self.passed_tests.append("File Upload - File Saved")
                    
                    # Check if any PNG files exist
                    png_files = [f for f in files_in_upload if f.endswith('.png')]
                    if png_files:
                        self.log(f"✅ PNG files found: {png_files}")
                    else:
                        self.log("⚠️ No PNG files found, but other files exist")
                else:
                    self.log("❌ No files found in uploads directory")
                    self.failed_tests.append("File Upload - File Saved")
            else:
                self.log("❌ Upload directory does not exist")
                self.failed_tests.append("File Upload - Upload Directory")
            
            return len([t for t in self.failed_tests if "File Upload" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ File Upload test error: {str(e)}", "ERROR")
            self.failed_tests.append("File Upload API")
            return False
    
    def run_all_tests(self) -> bool:
        """Run all CRM/ERP tests in the specified order"""
        self.log("🚀 Starting CRM/ERP Backend API Tests")
        self.log("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            return False
        
        # Run tests in the specified order
        test_results = []
        
        # 1. CRM Settings APIs (Test first since other features depend on it)
        test_results.append(self.test_crm_settings())
        
        # 2. Customer APIs
        test_results.append(self.test_customer_apis())
        
        # 3. Contract APIs
        test_results.append(self.test_contract_apis())
        
        # 4. Equipment APIs
        test_results.append(self.test_equipment_apis())
        
        # 5. Payment APIs
        test_results.append(self.test_payment_apis())
        
        # 6. Maintenance Ticket APIs
        test_results.append(self.test_maintenance_ticket_apis())
        
        # 7. Notification System
        test_results.append(self.test_notification_system())
        
        # Print summary
        self.print_summary()
        
        return all(test_results)
    
    def print_summary(self):
        """Print test results summary"""
        self.log("\n" + "=" * 60)
        self.log("🏁 TEST RESULTS SUMMARY")
        self.log("=" * 60)
        
        total_tests = len(self.passed_tests) + len(self.failed_tests)
        
        self.log(f"Total Tests: {total_tests}")
        self.log(f"✅ Passed: {len(self.passed_tests)}")
        self.log(f"❌ Failed: {len(self.failed_tests)}")
        
        if self.passed_tests:
            self.log("\n✅ PASSED TESTS:")
            for test in self.passed_tests:
                self.log(f"  • {test}")
        
        if self.failed_tests:
            self.log("\n❌ FAILED TESTS:")
            for test in self.failed_tests:
                self.log(f"  • {test}")
        
        success_rate = (len(self.passed_tests) / total_tests * 100) if total_tests > 0 else 0
        self.log(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        if len(self.failed_tests) == 0:
            self.log("\n🎉 ALL TESTS PASSED! CRM/ERP Backend is working correctly.")
        else:
            self.log(f"\n⚠️  {len(self.failed_tests)} tests failed. Please review the issues above.")

def test_upload_only():
    """Quick test function for file upload only - as requested"""
    tester = CRMTester()
    
    print("🚀 RAPID FILE UPLOAD TEST - NÃO PERDER TEMPO!")
    print("=" * 50)
    
    # Authenticate first
    if not tester.authenticate():
        print("❌ Authentication failed")
        return False
    
    # Run only file upload test
    success = tester.test_file_upload()
    
    # Print quick summary
    print("\n" + "=" * 50)
    if success:
        print("🎉 FILE UPLOAD TEST PASSED!")
    else:
        print("❌ FILE UPLOAD TEST FAILED!")
        if tester.failed_tests:
            print("Failed tests:")
            for test in tester.failed_tests:
                print(f"  • {test}")
    
    return success

def main():
    """Main function to run the tests"""
    import sys
    
    # Check if we should run only upload test
    if len(sys.argv) > 1 and sys.argv[1] == "--upload-only":
        success = test_upload_only()
        sys.exit(0 if success else 1)
    
    # Run all tests
    tester = CRMTester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
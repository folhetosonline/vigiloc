#!/usr/bin/env python3
"""
VigiLoc CMS Admin Panel Backend API Testing Script
Tests specific admin panel features as requested in the review.
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://visual-cms-4.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class VigiLocAdminTester:
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
            elif method.upper() == "PATCH":
                response = self.session.patch(url, json=data, params=params)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, params=params)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"❌ Request error for {method} {endpoint}: {str(e)}", "ERROR")
            raise
    
    def test_service_duplication(self) -> bool:
        """Test Service Duplication API - POST /api/admin/services/{service_id}/duplicate"""
        self.log("\n=== TESTING SERVICE DUPLICATION API ===")
        
        try:
            # First, get existing services to duplicate
            self.log("Getting existing services...")
            response = self.make_request("GET", "/admin/services")
            
            if response.status_code != 200:
                self.log(f"❌ Failed to get services: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Services for Duplication")
                return False
            
            services = response.json()
            if not services:
                # Create a test service first
                self.log("No services found, creating a test service...")
                test_service = {
                    "name": "Serviço de Teste para Duplicação",
                    "slug": "servico-teste-duplicacao",
                    "description": "Serviço criado para testar funcionalidade de duplicação",
                    "short_description": "Teste de duplicação",
                    "hero_title": "Serviço de Teste",
                    "hero_subtitle": "Para validar duplicação",
                    "icon": "🔒",
                    "published": True,
                    "features": [
                        {"title": "Recurso 1", "description": "Descrição do recurso 1"},
                        {"title": "Recurso 2", "description": "Descrição do recurso 2"}
                    ]
                }
                
                create_response = self.make_request("POST", "/admin/services", test_service)
                if create_response.status_code == 200:
                    created_service = create_response.json()
                    services = [created_service]
                    self.log(f"✅ Test service created: {created_service['name']}")
                else:
                    self.log(f"❌ Failed to create test service: {create_response.status_code} - {create_response.text}")
                    self.failed_tests.append("Create Test Service")
                    return False
            
            # Test duplication with the first service
            service_to_duplicate = services[0]
            service_id = service_to_duplicate['id']
            
            self.log(f"Testing duplication of service: {service_to_duplicate['name']} (ID: {service_id})")
            
            # POST /api/admin/services/{service_id}/duplicate
            response = self.make_request("POST", f"/admin/services/{service_id}/duplicate")
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Service duplication successful")
                
                # Verify response structure
                if 'message' in result and 'new_service' in result:
                    new_service = result['new_service']
                    self.log(f"✅ New service created: {new_service['name']}")
                    
                    # Verify the duplicated service has correct properties
                    if new_service['name'].endswith('(Cópia)'):
                        self.log("✅ Service name correctly modified with (Cópia)")
                        self.passed_tests.append("Service Name Modification")
                    else:
                        self.log("❌ Service name not properly modified")
                        self.failed_tests.append("Service Name Modification")
                    
                    if new_service['slug'] != service_to_duplicate['slug']:
                        self.log("✅ Service slug correctly modified")
                        self.passed_tests.append("Service Slug Modification")
                    else:
                        self.log("❌ Service slug not properly modified")
                        self.failed_tests.append("Service Slug Modification")
                    
                    if new_service['published'] == False:
                        self.log("✅ Duplicated service correctly set as unpublished")
                        self.passed_tests.append("Service Publication Status")
                    else:
                        self.log("❌ Duplicated service should be unpublished")
                        self.failed_tests.append("Service Publication Status")
                    
                    self.test_data['duplicated_service'] = new_service
                    self.passed_tests.append("Service Duplication API")
                    
                else:
                    self.log("❌ Response missing required fields (message, new_service)")
                    self.failed_tests.append("Service Duplication Response Structure")
            else:
                self.log(f"❌ Service duplication failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Service Duplication API")
                return False
            
            # Verify the duplicated service appears in the services list
            self.log("Verifying duplicated service appears in services list...")
            verify_response = self.make_request("GET", "/admin/services")
            
            if verify_response.status_code == 200:
                updated_services = verify_response.json()
                duplicated_service_found = any(s['id'] == new_service['id'] for s in updated_services)
                
                if duplicated_service_found:
                    self.log("✅ Duplicated service found in services list")
                    self.passed_tests.append("Verify Duplicated Service in List")
                else:
                    self.log("❌ Duplicated service not found in services list")
                    self.failed_tests.append("Verify Duplicated Service in List")
            
            return len([t for t in self.failed_tests if "Service" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Service duplication test error: {str(e)}", "ERROR")
            self.failed_tests.append("Service Duplication API")
            return False
    
    def test_page_duplication(self) -> bool:
        """Test Page Duplication API - POST /api/admin/pages/{page_id}/duplicate"""
        self.log("\n=== TESTING PAGE DUPLICATION API ===")
        
        try:
            # First, get existing custom pages to duplicate
            self.log("Getting existing custom pages...")
            response = self.make_request("GET", "/admin/pages")
            
            if response.status_code != 200:
                self.log(f"❌ Failed to get pages: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Pages for Duplication")
                return False
            
            pages = response.json()
            custom_pages = [p for p in pages if not p.get('isSystem', False)]
            
            if not custom_pages:
                # Create a test page first
                self.log("No custom pages found, creating a test page...")
                test_page = {
                    "slug": "pagina-teste-duplicacao",
                    "title": "Página de Teste para Duplicação",
                    "meta_title": "Teste de Duplicação",
                    "meta_description": "Página criada para testar funcionalidade de duplicação",
                    "blocks": [
                        {
                            "id": "hero-test",
                            "type": "hero",
                            "title": "Página de Teste",
                            "subtitle": "Para validar duplicação",
                            "content": "Conteúdo de teste"
                        }
                    ],
                    "published": True
                }
                
                create_response = self.make_request("POST", "/admin/pages", test_page)
                if create_response.status_code == 200:
                    created_page = create_response.json()
                    custom_pages = [created_page]
                    self.log(f"✅ Test page created: {created_page['title']}")
                else:
                    self.log(f"❌ Failed to create test page: {create_response.status_code} - {create_response.text}")
                    self.failed_tests.append("Create Test Page")
                    return False
            
            # Test duplication with the first custom page
            page_to_duplicate = custom_pages[0]
            page_id = page_to_duplicate['id']
            
            self.log(f"Testing duplication of page: {page_to_duplicate['title']} (ID: {page_id})")
            
            # POST /api/admin/pages/{page_id}/duplicate
            response = self.make_request("POST", f"/admin/pages/{page_id}/duplicate")
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Page duplication successful")
                
                # Verify response structure
                if 'message' in result and 'new_page' in result:
                    new_page = result['new_page']
                    self.log(f"✅ New page created: {new_page['title']}")
                    
                    # Verify the duplicated page has correct properties
                    if new_page['title'].endswith('(Cópia)'):
                        self.log("✅ Page title correctly modified with (Cópia)")
                        self.passed_tests.append("Page Title Modification")
                    else:
                        self.log("❌ Page title not properly modified")
                        self.failed_tests.append("Page Title Modification")
                    
                    if new_page['slug'] != page_to_duplicate['slug']:
                        self.log("✅ Page slug correctly modified")
                        self.passed_tests.append("Page Slug Modification")
                    else:
                        self.log("❌ Page slug not properly modified")
                        self.failed_tests.append("Page Slug Modification")
                    
                    if new_page['published'] == False:
                        self.log("✅ Duplicated page correctly set as unpublished")
                        self.passed_tests.append("Page Publication Status")
                    else:
                        self.log("❌ Duplicated page should be unpublished")
                        self.failed_tests.append("Page Publication Status")
                    
                    self.test_data['duplicated_page'] = new_page
                    self.passed_tests.append("Page Duplication API")
                    
                else:
                    self.log("❌ Response missing required fields (message, new_page)")
                    self.failed_tests.append("Page Duplication Response Structure")
            else:
                self.log(f"❌ Page duplication failed: {response.status_code} - {response.text}")
                self.failed_tests.append("Page Duplication API")
                return False
            
            # Verify the duplicated page appears in the pages list
            self.log("Verifying duplicated page appears in pages list...")
            verify_response = self.make_request("GET", "/admin/pages")
            
            if verify_response.status_code == 200:
                updated_pages = verify_response.json()
                duplicated_page_found = any(p['id'] == new_page['id'] for p in updated_pages)
                
                if duplicated_page_found:
                    self.log("✅ Duplicated page found in pages list")
                    self.passed_tests.append("Verify Duplicated Page in List")
                else:
                    self.log("❌ Duplicated page not found in pages list")
                    self.failed_tests.append("Verify Duplicated Page in List")
            
            return len([t for t in self.failed_tests if "Page" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Page duplication test error: {str(e)}", "ERROR")
            self.failed_tests.append("Page Duplication API")
            return False
    
    def test_ai_template_generation(self) -> bool:
        """Test AI Template Generation API - POST /api/admin/generate-template"""
        self.log("\n=== TESTING AI TEMPLATE GENERATION API ===")
        
        try:
            # Test with Gemini provider
            self.log("Testing AI template generation with Gemini provider...")
            gemini_data = {
                "prompt": "Promoção de Dia das Mães",
                "provider": "gemini",
                "business_type": "segurança eletrônica"
            }
            
            response = self.make_request("POST", "/admin/generate-template", gemini_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ Gemini template generation successful")
                
                # Verify response structure
                required_fields = ['name', 'description', 'hero_title', 'hero_subtitle']
                missing_fields = [field for field in required_fields if field not in result]
                
                if not missing_fields:
                    self.log("✅ Gemini template has all required fields")
                    self.passed_tests.append("Gemini Template Structure")
                    
                    # Check if content is relevant to the prompt
                    content_text = str(result).lower()
                    if any(keyword in content_text for keyword in ['mães', 'dia das mães', 'promoção', 'especial']):
                        self.log("✅ Gemini template content is relevant to prompt")
                        self.passed_tests.append("Gemini Template Relevance")
                    else:
                        self.log("⚠️ Gemini template content may not be fully relevant to prompt")
                        # Not marking as failed since AI responses can vary
                    
                    self.test_data['gemini_template'] = result
                else:
                    self.log(f"❌ Gemini template missing fields: {missing_fields}")
                    self.failed_tests.append("Gemini Template Structure")
                
                self.passed_tests.append("AI Template Generation - Gemini")
                
            else:
                self.log(f"❌ Gemini template generation failed: {response.status_code} - {response.text}")
                self.failed_tests.append("AI Template Generation - Gemini")
            
            # Test with GPT provider
            self.log("Testing AI template generation with GPT provider...")
            gpt_data = {
                "prompt": "Black Friday 2026 - Ofertas Especiais",
                "provider": "openai",
                "business_type": "segurança eletrônica"
            }
            
            response = self.make_request("POST", "/admin/generate-template", gpt_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ GPT template generation successful")
                
                # Verify response structure
                required_fields = ['name', 'description', 'hero_title', 'hero_subtitle']
                missing_fields = [field for field in required_fields if field not in result]
                
                if not missing_fields:
                    self.log("✅ GPT template has all required fields")
                    self.passed_tests.append("GPT Template Structure")
                    
                    # Check if content is relevant to the prompt
                    content_text = str(result).lower()
                    if any(keyword in content_text for keyword in ['black friday', 'ofertas', '2026', 'promoção']):
                        self.log("✅ GPT template content is relevant to prompt")
                        self.passed_tests.append("GPT Template Relevance")
                    else:
                        self.log("⚠️ GPT template content may not be fully relevant to prompt")
                        # Not marking as failed since AI responses can vary
                    
                    self.test_data['gpt_template'] = result
                else:
                    self.log(f"❌ GPT template missing fields: {missing_fields}")
                    self.failed_tests.append("GPT Template Structure")
                
                self.passed_tests.append("AI Template Generation - GPT")
                
            else:
                self.log(f"❌ GPT template generation failed: {response.status_code} - {response.text}")
                self.failed_tests.append("AI Template Generation - GPT")
            
            # Test error handling - missing prompt
            self.log("Testing error handling with missing prompt...")
            invalid_data = {
                "provider": "gemini"
                # Missing prompt
            }
            
            response = self.make_request("POST", "/admin/generate-template", invalid_data)
            
            if response.status_code == 400:
                self.log("✅ Proper error handling for missing prompt")
                self.passed_tests.append("AI Template Error Handling")
            else:
                self.log(f"❌ Expected 400 error for missing prompt, got: {response.status_code}")
                self.failed_tests.append("AI Template Error Handling")
            
            return len([t for t in self.failed_tests if "Template" in t or "AI" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ AI template generation test error: {str(e)}", "ERROR")
            self.failed_tests.append("AI Template Generation API")
            return False
    
    def run_all_tests(self) -> bool:
        """Run all admin panel tests"""
        self.log("🚀 Starting VigiLoc CMS Admin Panel Backend Tests")
        self.log("=" * 60)
        
        if not self.authenticate():
            return False
        
        # Run the specific tests requested in the review
        tests = [
            ("Service Duplication", self.test_service_duplication),
            ("Page Duplication", self.test_page_duplication),
            ("AI Template Generation", self.test_ai_template_generation),
        ]
        
        all_passed = True
        
        for test_name, test_func in tests:
            self.log(f"\n🧪 Running {test_name} tests...")
            try:
                result = test_func()
                if result:
                    self.log(f"✅ {test_name} tests PASSED")
                else:
                    self.log(f"❌ {test_name} tests FAILED")
                    all_passed = False
            except Exception as e:
                self.log(f"❌ {test_name} tests ERROR: {str(e)}", "ERROR")
                all_passed = False
        
        return all_passed
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 60)
        self.log("📊 TEST SUMMARY")
        self.log("=" * 60)
        
        self.log(f"✅ PASSED TESTS ({len(self.passed_tests)}):")
        for test in self.passed_tests:
            self.log(f"   • {test}")
        
        if self.failed_tests:
            self.log(f"\n❌ FAILED TESTS ({len(self.failed_tests)}):")
            for test in self.failed_tests:
                self.log(f"   • {test}")
        
        total_tests = len(self.passed_tests) + len(self.failed_tests)
        success_rate = (len(self.passed_tests) / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"\n📈 SUCCESS RATE: {success_rate:.1f}% ({len(self.passed_tests)}/{total_tests})")
        
        if len(self.failed_tests) == 0:
            self.log("🎉 ALL TESTS PASSED!")
            return True
        else:
            self.log("⚠️  SOME TESTS FAILED - Review the failures above")
            return False


def main():
    """Main test execution"""
    tester = VigiLocAdminTester()
    
    try:
        success = tester.run_all_tests()
        final_success = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if final_success else 1)
        
    except KeyboardInterrupt:
        tester.log("\n⚠️ Tests interrupted by user", "WARNING")
        sys.exit(1)
    except Exception as e:
        tester.log(f"\n💥 Unexpected error: {str(e)}", "ERROR")
        sys.exit(1)


if __name__ == "__main__":
    main()
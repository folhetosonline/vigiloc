#!/usr/bin/env python3
"""
Page Builder Backend API Testing Script
Tests Page Builder functionality for system pages as requested in review.
"""

import requests
import json
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://prospecting-intel.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class PageBuilderTester:
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
    
    def test_page_builder_system(self) -> bool:
        """Test Page Builder System for System Pages as requested in review"""
        self.log("\n=== TESTING PAGE BUILDER SYSTEM FOR SYSTEM PAGES ===")
        
        try:
            # 1. GET /api/admin/all-pages - Should return system pages + custom pages
            self.log("TESTE 1: GET /api/admin/all-pages - Lista de páginas do sistema")
            response = self.make_request("GET", "/admin/all-pages")
            
            if response.status_code == 200:
                all_pages_data = response.json()
                self.log(f"✅ Retrieved all pages data")
                
                # Check if response has system and custom keys
                if isinstance(all_pages_data, dict) and 'system' in all_pages_data:
                    system_pages = all_pages_data.get('system', [])
                    custom_pages = all_pages_data.get('custom', [])
                    
                    self.log(f"✅ Found {len(system_pages)} system pages and {len(custom_pages)} custom pages")
                    
                    # Verify system pages are present
                    expected_system_pages = ["home", "produtos", "totens", "contato", "sobre"]
                    found_system_pages = []
                    
                    for page in system_pages:
                        if isinstance(page, dict) and page.get('id') in expected_system_pages:
                            found_system_pages.append(page.get('id'))
                    
                    if len(found_system_pages) >= 4:  # At least 4 system pages should be present
                        self.log(f"✅ System pages found: {found_system_pages}")
                        self.passed_tests.append("GET All Pages - System Pages Present")
                    else:
                        self.log(f"❌ Not enough system pages found: {found_system_pages}")
                        self.failed_tests.append("GET All Pages - System Pages Present")
                    
                    # Verify system pages have correct structure
                    for page in system_pages:
                        if page.get('type') == 'system' and page.get('editable') == True:
                            self.log(f"✅ System page {page.get('name')} has correct structure")
                        else:
                            self.log(f"❌ System page {page.get('name')} has incorrect structure")
                            break
                    else:
                        self.passed_tests.append("System Pages Structure Correct")
                    
                else:
                    # Handle case where it returns a flat list (fallback)
                    all_pages = all_pages_data if isinstance(all_pages_data, list) else []
                    self.log(f"✅ Retrieved {len(all_pages)} pages (flat list)")
                    
                    system_pages = ["home", "produtos", "totens", "contato", "sobre"]
                    found_system_pages = []
                    
                    for page in all_pages:
                        if isinstance(page, dict) and page.get('slug') in system_pages:
                            found_system_pages.append(page.get('slug'))
                        elif isinstance(page, str) and page in system_pages:
                            found_system_pages.append(page)
                    
                    if len(found_system_pages) >= 4:
                        self.log(f"✅ System pages found: {found_system_pages}")
                        self.passed_tests.append("GET All Pages - System Pages Present")
                    else:
                        self.log(f"❌ Not enough system pages found: {found_system_pages}")
                        self.failed_tests.append("GET All Pages - System Pages Present")
                
                self.test_data['all_pages'] = all_pages_data
                self.passed_tests.append("GET All Pages API")
            else:
                self.log(f"❌ Failed to get all pages: {response.status_code} - {response.text}")
                self.failed_tests.append("GET All Pages API")
                return False
            
            # 2. POST /api/admin/content-blocks - Create content block for "home" page
            self.log("TESTE 2: POST /api/admin/content-blocks - Criar bloco para página home")
            home_block_data = {
                "page_id": "home",
                "type": "hero",
                "order": 1,
                "settings": {
                    "background_type": "image",
                    "overlay_opacity": 0.5,
                    "text_align": "center"
                },
                "content": {
                    "title": "Bem-vindo à VigiLoc - Teste Page Builder",
                    "subtitle": "Soluções inteligentes de segurança",
                    "button_text": "Saiba Mais",
                    "button_link": "/contato",
                    "background_url": "/uploads/hero-bg.jpg"
                },
                "published": True
            }
            
            response = self.make_request("POST", "/admin/content-blocks", home_block_data)
            
            if response.status_code == 200:
                created_block = response.json()
                self.test_data['home_block'] = created_block
                self.log(f"✅ Home hero block created with ID: {created_block.get('id')}")
                self.passed_tests.append("Create Home Hero Block")
            else:
                self.log(f"❌ Failed to create home block: {response.status_code} - {response.text}")
                self.failed_tests.append("Create Home Hero Block")
            
            # 3. POST /api/admin/content-blocks - Create text block for "contato" page
            self.log("TESTE 3: POST /api/admin/content-blocks - Criar bloco de texto para página contato")
            contato_block_data = {
                "page_id": "contato",
                "type": "text",
                "order": 1,
                "settings": {
                    "font_size": "lg",
                    "text_color": "#1F2937",
                    "background_color": "#F9FAFB"
                },
                "content": {
                    "html": "<h2>Entre em Contato Conosco</h2><p>Nossa equipe está pronta para atender você. Utilize o formulário abaixo ou entre em contato pelos nossos canais de atendimento.</p>"
                },
                "published": True
            }
            
            response = self.make_request("POST", "/admin/content-blocks", contato_block_data)
            
            if response.status_code == 200:
                created_block = response.json()
                self.test_data['contato_block'] = created_block
                self.log(f"✅ Contato text block created with ID: {created_block.get('id')}")
                self.passed_tests.append("Create Contato Text Block")
            else:
                self.log(f"❌ Failed to create contato block: {response.status_code} - {response.text}")
                self.failed_tests.append("Create Contato Text Block")
            
            # 4. POST /api/admin/content-blocks - Create banner block for "sobre" page
            self.log("TESTE 4: POST /api/admin/content-blocks - Criar bloco banner para página sobre")
            sobre_block_data = {
                "page_id": "sobre",
                "type": "banner",
                "order": 1,
                "settings": {
                    "full_width": True,
                    "height": "auto"
                },
                "content": {
                    "image_url": "/uploads/sobre-banner.jpg",
                    "link": "/servicos",
                    "alt": "Conheça nossos serviços"
                },
                "published": True
            }
            
            response = self.make_request("POST", "/admin/content-blocks", sobre_block_data)
            
            if response.status_code == 200:
                created_block = response.json()
                self.test_data['sobre_block'] = created_block
                self.log(f"✅ Sobre banner block created with ID: {created_block.get('id')}")
                self.passed_tests.append("Create Sobre Banner Block")
            else:
                self.log(f"❌ Failed to create sobre block: {response.status_code} - {response.text}")
                self.failed_tests.append("Create Sobre Banner Block")
            
            # 5. GET /api/admin/content-blocks/{page_id} - List blocks for admin (home page)
            self.log("TESTE 5: GET /api/admin/content-blocks/home - Listar blocos da página home (admin)")
            response = self.make_request("GET", "/admin/content-blocks/home")
            
            if response.status_code == 200:
                home_blocks = response.json()
                self.log(f"✅ Retrieved {len(home_blocks)} blocks for home page (admin)")
                
                # Verify our created block is in the list
                if self.test_data.get('home_block'):
                    home_block_id = self.test_data['home_block'].get('id')
                    found_block = next((b for b in home_blocks if b.get('id') == home_block_id), None)
                    if found_block:
                        self.log("✅ Created home block found in admin list")
                        self.passed_tests.append("Verify Home Block in Admin List")
                    else:
                        self.log("❌ Created home block not found in admin list")
                        self.failed_tests.append("Verify Home Block in Admin List")
                
                self.passed_tests.append("GET Admin Content Blocks")
            else:
                self.log(f"❌ Failed to get admin content blocks: {response.status_code} - {response.text}")
                self.failed_tests.append("GET Admin Content Blocks")
            
            # 6. GET /api/content-blocks/{page_id} - Public endpoint for published blocks (contato page)
            self.log("TESTE 6: GET /api/content-blocks/contato - Endpoint público para blocos publicados")
            response = self.make_request("GET", "/content-blocks/contato")
            
            if response.status_code == 200:
                public_contato_blocks = response.json()
                self.log(f"✅ Retrieved {len(public_contato_blocks)} published blocks for contato page")
                
                # Verify only published blocks are returned
                all_published = all(b.get('published', False) for b in public_contato_blocks)
                if all_published:
                    self.log("✅ All public blocks are published")
                    self.passed_tests.append("Verify Public Blocks Published")
                else:
                    self.log("❌ Some public blocks are not published")
                    self.failed_tests.append("Verify Public Blocks Published")
                
                self.passed_tests.append("GET Public Content Blocks")
            else:
                self.log(f"❌ Failed to get public content blocks: {response.status_code} - {response.text}")
                self.failed_tests.append("GET Public Content Blocks")
            
            # 7. PUT /api/admin/content-blocks/{block_id} - Update a block
            if self.test_data.get('contato_block'):
                block_id = self.test_data['contato_block'].get('id')
                self.log(f"TESTE 7: PUT /api/admin/content-blocks/{block_id} - Atualizar bloco")
                
                update_data = {
                    "content": {
                        "html": "<h2>Entre em Contato Conosco - ATUALIZADO</h2><p>Nossa equipe está pronta para atender você 24/7. Utilize o formulário abaixo ou entre em contato pelos nossos canais de atendimento.</p>"
                    },
                    "settings": {
                        "font_size": "xl",
                        "text_color": "#1F2937",
                        "background_color": "#EFF6FF"
                    }
                }
                
                response = self.make_request("PUT", f"/admin/content-blocks/{block_id}", update_data)
                
                if response.status_code == 200:
                    updated_block = response.json()
                    self.log("✅ Content block updated successfully")
                    
                    # Verify update was applied by getting the block again
                    verify_response = self.make_request("GET", "/admin/content-blocks/contato")
                    if verify_response.status_code == 200:
                        contato_blocks = verify_response.json()
                        updated_block_check = next((b for b in contato_blocks if b.get('id') == block_id), None)
                        
                        if updated_block_check and "ATUALIZADO" in updated_block_check.get('content', {}).get('html', ''):
                            self.log("✅ Block content update verified")
                            self.passed_tests.append("Verify Block Update")
                        else:
                            self.log("❌ Block content update not verified")
                            self.failed_tests.append("Verify Block Update")
                    
                    self.passed_tests.append("Update Content Block")
                else:
                    self.log(f"❌ Failed to update content block: {response.status_code} - {response.text}")
                    self.failed_tests.append("Update Content Block")
            
            # 8. DELETE /api/admin/content-blocks/{block_id} - Delete a block
            if self.test_data.get('sobre_block'):
                block_id = self.test_data['sobre_block'].get('id')
                self.log(f"TESTE 8: DELETE /api/admin/content-blocks/{block_id} - Deletar bloco")
                
                response = self.make_request("DELETE", f"/admin/content-blocks/{block_id}")
                
                if response.status_code == 200:
                    self.log("✅ Content block deleted successfully")
                    self.passed_tests.append("Delete Content Block")
                    
                    # Verify block was deleted by trying to get it
                    verify_response = self.make_request("GET", "/admin/content-blocks/sobre")
                    if verify_response.status_code == 200:
                        sobre_blocks = verify_response.json()
                        deleted_block = next((b for b in sobre_blocks if b.get('id') == block_id), None)
                        if not deleted_block:
                            self.log("✅ Block deletion verified")
                            self.passed_tests.append("Verify Block Deletion")
                        else:
                            self.log("❌ Block still exists after deletion")
                            self.failed_tests.append("Verify Block Deletion")
                else:
                    self.log(f"❌ Failed to delete content block: {response.status_code} - {response.text}")
                    self.failed_tests.append("Delete Content Block")
            
            # Summary
            page_builder_failures = [t for t in self.failed_tests if "Block" in t or "Pages" in t]
            if not page_builder_failures:
                self.log("\n✅ ALL PAGE BUILDER TESTS PASSED!")
                self.log("- GET /api/admin/all-pages returns system pages")
                self.log("- POST /api/admin/content-blocks creates blocks for system pages")
                self.log("- GET /api/admin/content-blocks/{page_id} lists admin blocks")
                self.log("- GET /api/content-blocks/{page_id} returns published blocks")
                self.log("- PUT /api/admin/content-blocks/{id} updates blocks")
                self.log("- DELETE /api/admin/content-blocks/{id} removes blocks")
                return True
            else:
                self.log(f"\n❌ PAGE BUILDER TESTS FAILED: {len(page_builder_failures)} failures")
                for failure in page_builder_failures:
                    self.log(f"  • {failure}")
                return False
            
        except Exception as e:
            self.log(f"❌ Page Builder System test error: {str(e)}", "ERROR")
            self.failed_tests.append("Page Builder System")
            return False

def main():
    """Main function to run the tests"""
    tester = PageBuilderTester()
    if tester.authenticate():
        success = tester.test_page_builder_system()
        print(f"\n🎯 Page Builder System Test: {'✅ PASSED' if success else '❌ FAILED'}")
        
        # Print summary
        if success:
            print("\n✅ ALL PAGE BUILDER TESTS PASSED!")
            print("- System pages (Home, Produtos, Totens, Contato, Sobre) are editable")
            print("- Content blocks can be created, updated, and deleted")
            print("- Admin and public endpoints work correctly")
            print("- CRUD operations for content blocks are functional")
        else:
            print("\n❌ SOME PAGE BUILDER TESTS FAILED!")
            print("Failed tests:", tester.failed_tests)
    else:
        success = False
        print("❌ Authentication failed")
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
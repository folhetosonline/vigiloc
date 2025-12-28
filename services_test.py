#!/usr/bin/env python3
"""
Services API Testing Script
Tests all Services API endpoints as requested in Portuguese review.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://service-showcase-28.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class ServicesAPITester:
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
    
    def make_request(self, method: str, endpoint: str, data=None, params=None, use_auth=True):
        """Make API request"""
        url = f"{BASE_URL}{endpoint}"
        headers = {}
        
        if use_auth and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = requests.get(url, params=params, headers=headers)
            elif method.upper() == "POST":
                response = requests.post(url, json=data, params=params, headers=headers)
            elif method.upper() == "PUT":
                response = requests.put(url, json=data, params=params, headers=headers)
            elif method.upper() == "DELETE":
                response = requests.delete(url, params=params, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except Exception as e:
            self.log(f"❌ Request error for {method} {endpoint}: {str(e)}", "ERROR")
            raise
    
    def test_services_api(self):
        """Test all Services API endpoints as requested"""
        self.log("\n" + "="*60)
        self.log("🧪 TESTE DOS ENDPOINTS DA API DE SERVIÇOS")
        self.log("="*60)
        
        # TESTE 1: Listar Serviços Públicos (sem autenticação)
        self.log("\n📋 TESTE 1: Listar Serviços Públicos (sem autenticação)")
        self.log("GET /api/services")
        
        try:
            response = self.make_request("GET", "/services", use_auth=False)
            
            if response.status_code == 200:
                services = response.json()
                self.log(f"✅ Retornou {len(services)} serviços publicados")
                
                if services:
                    service = services[0]
                    required_fields = ['id', 'name', 'slug', 'shortDescription', 'icon', 'published', 'headerBanner', 'features']
                    missing_fields = [field for field in required_fields if field not in service]
                    
                    if not missing_fields:
                        self.log("✅ Todos os campos obrigatórios estão presentes")
                        self.log(f"   • ID: {service.get('id')}")
                        self.log(f"   • Nome: {service.get('name')}")
                        self.log(f"   • Slug: {service.get('slug')}")
                        self.log(f"   • Descrição: {service.get('shortDescription')}")
                        self.log(f"   • Ícone: {service.get('icon')}")
                        self.log(f"   • Publicado: {service.get('published')}")
                        self.passed_tests.append("TESTE 1 - Campos obrigatórios")
                    else:
                        self.log(f"❌ Campos ausentes: {missing_fields}")
                        self.failed_tests.append("TESTE 1 - Campos obrigatórios")
                
                self.passed_tests.append("TESTE 1 - Listar Serviços Públicos")
                self.test_data['public_services'] = services
            else:
                self.log(f"❌ Falha ao obter serviços públicos: {response.status_code}")
                self.log(f"   Resposta: {response.text}")
                self.failed_tests.append("TESTE 1 - Listar Serviços Públicos")
                
        except Exception as e:
            self.log(f"❌ Erro no TESTE 1: {str(e)}", "ERROR")
            self.failed_tests.append("TESTE 1 - Erro de execução")
        
        # TESTE 2: Buscar Serviço por Slug (sem autenticação)
        self.log("\n🔍 TESTE 2: Buscar Serviço por Slug (sem autenticação)")
        self.log("GET /api/services/portaria-autonoma")
        
        try:
            response = self.make_request("GET", "/services/portaria-autonoma", use_auth=False)
            
            if response.status_code == 200:
                service = response.json()
                self.log(f"✅ Serviço encontrado: {service.get('name', 'N/A')}")
                
                # Verificar headerBanner
                header_banner = service.get('headerBanner', {})
                if header_banner:
                    banner_fields = ['type', 'mediaUrl', 'title', 'ctaText', 'ctaColor']
                    missing_banner_fields = [field for field in banner_fields if field not in header_banner]
                    
                    if not missing_banner_fields:
                        self.log("✅ HeaderBanner contém todos os campos necessários")
                        self.log(f"   • Type: {header_banner.get('type')}")
                        self.log(f"   • MediaUrl: {header_banner.get('mediaUrl')}")
                        self.log(f"   • Title: {header_banner.get('title')}")
                        self.log(f"   • CtaText: {header_banner.get('ctaText')}")
                        self.log(f"   • CtaColor: {header_banner.get('ctaColor')}")
                        self.passed_tests.append("TESTE 2 - HeaderBanner completo")
                    else:
                        self.log(f"❌ Campos ausentes no headerBanner: {missing_banner_fields}")
                        self.failed_tests.append("TESTE 2 - HeaderBanner completo")
                else:
                    self.log("⚠️ HeaderBanner não encontrado")
                
                self.passed_tests.append("TESTE 2 - Buscar por Slug")
            else:
                self.log(f"❌ Falha ao buscar serviço por slug: {response.status_code}")
                self.log(f"   Resposta: {response.text}")
                self.failed_tests.append("TESTE 2 - Buscar por Slug")
                
        except Exception as e:
            self.log(f"❌ Erro no TESTE 2: {str(e)}", "ERROR")
            self.failed_tests.append("TESTE 2 - Erro de execução")
        
        # TESTE 3: Listar Serviços Admin (com autenticação)
        self.log("\n🔐 TESTE 3: Listar Serviços Admin (com autenticação)")
        self.log("GET /api/admin/services")
        
        try:
            response = self.make_request("GET", "/admin/services", use_auth=True)
            
            if response.status_code == 200:
                admin_services = response.json()
                self.log(f"✅ Retornou {len(admin_services)} serviços (incluindo não publicados)")
                self.passed_tests.append("TESTE 3 - Listar Serviços Admin")
                self.test_data['admin_services'] = admin_services
            else:
                self.log(f"❌ Falha ao obter serviços admin: {response.status_code}")
                self.log(f"   Resposta: {response.text}")
                self.failed_tests.append("TESTE 3 - Listar Serviços Admin")
                
        except Exception as e:
            self.log(f"❌ Erro no TESTE 3: {str(e)}", "ERROR")
            self.failed_tests.append("TESTE 3 - Erro de execução")
        
        # TESTE 4: Criar Novo Serviço (com autenticação)
        self.log("\n➕ TESTE 4: Criar Novo Serviço (com autenticação)")
        self.log("POST /api/admin/services")
        
        new_service_data = {
            "name": "Teste Backend",
            "slug": "teste-backend",
            "shortDescription": "Serviço criado via teste de API",
            "icon": "🧪",
            "published": True,
            "headerBanner": {
                "type": "gradient",
                "title": "Teste API",
                "ctaText": "Testar"
            },
            "features": [
                {"icon": "✅", "title": "Feature 1", "description": "Teste"}
            ]
        }
        
        try:
            response = self.make_request("POST", "/admin/services", data=new_service_data, use_auth=True)
            
            if response.status_code == 200:
                created_service = response.json()
                self.test_data['created_service'] = created_service
                self.log(f"✅ Serviço criado com sucesso")
                self.log(f"   • ID: {created_service.get('id')}")
                self.log(f"   • Nome: {created_service.get('name')}")
                
                if 'id' in created_service:
                    self.log("✅ Serviço retornado com ID")
                    self.passed_tests.append("TESTE 4 - ID presente")
                else:
                    self.log("❌ Serviço criado sem ID")
                    self.failed_tests.append("TESTE 4 - ID presente")
                
                self.passed_tests.append("TESTE 4 - Criar Novo Serviço")
            else:
                self.log(f"❌ Falha ao criar serviço: {response.status_code}")
                self.log(f"   Resposta: {response.text}")
                self.failed_tests.append("TESTE 4 - Criar Novo Serviço")
                
        except Exception as e:
            self.log(f"❌ Erro no TESTE 4: {str(e)}", "ERROR")
            self.failed_tests.append("TESTE 4 - Erro de execução")
        
        # TESTE 5: Atualizar Serviço (com autenticação)
        if 'created_service' in self.test_data:
            service_id = self.test_data['created_service']['id']
            self.log(f"\n✏️ TESTE 5: Atualizar Serviço (com autenticação)")
            self.log(f"PUT /api/admin/services/{service_id}")
            
            update_data = {
                "name": "Teste Backend Atualizado",
                "slug": "teste-backend",
                "shortDescription": "Serviço atualizado via teste de API",
                "icon": "🧪",
                "published": True,
                "headerBanner": {
                    "type": "gradient",
                    "title": "Teste API Atualizado",
                    "ctaText": "Testar"
                },
                "features": [
                    {"icon": "✅", "title": "Feature 1", "description": "Teste Atualizado"}
                ]
            }
            
            try:
                response = self.make_request("PUT", f"/admin/services/{service_id}", data=update_data, use_auth=True)
                
                if response.status_code == 200:
                    updated_service = response.json()
                    self.log(f"✅ Serviço atualizado com sucesso")
                    self.log(f"   • Nome atualizado: {updated_service.get('name')}")
                    
                    if updated_service.get('name') == "Teste Backend Atualizado":
                        self.log("✅ Nome foi atualizado corretamente")
                        self.passed_tests.append("TESTE 5 - Nome atualizado")
                    else:
                        self.log("❌ Nome não foi atualizado corretamente")
                        self.failed_tests.append("TESTE 5 - Nome atualizado")
                    
                    self.passed_tests.append("TESTE 5 - Atualizar Serviço")
                else:
                    self.log(f"❌ Falha ao atualizar serviço: {response.status_code}")
                    self.log(f"   Resposta: {response.text}")
                    self.failed_tests.append("TESTE 5 - Atualizar Serviço")
                    
            except Exception as e:
                self.log(f"❌ Erro no TESTE 5: {str(e)}", "ERROR")
                self.failed_tests.append("TESTE 5 - Erro de execução")
        
        # TESTE 6: Deletar Serviço (com autenticação)
        if 'created_service' in self.test_data:
            service_id = self.test_data['created_service']['id']
            self.log(f"\n🗑️ TESTE 6: Deletar Serviço (com autenticação)")
            self.log(f"DELETE /api/admin/services/{service_id}")
            
            try:
                response = self.make_request("DELETE", f"/admin/services/{service_id}", use_auth=True)
                
                if response.status_code == 200:
                    result = response.json()
                    self.log(f"✅ Serviço deletado com sucesso")
                    self.log(f"   • Mensagem: {result.get('message', 'Success')}")
                    self.passed_tests.append("TESTE 6 - Deletar Serviço")
                else:
                    self.log(f"❌ Falha ao deletar serviço: {response.status_code}")
                    self.log(f"   Resposta: {response.text}")
                    self.failed_tests.append("TESTE 6 - Deletar Serviço")
                    
            except Exception as e:
                self.log(f"❌ Erro no TESTE 6: {str(e)}", "ERROR")
                self.failed_tests.append("TESTE 6 - Erro de execução")
        
        # TESTE 7: Verificar Navbar Settings
        self.log("\n🧭 TESTE 7: Verificar Navbar Settings")
        self.log("GET /api/navbar-settings")
        
        try:
            response = self.make_request("GET", "/navbar-settings", use_auth=False)
            
            if response.status_code == 200:
                navbar_settings = response.json()
                self.log("✅ Configurações do navbar obtidas")
                
                # Verificar se links contém "Serviços" com sublinks
                links = navbar_settings.get('links', [])
                services_link = None
                
                for link in links:
                    if 'Serviços' in link.get('label', ''):
                        services_link = link
                        break
                
                if services_link:
                    sublinks = services_link.get('sublinks', [])
                    self.log(f"✅ Link 'Serviços' encontrado com {len(sublinks)} sublinks")
                    
                    if len(sublinks) >= 6:
                        self.log("✅ Navbar contém 6+ sublinks de serviços")
                        self.passed_tests.append("TESTE 7 - Sublinks suficientes")
                    else:
                        self.log(f"❌ Esperado 6+ sublinks, encontrado {len(sublinks)}")
                        self.failed_tests.append("TESTE 7 - Sublinks suficientes")
                        
                    # Mostrar os sublinks encontrados
                    for i, sublink in enumerate(sublinks[:6]):
                        self.log(f"   {i+1}. {sublink.get('label', 'N/A')}")
                        
                else:
                    self.log("❌ Link 'Serviços' não encontrado no navbar")
                    self.failed_tests.append("TESTE 7 - Link Serviços")
                
                self.passed_tests.append("TESTE 7 - Navbar Settings")
            else:
                self.log(f"❌ Falha ao obter navbar settings: {response.status_code}")
                self.log(f"   Resposta: {response.text}")
                self.failed_tests.append("TESTE 7 - Navbar Settings")
                
        except Exception as e:
            self.log(f"❌ Erro no TESTE 7: {str(e)}", "ERROR")
            self.failed_tests.append("TESTE 7 - Erro de execução")
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60)
        self.log("📊 RESUMO DOS TESTES DA API DE SERVIÇOS")
        self.log("="*60)
        
        total_tests = len(self.passed_tests) + len(self.failed_tests)
        success_rate = (len(self.passed_tests) / total_tests * 100) if total_tests > 0 else 0
        
        self.log(f"✅ Testes aprovados: {len(self.passed_tests)}")
        self.log(f"❌ Testes falharam: {len(self.failed_tests)}")
        self.log(f"📈 Taxa de sucesso: {success_rate:.1f}%")
        
        if self.passed_tests:
            self.log("\n✅ TESTES APROVADOS:")
            for test in self.passed_tests:
                self.log(f"   • {test}")
        
        if self.failed_tests:
            self.log("\n❌ TESTES FALHARAM:")
            for test in self.failed_tests:
                self.log(f"   • {test}")
        
        self.log("\n" + "="*60)
        if len(self.failed_tests) == 0:
            self.log("🎉 TODOS OS TESTES DA API DE SERVIÇOS PASSARAM!")
        else:
            self.log("⚠️ ALGUNS TESTES FALHARAM - VERIFIQUE OS DETALHES ACIMA")
        self.log("="*60)

def main():
    tester = ServicesAPITester()
    
    # Authenticate first
    if not tester.authenticate():
        print("❌ Falha na autenticação. Não é possível prosseguir com os testes.")
        sys.exit(1)
    
    # Run Services API tests
    tester.test_services_api()
    
    # Print summary
    tester.print_summary()
    
    # Exit with appropriate code
    sys.exit(0 if len(tester.failed_tests) == 0 else 1)

if __name__ == "__main__":
    main()
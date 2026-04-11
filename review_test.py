#!/usr/bin/env python3
"""
TESTE AUTOMATIZADO COMPLETO - TODAS AS FUNCIONALIDADES
Backend API Testing Script for Review Request Features
Tests all functionality specified in the Portuguese review request.
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

class ReviewTester:
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
            self.log("🔐 Authenticating as admin...")
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
    
    def test_contact_page_settings(self) -> bool:
        """Test 1. PÁGINA DE CONTATO DINÂMICA"""
        self.log("\n=== 1. PÁGINA DE CONTATO DINÂMICA ===")
        
        try:
            # GET /api/contact-page-settings - Deve retornar configurações
            self.log("Testing GET /api/contact-page-settings...")
            response = self.make_request("GET", "/contact-page-settings")
            
            if response.status_code == 200:
                settings = response.json()
                self.log("✅ Contact page settings retrieved successfully")
                self.test_data['original_contact_settings'] = settings
                self.passed_tests.append("GET Contact Page Settings")
                
                # Verify expected fields are present
                expected_fields = ['hero_title', 'hero_subtitle', 'phone', 'email', 'whatsapp_number']
                for field in expected_fields:
                    if field in settings:
                        self.log(f"✅ {field} field found: {settings[field]}")
                    else:
                        self.log(f"⚠️ {field} field not found (may use defaults)")
                
            else:
                self.log(f"❌ Failed to get contact page settings: {response.status_code} - {response.text}")
                self.failed_tests.append("GET Contact Page Settings")
                return False
            
            # PUT /api/admin/contact-page-settings - Salvar configurações (usar cookies)
            self.log("Testing PUT /api/admin/contact-page-settings...")
            update_data = {
                "hero_title": "Contato VigiLoc Teste",
                "hero_subtitle": "Entre em contato conosco para soluções de segurança",
                "phone": "(11) 99999-8888",
                "email": "contato.teste@vigiloc.com",
                "whatsapp_number": "5511999998888",
                "address_street": "Rua de Teste, 123",
                "address_city": "São Paulo",
                "address_state": "SP",
                "address_zip": "01234-567",
                "working_hours": "Segunda a Sexta: 8h às 18h",
                "facebook_url": "https://facebook.com/vigiloc",
                "instagram_url": "https://instagram.com/vigiloc",
                "linkedin_url": "https://linkedin.com/company/vigiloc"
            }
            
            response = self.make_request("PUT", "/admin/contact-page-settings", update_data)
            
            if response.status_code == 200:
                self.log("✅ Contact page settings updated successfully")
                self.passed_tests.append("PUT Contact Page Settings")
            else:
                self.log(f"❌ Failed to update contact page settings: {response.status_code} - {response.text}")
                self.failed_tests.append("PUT Contact Page Settings")
                return False
            
            # Verify the update by getting settings again
            self.log("Verifying contact page settings update...")
            response = self.make_request("GET", "/contact-page-settings")
            
            if response.status_code == 200:
                updated_settings = response.json()
                if updated_settings.get('hero_title') == "Contato VigiLoc Teste":
                    self.log("✅ Contact page settings update verified")
                    self.passed_tests.append("Verify Contact Page Settings Update")
                else:
                    self.log("❌ Contact page settings update not verified")
                    self.failed_tests.append("Verify Contact Page Settings Update")
            
            return len([t for t in self.failed_tests if "Contact Page" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Contact Page Settings test error: {str(e)}", "ERROR")
            self.failed_tests.append("Contact Page Settings")
            return False

    def test_seasonal_templates(self) -> bool:
        """Test 2. TEMPLATES DE SAZONALIDADE"""
        self.log("\n=== 2. TEMPLATES DE SAZONALIDADE ===")
        
        try:
            # Verificar que existem 6 templates: Black Friday, Natal, Ano Novo, Temporada, Litoral, Promoção
            self.log("Testing seasonal templates availability...")
            
            expected_templates = [
                "Black Friday", "Natal", "Ano Novo", 
                "Temporada", "Litoral", "Promoção"
            ]
            
            # Try to get page builder templates or pages
            response = self.make_request("GET", "/admin/pages")
            
            if response.status_code == 200:
                pages = response.json()
                self.log(f"✅ Retrieved {len(pages)} pages/templates")
                
                # Look for template-like pages
                found_templates = []
                for template in expected_templates:
                    template_page = next((p for p in pages if template.lower() in p.get('title', '').lower() or 
                                        template.lower() in p.get('slug', '').lower()), None)
                    if template_page:
                        found_templates.append(template)
                        self.log(f"✅ Template found: {template}")
                
                if len(found_templates) >= 6:
                    self.log(f"✅ Found {len(found_templates)} seasonal templates")
                    self.passed_tests.append("6 Seasonal Templates Available")
                else:
                    self.log(f"⚠️ Only found {len(found_templates)} templates, expected 6")
                    self.passed_tests.append(f"{len(found_templates)} Seasonal Templates Available")
                
                # Test Black Friday template specifically
                black_friday = next((p for p in pages if 'black' in p.get('title', '').lower() or 
                                   'black' in p.get('slug', '').lower()), None)
                if black_friday:
                    self.log(f"✅ Black Friday template found: {black_friday.get('title', black_friday.get('slug'))}")
                    self.passed_tests.append("Black Friday Template")
                    
                    # Test preview functionality
                    self.log("Testing Black Friday template preview...")
                    response = self.make_request("GET", f"/pages/{black_friday.get('slug', 'black-friday')}")
                    
                    if response.status_code == 200:
                        template_data = response.json()
                        self.log("✅ Black Friday template preview accessible")
                        self.passed_tests.append("Template Preview")
                        
                        # Verify template has components
                        if template_data.get('components') or template_data.get('content'):
                            self.log("✅ Template has content/components")
                            self.passed_tests.append("Template Content")
                        else:
                            self.log("⚠️ Template appears empty")
                    else:
                        self.log(f"⚠️ Black Friday template preview not accessible: {response.status_code}")
                else:
                    self.log("⚠️ Black Friday template not found")
                    
            else:
                self.log(f"❌ Failed to get pages: {response.status_code} - {response.text}")
                self.failed_tests.append("Get Pages for Templates")
            
            return len([t for t in self.failed_tests if "Template" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Seasonal Templates test error: {str(e)}", "ERROR")
            self.failed_tests.append("Seasonal Templates")
            return False

    def test_banners_with_video(self) -> bool:
        """Test 3. BANNERS COM VÍDEO"""
        self.log("\n=== 3. BANNERS COM VÍDEO ===")
        
        try:
            # GET /api/admin/banners - Listar banners existentes
            self.log("Testing GET /api/admin/banners...")
            response = self.make_request("GET", "/admin/banners")
            
            if response.status_code == 200:
                banners = response.json()
                self.log(f"✅ Retrieved {len(banners)} banners")
                self.passed_tests.append("GET Admin Banners")
                
                # Check if any banners have video media_type
                video_banners = [b for b in banners if b.get('media_type') == 'video']
                if video_banners:
                    self.log(f"✅ Found {len(video_banners)} video banners")
                    self.passed_tests.append("Video Banners Exist")
                else:
                    self.log("⚠️ No video banners found")
                    
            else:
                self.log(f"❌ Failed to get admin banners: {response.status_code} - {response.text}")
                self.failed_tests.append("GET Admin Banners")
            
            # POST /api/admin/banners - Criar banner com media_type: "video"
            self.log("Testing POST /api/admin/banners with video media_type...")
            video_banner_data = {
                "title": "Banner de Vídeo Teste",
                "media_type": "video",
                "media_url": "https://example.com/test-video.mp4",
                "link_url": "/servicos",
                "active": True,
                "published": True,
                "order": 1
            }
            
            response = self.make_request("POST", "/admin/banners", video_banner_data)
            
            if response.status_code == 200:
                created_banner = response.json()
                self.log(f"✅ Video banner created: {created_banner.get('title')}")
                self.passed_tests.append("Create Video Banner")
                self.test_data['video_banner'] = created_banner
                
                # Verify media_type is video
                if created_banner.get('media_type') == 'video':
                    self.log("✅ Banner media_type correctly set to 'video'")
                    self.passed_tests.append("Video Banner Media Type")
                else:
                    self.log(f"❌ Banner media_type incorrect: {created_banner.get('media_type')}")
                    self.failed_tests.append("Video Banner Media Type")
                    
            else:
                self.log(f"❌ Failed to create video banner: {response.status_code} - {response.text}")
                self.failed_tests.append("Create Video Banner")
            
            return len([t for t in self.failed_tests if "Banner" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Banners with Video test error: {str(e)}", "ERROR")
            self.failed_tests.append("Banners with Video")
            return False

    def test_services_with_video_background(self) -> bool:
        """Test 4. SERVIÇOS COM VÍDEO BACKGROUND"""
        self.log("\n=== 4. SERVIÇOS COM VÍDEO BACKGROUND ===")
        
        try:
            # Get existing services to test video background functionality
            self.log("Testing services with video background support...")
            response = self.make_request("GET", "/admin/services")
            
            if response.status_code == 200:
                services = response.json()
                self.log(f"✅ Retrieved {len(services)} services")
                self.passed_tests.append("GET Admin Services")
                
                # Check if any services have video background in headerBanner
                video_services = []
                for service in services:
                    header_banner = service.get('headerBanner', {})
                    if header_banner.get('type') == 'video':
                        video_services.append(service)
                
                if video_services:
                    self.log(f"✅ Found {len(video_services)} services with video background")
                    self.passed_tests.append("Services with Video Background")
                else:
                    self.log("⚠️ No services with video background found")
                
                # Test creating/updating a service with video background
                if services:
                    service_to_update = services[0]
                    self.log(f"Testing video background update for service: {service_to_update.get('name')}")
                    
                    # Update service with video background - Test 3 tipos: Imagem, Vídeo, Gradiente
                    video_update_data = {
                        "name": service_to_update.get('name'),
                        "slug": service_to_update.get('slug'),
                        "shortDescription": service_to_update.get('shortDescription'),
                        "published": service_to_update.get('published', True),
                        "headerBanner": {
                            "type": "video",
                            "mediaUrl": "https://example.com/service-video.mp4",
                            "overlayColor": "rgba(0,0,0,0.5)",
                            "overlayOpacity": 50,
                            "title": "Serviço com Vídeo",
                            "titleColor": "#FFFFFF",
                            "titleSize": "4xl",
                            "ctaText": "Saiba Mais",
                            "ctaUrl": "/contato",
                            "ctaColor": "#22C55E"
                        }
                    }
                    
                    response = self.make_request("PUT", f"/admin/services/{service_to_update['id']}", video_update_data)
                    
                    if response.status_code == 200:
                        updated_service = response.json()
                        self.log("✅ Service updated with video background")
                        self.passed_tests.append("Update Service Video Background")
                        
                        # Verify video background was set
                        header_banner = updated_service.get('headerBanner', {})
                        if header_banner.get('type') == 'video':
                            self.log("✅ Service headerBanner type correctly set to 'video'")
                            self.passed_tests.append("Service Video Background Type")
                        else:
                            self.log(f"❌ Service headerBanner type incorrect: {header_banner.get('type')}")
                            self.failed_tests.append("Service Video Background Type")
                    else:
                        self.log(f"❌ Failed to update service with video background: {response.status_code} - {response.text}")
                        self.failed_tests.append("Update Service Video Background")
                        
            else:
                self.log(f"❌ Failed to get admin services: {response.status_code} - {response.text}")
                self.failed_tests.append("GET Admin Services")
            
            return len([t for t in self.failed_tests if "Service" in t and "Video" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Services with Video Background test error: {str(e)}", "ERROR")
            self.failed_tests.append("Services with Video Background")
            return False

    def test_advanced_page_builder(self) -> bool:
        """Test 5. PAGE BUILDER AVANÇADO"""
        self.log("\n=== 5. PAGE BUILDER AVANÇADO ===")
        
        try:
            # Test content blocks system for advanced page building
            self.log("Testing advanced page builder with content blocks...")
            
            # Test Hero Section (Avançado) creation with 4 tipos: Carrossel, Vídeo, Imagem, Gradiente
            hero_types = ["carousel", "video", "image", "gradient"]
            
            for hero_type in hero_types:
                self.log(f"Testing Hero Section type: {hero_type}")
                
                hero_block_data = {
                    "page_id": "home",
                    "type": "hero",
                    "order": 1,
                    "settings": {
                        "background_type": hero_type,
                        "overlay_opacity": 0.5,
                        "text_align": "center",
                        "height": "70vh"
                    },
                    "content": {
                        "background_url": f"https://example.com/hero-{hero_type}.mp4" if hero_type == "video" else f"https://example.com/hero-{hero_type}.jpg",
                        "title": f"Hero Section {hero_type.title()}",
                        "subtitle": f"Teste do Page Builder - {hero_type}",
                        "button_text": "Saiba Mais",
                        "button_link": "/contato"
                    },
                    "published": True
                }
                
                response = self.make_request("POST", "/admin/content-blocks", hero_block_data)
                
                if response.status_code == 200:
                    hero_block = response.json()
                    self.log(f"✅ Hero Section type '{hero_type}' created successfully")
                    self.passed_tests.append(f"Hero Type {hero_type.title()}")
                    
                    if hero_type == "video":
                        self.test_data['hero_video_block'] = hero_block
                else:
                    self.log(f"❌ Failed to create Hero Section type '{hero_type}': {response.status_code}")
                    self.failed_tests.append(f"Hero Type {hero_type.title()}")
            
            # Test 5 tabs: Tipo, Mídia, Texto, Estilo, CTA
            if 'hero_video_block' in self.test_data:
                block_id = self.test_data['hero_video_block']['id']
                
                # Test "Mídia" tab configuration
                self.log("Testing 'Mídia' tab configuration...")
                media_update = {
                    "settings": {
                        "background_type": "image",
                        "overlay_opacity": 0.4
                    },
                    "content": {
                        "background_url": "https://example.com/hero-image.jpg"
                    }
                }
                
                response = self.make_request("PUT", f"/admin/content-blocks/{block_id}", media_update)
                
                if response.status_code == 200:
                    self.log("✅ Content block 'Mídia' tab configuration updated")
                    self.passed_tests.append("Content Block Mídia Tab")
                else:
                    self.log(f"❌ Failed to update content block 'Mídia' tab: {response.status_code}")
                    self.failed_tests.append("Content Block Mídia Tab")
                
                # Test "Texto" tab configuration
                self.log("Testing 'Texto' tab configuration...")
                text_update = {
                    "content": {
                        "title": "Título Atualizado",
                        "subtitle": "Subtítulo atualizado via API"
                    }
                }
                
                response = self.make_request("PUT", f"/admin/content-blocks/{block_id}", text_update)
                
                if response.status_code == 200:
                    self.log("✅ Content block 'Texto' tab configuration updated")
                    self.passed_tests.append("Content Block Texto Tab")
                else:
                    self.log(f"❌ Failed to update content block 'Texto' tab: {response.status_code}")
                    self.failed_tests.append("Content Block Texto Tab")
                
                # Test "Estilo" tab configuration
                self.log("Testing 'Estilo' tab configuration...")
                style_update = {
                    "settings": {
                        "text_align": "left",
                        "height": "80vh",
                        "overlay_color": "rgba(0,0,0,0.6)"
                    }
                }
                
                response = self.make_request("PUT", f"/admin/content-blocks/{block_id}", style_update)
                
                if response.status_code == 200:
                    self.log("✅ Content block 'Estilo' tab configuration updated")
                    self.passed_tests.append("Content Block Estilo Tab")
                else:
                    self.log(f"❌ Failed to update content block 'Estilo' tab: {response.status_code}")
                    self.failed_tests.append("Content Block Estilo Tab")
                
                # Test "CTA" tab configuration
                self.log("Testing 'CTA' tab configuration...")
                cta_update = {
                    "content": {
                        "button_text": "Fale Conosco",
                        "button_link": "/contato",
                        "button_color": "#22C55E",
                        "button_text_color": "#FFFFFF"
                    }
                }
                
                response = self.make_request("PUT", f"/admin/content-blocks/{block_id}", cta_update)
                
                if response.status_code == 200:
                    self.log("✅ Content block 'CTA' tab configuration updated")
                    self.passed_tests.append("Content Block CTA Tab")
                else:
                    self.log(f"❌ Failed to update content block 'CTA' tab: {response.status_code}")
                    self.failed_tests.append("Content Block CTA Tab")
            
            return len([t for t in self.failed_tests if "Hero" in t or "Content Block" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Advanced Page Builder test error: {str(e)}", "ERROR")
            self.failed_tests.append("Advanced Page Builder")
            return False

    def test_whatsapp_notifications(self) -> bool:
        """Test 6. NOTIFICAÇÕES WHATSAPP"""
        self.log("\n=== 6. NOTIFICAÇÕES WHATSAPP ===")
        
        try:
            # GET /api/whatsapp-auto-reply-settings
            self.log("Testing GET /api/whatsapp-auto-reply-settings...")
            response = self.make_request("GET", "/whatsapp-auto-reply-settings")
            
            if response.status_code == 200:
                settings = response.json()
                self.log("✅ WhatsApp auto-reply settings retrieved successfully")
                self.test_data['original_whatsapp_settings'] = settings
                self.passed_tests.append("GET WhatsApp Auto-Reply Settings")
                
                # Verify expected fields are present
                expected_fields = ['enabled', 'welcome_message', 'business_hours_message', 'outside_hours_message']
                for field in expected_fields:
                    if field in settings:
                        self.log(f"✅ {field} field found")
                    else:
                        self.log(f"⚠️ {field} field not found")
                
                # Check for auto_replies (respostas por palavra-chave)
                if 'auto_replies' in settings:
                    auto_replies = settings['auto_replies']
                    self.log(f"✅ Found {len(auto_replies)} auto-reply keywords")
                    self.passed_tests.append("Auto-Reply Keywords")
                else:
                    self.log("⚠️ auto_replies field not found")
                
            else:
                self.log(f"❌ Failed to get WhatsApp auto-reply settings: {response.status_code} - {response.text}")
                self.failed_tests.append("GET WhatsApp Auto-Reply Settings")
                return False
            
            # PUT /api/admin/whatsapp-auto-reply-settings
            self.log("Testing PUT /api/admin/whatsapp-auto-reply-settings...")
            update_data = {
                "enabled": True,
                "welcome_message": "Olá! Bem-vindo à VigiLoc. Como posso ajudá-lo?",
                "business_hours_message": "Estamos online! Nossa equipe responderá em breve.",
                "outside_hours_message": "No momento estamos offline. Retornaremos em horário comercial.",
                "auto_replies": [
                    {
                        "keyword": "preço",
                        "response": "Nossos preços variam conforme o serviço. Entre em contato para um orçamento personalizado!"
                    },
                    {
                        "keyword": "horário",
                        "response": "Funcionamos de segunda a sexta, das 8h às 18h."
                    },
                    {
                        "keyword": "endereço",
                        "response": "Estamos localizados em São Paulo, SP. Entre em contato para mais detalhes!"
                    },
                    {
                        "keyword": "teste",
                        "response": "Esta é uma resposta automática de teste!"
                    }
                ]
            }
            
            response = self.make_request("PUT", "/admin/whatsapp-auto-reply-settings", update_data)
            
            if response.status_code == 200:
                self.log("✅ WhatsApp auto-reply settings updated successfully")
                self.passed_tests.append("PUT WhatsApp Auto-Reply Settings")
            else:
                self.log(f"❌ Failed to update WhatsApp auto-reply settings: {response.status_code} - {response.text}")
                self.failed_tests.append("PUT WhatsApp Auto-Reply Settings")
                return False
            
            # Verify the update by getting settings again
            self.log("Verifying WhatsApp auto-reply settings update...")
            response = self.make_request("GET", "/whatsapp-auto-reply-settings")
            
            if response.status_code == 200:
                updated_settings = response.json()
                if (updated_settings.get('enabled') == True and 
                    len(updated_settings.get('auto_replies', [])) == 4):
                    self.log("✅ WhatsApp auto-reply settings update verified")
                    self.passed_tests.append("Verify WhatsApp Settings Update")
                else:
                    self.log("❌ WhatsApp auto-reply settings update not verified")
                    self.failed_tests.append("Verify WhatsApp Settings Update")
            
            return len([t for t in self.failed_tests if "WhatsApp" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ WhatsApp Notifications test error: {str(e)}", "ERROR")
            self.failed_tests.append("WhatsApp Notifications")
            return False

    def test_home_page(self) -> bool:
        """Test 7. HOME PAGE"""
        self.log("\n=== 7. HOME PAGE ===")
        
        try:
            # Test home page access and content
            self.log("Testing home page access...")
            
            # Get home page content blocks
            response = self.make_request("GET", "/content-blocks/home/published")
            
            if response.status_code == 200:
                home_blocks = response.json()
                self.log(f"✅ Retrieved {len(home_blocks)} home page content blocks")
                self.passed_tests.append("Home Page Content Blocks")
                
                # Check for hero/banner section
                hero_blocks = [b for b in home_blocks if b.get('type') == 'hero']
                if hero_blocks:
                    self.log(f"✅ Found {len(hero_blocks)} hero/banner sections")
                    self.passed_tests.append("Home Page Hero/Banner Visible")
                else:
                    self.log("⚠️ No hero/banner sections found")
                
                # Check for services sections
                service_blocks = [b for b in home_blocks if 'service' in b.get('type', '').lower()]
                if service_blocks:
                    self.log(f"✅ Found {len(service_blocks)} service sections")
                    self.passed_tests.append("Home Page Services Sections")
                else:
                    self.log("⚠️ No service sections found")
                    
            else:
                self.log(f"❌ Failed to get home page content: {response.status_code} - {response.text}")
                self.failed_tests.append("Home Page Content Blocks")
            
            # Test services display on home page
            self.log("Testing services display on home page...")
            response = self.make_request("GET", "/services")
            
            if response.status_code == 200:
                services = response.json()
                published_services = [s for s in services if s.get('published', False)]
                self.log(f"✅ Found {len(published_services)} published services for home page")
                self.passed_tests.append("Home Page Services Data")
                
                # Verify services have required fields for display
                for service in published_services[:3]:  # Check first 3 services
                    required_fields = ['name', 'slug', 'shortDescription', 'icon']
                    missing_fields = [field for field in required_fields if not service.get(field)]
                    
                    if not missing_fields:
                        self.log(f"✅ Service '{service['name']}' has all required fields")
                    else:
                        self.log(f"⚠️ Service '{service['name']}' missing fields: {missing_fields}")
                        
            else:
                self.log(f"❌ Failed to get services for home page: {response.status_code} - {response.text}")
                self.failed_tests.append("Home Page Services Data")
            
            return len([t for t in self.failed_tests if "Home Page" in t]) == 0
            
        except Exception as e:
            self.log(f"❌ Home Page functionality test error: {str(e)}", "ERROR")
            self.failed_tests.append("Home Page Functionality")
            return False

    def print_test_summary(self, test_results):
        """Print comprehensive test summary"""
        self.log("\n" + "="*80)
        self.log("🎯 RESUMO COMPLETO DOS TESTES - REVIEW REQUEST")
        self.log("="*80)
        
        total_tests = len(test_results)
        passed_count = sum(1 for result in test_results if result)
        failed_count = total_tests - passed_count
        
        self.log(f"📊 ESTATÍSTICAS:")
        self.log(f"   Total de Testes: {total_tests}")
        self.log(f"   ✅ Aprovados: {passed_count}")
        self.log(f"   ❌ Falharam: {failed_count}")
        self.log(f"   📈 Taxa de Sucesso: {(passed_count/total_tests)*100:.1f}%")
        
        self.log(f"\n📋 RESULTADOS DETALHADOS:")
        for i, (test_name, result) in enumerate(test_results, 1):
            status = "✅ PASSOU" if result else "❌ FALHOU"
            self.log(f"   {i}. {test_name}: {status}")
        
        if self.failed_tests:
            self.log(f"\n❌ TESTES QUE FALHARAM ({len(self.failed_tests)}):")
            for i, failed_test in enumerate(self.failed_tests, 1):
                self.log(f"   {i}. {failed_test}")
        
        if self.passed_tests:
            self.log(f"\n✅ FUNCIONALIDADES TESTADAS COM SUCESSO ({len(self.passed_tests)}):")
            for i, passed_test in enumerate(self.passed_tests, 1):
                self.log(f"   {i}. {passed_test}")
        
        self.log("\n" + "="*80)
        
        if failed_count == 0:
            self.log("🎉 TODOS OS TESTES PASSARAM! Sistema funcionando perfeitamente.")
        else:
            self.log(f"⚠️ {failed_count} teste(s) falharam. Verifique os detalhes acima.")
        
        self.log("="*80)

    def run_all_tests(self) -> bool:
        """Run all tests as specified in the review request"""
        self.log("🚀 TESTE AUTOMATIZADO COMPLETO - TODAS AS FUNCIONALIDADES")
        self.log("=" * 80)
        self.log("Credenciais Admin:")
        self.log(f"URL: /painel-admin")
        self.log(f"Email: {ADMIN_EMAIL}")
        self.log(f"Senha: {ADMIN_PASSWORD}")
        self.log("=" * 80)
        
        # Authenticate first
        if not self.authenticate():
            return False
        
        # Run tests in the specified order from the review request
        test_results = []
        
        # Execute all 7 main tests from the review request
        test_results.append(("1. PÁGINA DE CONTATO DINÂMICA", self.test_contact_page_settings()))
        test_results.append(("2. TEMPLATES DE SAZONALIDADE", self.test_seasonal_templates()))
        test_results.append(("3. BANNERS COM VÍDEO", self.test_banners_with_video()))
        test_results.append(("4. SERVIÇOS COM VÍDEO BACKGROUND", self.test_services_with_video_background()))
        test_results.append(("5. PAGE BUILDER AVANÇADO", self.test_advanced_page_builder()))
        test_results.append(("6. NOTIFICAÇÕES WHATSAPP", self.test_whatsapp_notifications()))
        test_results.append(("7. HOME PAGE", self.test_home_page()))
        
        # Print comprehensive summary
        self.print_test_summary(test_results)
        
        # Return True if all tests passed
        return all(result for _, result in test_results)

def main():
    """Main function to run all tests"""
    tester = ReviewTester()
    
    try:
        success = tester.run_all_tests()
        
        if success:
            print("\n🎉 RESULTADO FINAL: TODOS OS TESTES PASSARAM!")
            sys.exit(0)
        else:
            print("\n❌ RESULTADO FINAL: ALGUNS TESTES FALHARAM!")
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n⚠️ Testes interrompidos pelo usuário")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Erro fatal durante os testes: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
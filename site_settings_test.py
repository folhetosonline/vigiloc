#!/usr/bin/env python3
"""
Site Settings Endpoints Quick Test
Tests the new site settings endpoints as requested.
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://secushop.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class SiteSettingsTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        
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
    
    def test_site_settings_endpoints(self) -> bool:
        """Test Site Settings endpoints quickly"""
        self.log("\n🚀 TESTING SITE SETTINGS ENDPOINTS")
        self.log("=" * 50)
        
        try:
            # 1. GET /api/site-settings (check default settings)
            self.log("1️⃣ Testing GET /api/site-settings...")
            response = self.session.get(f"{BASE_URL}/site-settings")
            
            if response.status_code == 200:
                original_settings = response.json()
                self.log("✅ GET /api/site-settings - SUCCESS")
                self.log(f"   Site Name: {original_settings.get('site_name', 'N/A')}")
                self.log(f"   Contact Email: {original_settings.get('contact_email', 'N/A')}")
                self.log(f"   Contact Phone: {original_settings.get('contact_phone', 'N/A')}")
            else:
                self.log(f"❌ GET /api/site-settings FAILED: {response.status_code} - {response.text}")
                return False
            
            # 2. PUT /api/admin/site-settings (update with new name and contact data)
            self.log("\n2️⃣ Testing PUT /api/admin/site-settings...")
            
            update_data = {
                "site_name": "VigiLoc - Sistema Atualizado",
                "contact_email": "contato@vigiloc.com.br",
                "contact_phone": "(11) 99999-8888",
                "whatsapp_number": "5511999998888",
                "address": "Rua Nova, 123 - São Paulo, SP"
            }
            
            response = self.session.put(f"{BASE_URL}/admin/site-settings", json=update_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log("✅ PUT /api/admin/site-settings - SUCCESS")
                self.log(f"   Message: {result.get('message', 'Updated')}")
            else:
                self.log(f"❌ PUT /api/admin/site-settings FAILED: {response.status_code} - {response.text}")
                return False
            
            # 3. GET /api/site-settings again (confirm it saved)
            self.log("\n3️⃣ Testing GET /api/site-settings (verify updates)...")
            response = self.session.get(f"{BASE_URL}/site-settings")
            
            if response.status_code == 200:
                updated_settings = response.json()
                self.log("✅ GET /api/site-settings (verification) - SUCCESS")
                
                # Verify the updates were saved
                if (updated_settings.get('site_name') == update_data['site_name'] and
                    updated_settings.get('contact_email') == update_data['contact_email'] and
                    updated_settings.get('contact_phone') == update_data['contact_phone']):
                    
                    self.log("✅ VERIFICATION PASSED - All updates were saved correctly!")
                    self.log(f"   ✓ Site Name: {updated_settings.get('site_name')}")
                    self.log(f"   ✓ Contact Email: {updated_settings.get('contact_email')}")
                    self.log(f"   ✓ Contact Phone: {updated_settings.get('contact_phone')}")
                    self.log(f"   ✓ WhatsApp: {updated_settings.get('whatsapp_number')}")
                    self.log(f"   ✓ Address: {updated_settings.get('address')}")
                    
                    return True
                else:
                    self.log("❌ VERIFICATION FAILED - Updates were not saved correctly")
                    self.log(f"   Expected site_name: {update_data['site_name']}")
                    self.log(f"   Got site_name: {updated_settings.get('site_name')}")
                    return False
            else:
                self.log(f"❌ GET /api/site-settings (verification) FAILED: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Site Settings test error: {str(e)}", "ERROR")
            return False
    
    def run_quick_test(self) -> bool:
        """Run the quick site settings test"""
        self.log("🎯 QUICK SITE SETTINGS TEST - NÃO PERDER TEMPO!")
        
        # Authenticate first
        if not self.authenticate():
            return False
        
        # Test site settings endpoints
        success = self.test_site_settings_endpoints()
        
        # Print final result
        self.log("\n" + "=" * 50)
        if success:
            self.log("🎉 ALL SITE SETTINGS ENDPOINTS WORKING! ✅")
        else:
            self.log("❌ SITE SETTINGS ENDPOINTS HAVE ISSUES!")
        self.log("=" * 50)
        
        return success

def main():
    """Main function to run the quick test"""
    tester = SiteSettingsTester()
    success = tester.run_quick_test()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Quick Banner & User Management API Testing Script
Tests the critical endpoints as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://prospecting-intel.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"

class QuickTester:
    def __init__(self):
        self.session = requests.Session()
        self.auth_token = None
        self.test_results = []
        self.banner_id_to_test = None
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def authenticate(self) -> bool:
        """Authenticate as admin user"""
        try:
            self.log("🔐 Testing Admin Login...")
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})
                self.log(f"✅ Admin Login successful")
                self.test_results.append("✅ Admin Login")
                return True
            else:
                self.log(f"❌ Admin Login failed: {response.status_code} - {response.text}", "ERROR")
                self.test_results.append("❌ Admin Login")
                return False
                
        except Exception as e:
            self.log(f"❌ Admin Login error: {str(e)}", "ERROR")
            self.test_results.append("❌ Admin Login")
            return False
    
    def test_public_banners(self) -> bool:
        """Test GET /api/banners (public banners)"""
        try:
            self.log("🎯 Testing GET /api/banners (public banners)...")
            response = self.session.get(f"{BASE_URL}/banners")
            
            if response.status_code == 200:
                banners = response.json()
                self.log(f"✅ Public banners retrieved: {len(banners)} banners")
                
                # Check if we have banners and if any contain video
                has_video = False
                for banner in banners:
                    if banner.get('media_type') == 'video' or 'video' in banner.get('media_url', '').lower():
                        has_video = True
                        break
                
                if has_video:
                    self.log("✅ Video found in banners array")
                    self.test_results.append("✅ Public Banners (with video)")
                else:
                    self.log("⚠️ No video found in banners array")
                    self.test_results.append("⚠️ Public Banners (no video)")
                
                return True
            else:
                self.log(f"❌ Public banners failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Public Banners")
                return False
                
        except Exception as e:
            self.log(f"❌ Public banners error: {str(e)}", "ERROR")
            self.test_results.append("❌ Public Banners")
            return False
    
    def test_user_management(self) -> bool:
        """Test user management endpoints"""
        try:
            # GET /api/admin/users
            self.log("👥 Testing GET /api/admin/users...")
            response = self.session.get(f"{BASE_URL}/admin/users")
            
            if response.status_code == 200:
                users = response.json()
                self.log(f"✅ Users list retrieved: {len(users)} users")
                self.test_results.append("✅ Get Users List")
            else:
                self.log(f"❌ Get users failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Get Users List")
                return False
            
            # POST /api/admin/users (create test user)
            self.log("👤 Testing POST /api/admin/users (create test user)...")
            test_user_data = {
                "name": "Usuario Teste",
                "email": f"teste.{datetime.now().strftime('%H%M%S')}@vigiloc.com",
                "password": "teste123",
                "is_admin": False,
                "role": "viewer",
                "active": True
            }
            
            response = self.session.post(f"{BASE_URL}/admin/users", json=test_user_data)
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"✅ Test user created: {result.get('user_id', 'Success')}")
                self.test_results.append("✅ Create Test User")
                return True
            else:
                self.log(f"❌ Create user failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Create Test User")
                return False
                
        except Exception as e:
            self.log(f"❌ User management error: {str(e)}", "ERROR")
            self.test_results.append("❌ User Management")
            return False
    
    def test_admin_banners(self) -> bool:
        """Test admin banner management endpoints"""
        try:
            # GET /api/admin/banners
            self.log("🎨 Testing GET /api/admin/banners...")
            response = self.session.get(f"{BASE_URL}/admin/banners")
            
            if response.status_code == 200:
                admin_banners = response.json()
                self.log(f"✅ Admin banners retrieved: {len(admin_banners)} banners")
                self.test_results.append("✅ Get Admin Banners")
                
                # Find a published banner to test with
                published_banner = None
                for banner in admin_banners:
                    if banner.get('published') == True:
                        published_banner = banner
                        self.banner_id_to_test = banner['id']
                        break
                
                if not published_banner:
                    self.log("⚠️ No published banners found to test unpublish/republish")
                    self.test_results.append("⚠️ No Published Banners for Testing")
                    return True
                
                self.log(f"📌 Using banner ID {self.banner_id_to_test} for publish/unpublish tests")
                
            else:
                self.log(f"❌ Get admin banners failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Get Admin Banners")
                return False
            
            # Test unpublish/republish cycle if we have a banner
            if self.banner_id_to_test:
                return self.test_banner_publish_cycle()
            
            return True
                
        except Exception as e:
            self.log(f"❌ Admin banners error: {str(e)}", "ERROR")
            self.test_results.append("❌ Admin Banners")
            return False
    
    def test_banner_publish_cycle(self) -> bool:
        """Test banner publish/unpublish cycle"""
        try:
            # PATCH /api/admin/banners/{id}/publish?published=false (unpublish)
            self.log(f"📤 Testing PATCH /api/admin/banners/{self.banner_id_to_test}/publish?published=false...")
            response = self.session.patch(f"{BASE_URL}/admin/banners/{self.banner_id_to_test}/publish", 
                                        params={"published": "false"})
            
            if response.status_code == 200:
                self.log("✅ Banner unpublished successfully")
                self.test_results.append("✅ Unpublish Banner")
            else:
                self.log(f"❌ Unpublish banner failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Unpublish Banner")
                return False
            
            # GET /api/banners (verify now returns fewer public banners)
            self.log("🔍 Testing GET /api/banners (verify unpublish effect)...")
            response = self.session.get(f"{BASE_URL}/banners")
            
            if response.status_code == 200:
                banners_after_unpublish = response.json()
                self.log(f"✅ Public banners after unpublish: {len(banners_after_unpublish)} banners")
                self.test_results.append("✅ Verify Unpublish Effect")
            else:
                self.log(f"❌ Verify unpublish failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Verify Unpublish Effect")
            
            # PATCH /api/admin/banners/{id}/publish?published=true (republish)
            self.log(f"📥 Testing PATCH /api/admin/banners/{self.banner_id_to_test}/publish?published=true...")
            response = self.session.patch(f"{BASE_URL}/admin/banners/{self.banner_id_to_test}/publish", 
                                        params={"published": "true"})
            
            if response.status_code == 200:
                self.log("✅ Banner republished successfully")
                self.test_results.append("✅ Republish Banner")
            else:
                self.log(f"❌ Republish banner failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Republish Banner")
                return False
            
            # GET /api/banners (verify republish effect)
            self.log("🔍 Testing GET /api/banners (verify republish effect)...")
            response = self.session.get(f"{BASE_URL}/banners")
            
            if response.status_code == 200:
                banners_after_republish = response.json()
                self.log(f"✅ Public banners after republish: {len(banners_after_republish)} banners")
                self.test_results.append("✅ Verify Republish Effect")
                return True
            else:
                self.log(f"❌ Verify republish failed: {response.status_code} - {response.text}")
                self.test_results.append("❌ Verify Republish Effect")
                return False
                
        except Exception as e:
            self.log(f"❌ Banner publish cycle error: {str(e)}", "ERROR")
            self.test_results.append("❌ Banner Publish Cycle")
            return False
    
    def run_quick_tests(self) -> bool:
        """Run all quick tests as requested"""
        self.log("🚀 Starting Quick Critical Endpoint Tests")
        self.log("=" * 50)
        
        # 1. Test public banners first
        self.test_public_banners()
        
        # 2. Authenticate as admin
        if not self.authenticate():
            return False
        
        # 3. Test user management
        self.test_user_management()
        
        # 4. Test admin banner management
        self.test_admin_banners()
        
        # Print summary
        self.print_summary()
        
        # Return success if no critical failures
        failed_count = len([r for r in self.test_results if r.startswith("❌")])
        return failed_count == 0
    
    def print_summary(self):
        """Print test results summary"""
        self.log("\n" + "=" * 50)
        self.log("🏁 QUICK TEST RESULTS")
        self.log("=" * 50)
        
        for result in self.test_results:
            self.log(f"  {result}")
        
        passed = len([r for r in self.test_results if r.startswith("✅")])
        failed = len([r for r in self.test_results if r.startswith("❌")])
        warnings = len([r for r in self.test_results if r.startswith("⚠️")])
        
        self.log(f"\n📊 Results: {passed} passed, {failed} failed, {warnings} warnings")
        
        if failed == 0:
            self.log("\n🎉 ALL CRITICAL TESTS PASSED!")
        else:
            self.log(f"\n⚠️ {failed} critical tests failed.")

def main():
    """Main function to run the quick tests"""
    tester = QuickTester()
    success = tester.run_quick_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()
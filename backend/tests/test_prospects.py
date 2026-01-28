"""
Prospects CRUD API Tests
Tests for the Prospect creation, listing, updating, and deletion features
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"


class TestProspectsAuth:
    """Test authentication for prospects endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip(f"Authentication failed: {response.status_code}")
        token = response.json().get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_login_success(self):
        """Test admin login works"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["user"]["is_admin"] == True


class TestTiposPortaria:
    """Test tipos-portaria endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_get_tipos_portaria(self, auth_headers):
        """Test GET /api/admin/prospecting/tipos-portaria returns portaria types"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/tipos-portaria",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get tipos-portaria failed: {response.text}"
        
        data = response.json()
        assert isinstance(data, dict), "Should return a dictionary"
        
        # Verify expected types exist
        expected_types = ["porteiro_24h", "portaria_remota", "sem_portaria", "porteiro_diurno", "misto", "empresa"]
        for tipo in expected_types:
            assert tipo in data, f"Missing tipo: {tipo}"
            assert "nome" in data[tipo], f"Missing nome for {tipo}"
            assert "prioridade" in data[tipo], f"Missing prioridade for {tipo}"


class TestProspectsCRUD:
    """Test prospects CRUD operations"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    @pytest.fixture(scope="class")
    def created_prospect_id(self, auth_headers):
        """Create a test prospect and return its ID for other tests"""
        unique_name = f"TEST_Condominio_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/prospects",
            headers=auth_headers,
            json={
                "nome": unique_name,
                "tipo": "condominio",
                "cidade": "Santos",
                "bairro": "Gonzaga",
                "endereco": "Av. Ana Costa, 123",
                "telefone": "(13) 99999-1234",
                "email": "test@condominio.com",
                "tipo_portaria": "porteiro_24h",
                "unidades": 50,
                "torres": 2,
                "sindico": "João Silva",
                "administradora": "Admin Test",
                "valor_estimado": 5000,
                "notas": "Prospect de teste"
            }
        )
        if response.status_code == 200:
            return response.json().get("id")
        pytest.skip(f"Failed to create test prospect: {response.text}")
    
    def test_create_prospect_manual(self, auth_headers):
        """Test POST /api/admin/prospecting/prospects creates a new prospect"""
        unique_name = f"TEST_Residencial_{uuid.uuid4().hex[:8]}"
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/prospects",
            headers=auth_headers,
            json={
                "nome": unique_name,
                "tipo": "condominio",
                "cidade": "Santos",
                "bairro": "Boqueirão",
                "endereco": "Rua Conselheiro Nébias, 456",
                "telefone": "(13) 98888-5678",
                "email": "contato@residencial.com",
                "tipo_portaria": "portaria_remota",
                "unidades": 80,
                "torres": 3,
                "sindico": "Maria Santos",
                "administradora": "Administradora XYZ",
                "valor_estimado": 8000,
                "notas": "Prospect criado via teste automatizado"
            }
        )
        assert response.status_code == 200, f"Create prospect failed: {response.text}"
        
        prospect = response.json()
        
        # Verify prospect structure
        assert "id" in prospect, "Missing id"
        assert prospect["nome"] == unique_name, "Nome mismatch"
        assert prospect["tipo"] == "condominio", "Tipo mismatch"
        assert prospect["cidade"] == "Santos", "Cidade mismatch"
        assert prospect["bairro"] == "Boqueirão", "Bairro mismatch"
        assert prospect["tipo_portaria"] == "portaria_remota", "Tipo portaria mismatch"
        assert prospect["unidades"] == 80, "Unidades mismatch"
        assert prospect["interesse"] == "nao_contatado", "Default interesse should be nao_contatado"
        assert prospect["origem"] == "manual", "Origem should be manual"
        assert "created_at" in prospect, "Missing created_at"
        assert "historico" in prospect, "Missing historico"
        
        # Cleanup - delete the created prospect
        requests.delete(
            f"{BASE_URL}/api/admin/prospecting/prospects/{prospect['id']}",
            headers=auth_headers
        )
    
    def test_get_prospects_list(self, auth_headers):
        """Test GET /api/admin/prospecting/prospects returns list of prospects"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get prospects failed: {response.text}"
        
        prospects = response.json()
        assert isinstance(prospects, list), "Should return a list"
    
    def test_get_prospects_with_cidade_filter(self, auth_headers, created_prospect_id):
        """Test GET /api/admin/prospecting/prospects with cidade filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects?cidade=Santos",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get prospects with filter failed: {response.text}"
        
        prospects = response.json()
        assert isinstance(prospects, list), "Should return a list"
        
        # All returned prospects should be from Santos
        for prospect in prospects:
            assert prospect["cidade"] == "Santos", f"Prospect {prospect['id']} is not from Santos"
    
    def test_get_prospects_with_tipo_portaria_filter(self, auth_headers, created_prospect_id):
        """Test GET /api/admin/prospecting/prospects with tipo_portaria filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects?tipo_portaria=porteiro_24h",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get prospects with filter failed: {response.text}"
        
        prospects = response.json()
        assert isinstance(prospects, list), "Should return a list"
        
        # All returned prospects should have porteiro_24h
        for prospect in prospects:
            assert prospect["tipo_portaria"] == "porteiro_24h", f"Prospect {prospect['id']} has wrong tipo_portaria"
    
    def test_get_prospects_with_interesse_filter(self, auth_headers):
        """Test GET /api/admin/prospecting/prospects with interesse filter"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects?interesse=nao_contatado",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get prospects with filter failed: {response.text}"
        
        prospects = response.json()
        assert isinstance(prospects, list), "Should return a list"
    
    def test_update_prospect(self, auth_headers, created_prospect_id):
        """Test PUT /api/admin/prospecting/prospects/{id} updates a prospect"""
        response = requests.put(
            f"{BASE_URL}/api/admin/prospecting/prospects/{created_prospect_id}",
            headers=auth_headers,
            json={
                "interesse": "interessado",
                "valor_estimado": 7500,
                "notas": "Prospect atualizado via teste"
            }
        )
        assert response.status_code == 200, f"Update prospect failed: {response.text}"
        
        prospect = response.json()
        assert prospect["interesse"] == "interessado", "Interesse not updated"
        assert prospect["valor_estimado"] == 7500, "Valor estimado not updated"
        assert "updated_at" in prospect, "Missing updated_at"
    
    def test_update_prospect_not_found(self, auth_headers):
        """Test PUT /api/admin/prospecting/prospects/{id} returns 404 for non-existent prospect"""
        response = requests.put(
            f"{BASE_URL}/api/admin/prospecting/prospects/non_existent_id_12345",
            headers=auth_headers,
            json={"interesse": "interessado"}
        )
        assert response.status_code == 404, f"Should return 404, got: {response.status_code}"
    
    def test_delete_prospect(self, auth_headers):
        """Test DELETE /api/admin/prospecting/prospects/{id} deletes a prospect"""
        # First create a prospect to delete
        unique_name = f"TEST_ToDelete_{uuid.uuid4().hex[:8]}"
        create_response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/prospects",
            headers=auth_headers,
            json={
                "nome": unique_name,
                "tipo": "condominio",
                "cidade": "Guarujá",
                "bairro": "Pitangueiras",
                "tipo_portaria": "sem_portaria"
            }
        )
        assert create_response.status_code == 200, f"Create failed: {create_response.text}"
        prospect_id = create_response.json()["id"]
        
        # Now delete it
        delete_response = requests.delete(
            f"{BASE_URL}/api/admin/prospecting/prospects/{prospect_id}",
            headers=auth_headers
        )
        assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
        
        # Verify it's deleted by trying to get it
        get_response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects/{prospect_id}",
            headers=auth_headers
        )
        assert get_response.status_code == 404, "Prospect should not exist after deletion"
    
    def test_delete_prospect_not_found(self, auth_headers):
        """Test DELETE /api/admin/prospecting/prospects/{id} returns 404 for non-existent prospect"""
        response = requests.delete(
            f"{BASE_URL}/api/admin/prospecting/prospects/non_existent_id_12345",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Should return 404, got: {response.status_code}"


class TestProspectsStats:
    """Test prospects statistics endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_get_prospects_stats(self, auth_headers):
        """Test GET /api/admin/prospecting/prospects-stats returns statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/prospects-stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        
        stats = response.json()
        
        # Verify structure
        assert "total" in stats, "Missing total"
        assert "by_interesse" in stats, "Missing by_interesse"
        assert "by_cidade" in stats, "Missing by_cidade"
        assert "by_tipo_portaria" in stats, "Missing by_tipo_portaria"
        assert "tipos_portaria" in stats, "Missing tipos_portaria"
        
        # Verify by_interesse has expected keys
        expected_interesse = ["nao_contatado", "interessado", "negociando", "fechado", "descartado"]
        for interesse in expected_interesse:
            assert interesse in stats["by_interesse"], f"Missing interesse: {interesse}"


class TestProspectsScraping:
    """Test prospects scraping endpoint"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get authentication headers"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        token = response.json().get("token")
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_scrape_prospects(self, auth_headers):
        """Test POST /api/admin/prospecting/scrape creates prospects from scraping"""
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/scrape",
            headers=auth_headers,
            json={
                "cidade": "Santos",
                "bairro": "Gonzaga",
                "tipo": "condominio",
                "max_results": 3
            },
            timeout=60  # Scraping can take time
        )
        assert response.status_code == 200, f"Scrape failed: {response.text}"
        
        result = response.json()
        
        # Verify structure
        assert "total_scraped" in result, "Missing total_scraped"
        assert "total_created" in result, "Missing total_created"
        assert "prospects" in result, "Missing prospects"
        assert "source" in result, "Missing source"
        assert result["source"] == "scraping", "Source should be scraping"
        assert "cidade" in result, "Missing cidade"
        assert result["cidade"] == "Santos", "Cidade mismatch"


class TestProspectsRequiresAuth:
    """Test that prospects endpoints require authentication"""
    
    def test_get_prospects_requires_auth(self):
        """Test GET /api/admin/prospecting/prospects requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/prospecting/prospects")
        assert response.status_code == 401, "Should require authentication"
    
    def test_create_prospect_requires_auth(self):
        """Test POST /api/admin/prospecting/prospects requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/prospects",
            json={"nome": "Test", "cidade": "Santos"}
        )
        assert response.status_code == 401, "Should require authentication"
    
    def test_update_prospect_requires_auth(self):
        """Test PUT /api/admin/prospecting/prospects/{id} requires auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/prospecting/prospects/some_id",
            json={"interesse": "interessado"}
        )
        assert response.status_code == 401, "Should require authentication"
    
    def test_delete_prospect_requires_auth(self):
        """Test DELETE /api/admin/prospecting/prospects/{id} requires auth"""
        response = requests.delete(f"{BASE_URL}/api/admin/prospecting/prospects/some_id")
        assert response.status_code == 401, "Should require authentication"
    
    def test_get_stats_requires_auth(self):
        """Test GET /api/admin/prospecting/prospects-stats requires auth"""
        response = requests.get(f"{BASE_URL}/api/admin/prospecting/prospects-stats")
        assert response.status_code == 401, "Should require authentication"
    
    def test_scrape_requires_auth(self):
        """Test POST /api/admin/prospecting/scrape requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/scrape",
            json={"cidade": "Santos"}
        )
        assert response.status_code == 401, "Should require authentication"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

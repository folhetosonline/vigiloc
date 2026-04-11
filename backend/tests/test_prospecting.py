"""
Prospecting Intel API Tests
Tests for the Prospecção Intel feature - sales prospecting with IBGE and SSP-SP data
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@vigiloc.com"
ADMIN_PASSWORD = "admin123"


class TestProspectingAuth:
    """Test authentication for prospecting endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get authentication token for admin user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    @pytest.fixture(scope="class")
    def auth_headers(self, auth_token):
        """Get headers with auth token"""
        return {
            "Authorization": f"Bearer {auth_token}",
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
        assert "user" in data
        assert data["user"]["is_admin"] == True


class TestProspectingDashboard:
    """Test prospecting dashboard endpoint"""
    
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
    
    def test_dashboard_returns_valid_data(self, auth_headers):
        """Test GET /api/admin/prospecting/dashboard returns valid data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/dashboard",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "region_stats" in data, "Missing region_stats"
        assert "seasonality" in data, "Missing seasonality"
        assert "metrics" in data, "Missing metrics"
        
        # Verify region_stats structure
        region_stats = data["region_stats"]
        assert "municipios" in region_stats, "Missing municipios in region_stats"
        assert "totals" in region_stats, "Missing totals in region_stats"
        assert len(region_stats["municipios"]) > 0, "No municipios returned"
        
        # Verify municipio data structure
        municipio = region_stats["municipios"][0]
        assert "nome" in municipio, "Missing nome in municipio"
        assert "populacao" in municipio, "Missing populacao in municipio"
        assert "indice_oportunidade" in municipio, "Missing indice_oportunidade"
        
        # Verify seasonality structure
        seasonality = data["seasonality"]
        assert "periodos_alta_demanda" in seasonality, "Missing periodos_alta_demanda"
        assert "mes_atual" in seasonality, "Missing mes_atual"
        
        # Verify metrics structure
        metrics = data["metrics"]
        assert "total_visitas" in metrics, "Missing total_visitas"
        assert "taxa_conversao" in metrics, "Missing taxa_conversao"
    
    def test_dashboard_requires_auth(self):
        """Test dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/prospecting/dashboard")
        assert response.status_code == 401, "Should require authentication"


class TestProspectingLeads:
    """Test prospecting leads endpoints"""
    
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
    
    def test_get_leads_santos(self, auth_headers):
        """Test GET /api/admin/prospecting/leads/Santos returns leads"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/leads/Santos",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get leads failed: {response.text}"
        
        leads = response.json()
        assert isinstance(leads, list), "Should return a list"
        assert len(leads) > 0, "Should return at least one lead"
        
        # Verify lead structure
        lead = leads[0]
        assert "id" in lead, "Missing id"
        assert "municipio" in lead, "Missing municipio"
        assert "zona" in lead, "Missing zona"
        assert "chance_fechamento" in lead, "Missing chance_fechamento"
        assert "prioridade" in lead, "Missing prioridade"
        assert "potencial_condominios" in lead, "Missing potencial_condominios"
        assert "potencial_empresas" in lead, "Missing potencial_empresas"
        assert "indice_criminalidade" in lead, "Missing indice_criminalidade"
        assert "melhor_horario" in lead, "Missing melhor_horario"
    
    def test_get_leads_sao_vicente(self, auth_headers):
        """Test GET /api/admin/prospecting/leads/São Vicente returns leads"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/leads/São Vicente",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get leads failed: {response.text}"
        
        leads = response.json()
        assert isinstance(leads, list), "Should return a list"
        assert len(leads) > 0, "Should return at least one lead for São Vicente"
    
    def test_get_leads_guaruja(self, auth_headers):
        """Test GET /api/admin/prospecting/leads/Guarujá returns leads"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/leads/Guarujá",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get leads failed: {response.text}"
        
        leads = response.json()
        assert isinstance(leads, list), "Should return a list"
        assert len(leads) > 0, "Should return at least one lead for Guarujá"
    
    def test_leads_sorted_by_probability(self, auth_headers):
        """Test leads can be sorted by chance_fechamento"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/leads/Santos",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        leads = response.json()
        # Verify all leads have chance_fechamento
        for lead in leads:
            assert "chance_fechamento" in lead
            assert isinstance(lead["chance_fechamento"], (int, float))
            assert 0 <= lead["chance_fechamento"] <= 100


class TestProspectingRoutes:
    """Test prospecting route generation and management"""
    
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
    
    def test_generate_route(self, auth_headers):
        """Test POST /api/admin/prospecting/generate-route creates optimized route"""
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/generate-route",
            headers=auth_headers,
            json={
                "municipio": "Santos",
                "max_visits": 5
            }
        )
        assert response.status_code == 200, f"Generate route failed: {response.text}"
        
        route = response.json()
        
        # Verify route structure
        assert "id" in route, "Missing route id"
        assert "paradas" in route, "Missing paradas"
        assert "total_visitas" in route, "Missing total_visitas"
        assert "tempo_estimado" in route, "Missing tempo_estimado"
        assert "probabilidade_media" in route, "Missing probabilidade_media"
        
        # Verify paradas structure
        assert len(route["paradas"]) > 0, "Should have at least one stop"
        assert len(route["paradas"]) <= 5, "Should respect max_visits limit"
        
        parada = route["paradas"][0]
        assert "ordem" in parada, "Missing ordem in parada"
        assert "local" in parada, "Missing local in parada"
        assert "chance_fechamento" in parada, "Missing chance_fechamento in parada"
    
    def test_get_routes(self, auth_headers):
        """Test GET /api/admin/prospecting/routes returns saved routes"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/routes",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get routes failed: {response.text}"
        
        routes = response.json()
        assert isinstance(routes, list), "Should return a list"


class TestProspectingSchedules:
    """Test prospecting schedule management"""
    
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
    
    def test_create_schedule(self, auth_headers):
        """Test POST /api/admin/prospecting/schedule creates a schedule"""
        from datetime import datetime, timedelta
        
        # Schedule for tomorrow
        schedule_date = (datetime.now() + timedelta(days=1)).isoformat()
        
        response = requests.post(
            f"{BASE_URL}/api/admin/prospecting/schedule",
            headers=auth_headers,
            json={
                "route_id": "test_route_123",
                "data_agendada": schedule_date,
                "municipio": "Santos"
            }
        )
        assert response.status_code == 200, f"Create schedule failed: {response.text}"
        
        schedule = response.json()
        
        # Verify schedule structure
        assert "id" in schedule, "Missing schedule id"
        assert "data_agendada" in schedule, "Missing data_agendada"
        assert "status" in schedule, "Missing status"
        assert schedule["status"] == "agendado", "Status should be 'agendado'"
        assert "municipio" in schedule, "Missing municipio"
    
    def test_get_schedules(self, auth_headers):
        """Test GET /api/admin/prospecting/schedules returns schedules"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/schedules",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get schedules failed: {response.text}"
        
        schedules = response.json()
        assert isinstance(schedules, list), "Should return a list"


class TestProspectingSeasonality:
    """Test seasonality data endpoint"""
    
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
    
    def test_get_seasonality(self, auth_headers):
        """Test GET /api/admin/prospecting/seasonality returns seasonality data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/seasonality",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get seasonality failed: {response.text}"
        
        data = response.json()
        
        # Verify structure
        assert "periodos_alta_demanda" in data, "Missing periodos_alta_demanda"
        assert "mes_atual" in data, "Missing mes_atual"
        
        # Verify periodos_alta_demanda
        periodos = data["periodos_alta_demanda"]
        assert len(periodos) > 0, "Should have at least one high demand period"
        
        periodo = periodos[0]
        assert "periodo" in periodo, "Missing periodo"
        assert "motivo" in periodo, "Missing motivo"
        assert "aumento_demanda" in periodo, "Missing aumento_demanda"
        
        # Verify mes_atual
        mes_atual = data["mes_atual"]
        assert "indice_demanda" in mes_atual, "Missing indice_demanda"
        assert "recomendacao" in mes_atual, "Missing recomendacao"


class TestProspectingStats:
    """Test prospecting stats endpoint"""
    
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
    
    def test_get_stats(self, auth_headers):
        """Test GET /api/admin/prospecting/stats returns region stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/prospecting/stats",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        
        stats = response.json()
        
        # Verify structure
        assert "region" in stats, "Missing region"
        assert "municipios" in stats, "Missing municipios"
        assert "totals" in stats, "Missing totals"
        
        # Verify totals
        totals = stats["totals"]
        assert "populacao" in totals, "Missing populacao in totals"
        assert "condominios_estimados" in totals, "Missing condominios_estimados"
        assert "empresas_estimadas" in totals, "Missing empresas_estimadas"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])

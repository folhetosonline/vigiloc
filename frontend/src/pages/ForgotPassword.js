import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API}/customer/forgot-password?email=${email}`);
      setEmailSent(true);
      toast.success('Instruções enviadas para seu email!');
    } catch (error) {
      toast.error('Erro ao solicitar recuperação');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/customer/reset-password?token=${token}&new_password=${newPassword}`);
      toast.success('Senha redefinida com sucesso!');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Recuperar Senha</h1>
          <p className="text-gray-600">
            {token ? 'Defina sua nova senha' : 'Digite seu email para recuperar a senha'}
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            {!token ? (
              /* Request Reset Form */
              emailSent ? (
                <div className="text-center py-8">
                  <div className="text-5xl mb-4">📧</div>
                  <h3 className="text-xl font-semibold mb-2">Email Enviado!</h3>
                  <p className="text-gray-600">
                    Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Email</label>
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar Instruções'}
                  </Button>
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Voltar para o login
                    </button>
                  </div>
                </form>
              )
            ) : (
              /* Reset Password Form */
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nova Senha</label>
                  <Input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirmar Nova Senha</label>
                  <Input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
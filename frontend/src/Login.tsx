import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './css/Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login: authLogin } = useAuth(); 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.login) {
        authLogin(data.user, data.token);
        localStorage.setItem('user', JSON.stringify(data.user))
        navigate('/dashboard');
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      setError('Não foi possível conectar ao servidor.');
    }
  };

  

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form card">
        <h1>Aerocode</h1>
        <p>Faça seu login para continuar</p>

        {error && <p className="error-message">{error}</p>}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="E-mail"
        />

        <div className="password-wrapper">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="show-password-btn"
          >
            {showPassword ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>

        <button type="submit">Entrar</button>
      </form>
    </div>
  );
}

export default Login;

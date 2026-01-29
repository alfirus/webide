import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export const LoginPage = () => {
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError('Unable to sign in. Check your credentials and try again.')
      console.error(err)
    }
  }

  return (
    <div className="auth-layout">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to continue to your workspace.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="auth-footer">
          <span>New here?</span>
          <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  )
}

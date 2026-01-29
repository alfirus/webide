import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Project {
  id: string
  name: string
  description?: string
  updatedAt?: string
}

export const DashboardPage = () => {
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    const loadProjects = async () => {
      setStatus('loading')
      try {
        const response = await api.get('/projects')
        const data = response.data.data ?? response.data
        setProjects(data.projects ?? [])
        setStatus('idle')
      } catch (error) {
        console.error(error)
        setStatus('error')
      }
    }

    void loadProjects()
  }, [])

  return (
    <div className="page">
      <header className="topbar">
        <div>
          <h2>Welcome, {user?.name ?? user?.email}</h2>
          <p>Manage your projects and jump back into coding.</p>
        </div>
        <button className="ghost" onClick={() => void logout()}>
          Sign out
        </button>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h3>Your projects</h3>
          <button className="primary">New project</button>
        </div>
        {status === 'loading' && <div className="muted">Loading projects...</div>}
        {status === 'error' && (
          <div className="alert warning">
            Unable to load projects. API not available yet.
          </div>
        )}
        {status === 'idle' && projects.length === 0 && (
          <div className="empty-state">
            <p>No projects yet. Create a new one to get started.</p>
          </div>
        )}
        {projects.length > 0 && (
          <ul className="project-grid">
            {projects.map((project) => (
              <li key={project.id}>
                <div className="project-card">
                  <h4>{project.name}</h4>
                  <p>{project.description ?? 'No description provided.'}</p>
                  <div className="project-footer">
                    <span className="muted">
                      {project.updatedAt
                        ? `Updated ${new Date(project.updatedAt).toLocaleDateString()}`
                        : 'Recently created'}
                    </span>
                    <Link to={`/editor/${project.id}`}>Open</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

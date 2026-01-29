import { Link } from 'react-router-dom'

export const NotFoundPage = () => (
  <div className="page-center">
    <div className="empty-state">
      <h2>Page not found</h2>
      <p>We couldn’t find what you were looking for.</p>
      <Link className="primary" to="/">
        Back to dashboard
      </Link>
    </div>
  </div>
)

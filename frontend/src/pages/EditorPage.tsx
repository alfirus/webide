import { useParams } from 'react-router-dom'

export const EditorPage = () => {
  const { projectId } = useParams()

  return (
    <div className="editor-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Explorer</h3>
          <span className="muted">Project {projectId ?? 'current'}</span>
        </div>
        <div className="sidebar-body">
          <p className="muted">File explorer coming next.</p>
        </div>
      </aside>

      <main className="editor-main">
        <header className="editor-toolbar">
          <h2>Editor</h2>
          <div className="toolbar-actions">
            <button className="ghost">Run</button>
            <button className="primary">Save</button>
          </div>
        </header>
        <section className="editor-surface">
          <div className="empty-state">
            <p>Select a file to start editing.</p>
          </div>
        </section>
        <section className="terminal-surface">
          <div className="terminal-header">
            <h4>Terminal</h4>
            <button className="ghost">New</button>
          </div>
          <div className="terminal-body">
            <p className="muted">Terminal integration coming next.</p>
          </div>
        </section>
      </main>
    </div>
  )
}

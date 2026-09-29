import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    })
    
    // Логируем ошибку для отладки
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '20px',
          background: '#1e293b',
          color: 'white',
          minHeight: '100vh',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <h1 style={{ color: '#ef4444', marginBottom: '16px' }}>⚠️ Произошла ошибка</h1>
          
          <div style={{
            background: '#334155',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h3>Ошибка:</h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap',
              fontSize: '14px',
              color: '#f87171'
            }}>
              {this.state.error && this.state.error.toString()}
            </pre>
          </div>

          <div style={{
            background: '#334155',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <h3>Стек вызовов:</h3>
            <pre style={{ 
              whiteSpace: 'pre-wrap',
              fontSize: '12px',
              color: '#d1d5db',
              maxHeight: '300px',
              overflow: 'auto'
            }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>

          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Перезагрузить приложение
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
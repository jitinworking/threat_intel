import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0E17', color: 'white', fontFamily: 'system-ui' }}>
          <AlertTriangle size={64} color="#ef4444" style={{ marginBottom: '1rem' }} />
          <h1 style={{ marginBottom: '1rem' }}>Application Crashed</h1>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>A runtime error occurred in the React component tree.</p>
          <div style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.3)', padding: '1rem', borderRadius: '8px', maxWidth: '800px', width: '100%', overflow: 'auto' }}>
            <h3 style={{ color: '#fca5a5', marginBottom: '0.5rem' }}>{this.state.error?.toString()}</h3>
            <pre style={{ fontSize: '12px', color: '#f87171', whiteSpace: 'pre-wrap' }}>
              {this.state.errorInfo?.componentStack}
            </pre>
          </div>
          <button onClick={() => window.location.reload()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '6px', marginTop: '2rem', cursor: 'pointer', fontWeight: 'bold' }}>
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

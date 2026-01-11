import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    textAlign: 'center',
                    maxWidth: '600px',
                    margin: '4rem auto'
                }}>
                    <h1 style={{ color: '#e74c3c', marginBottom: '1rem' }}>⚠️ Oops!</h1>
                    <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                        Something went wrong. Don't worry, your work is saved!
                    </p>
                    <details style={{
                        textAlign: 'left',
                        background: '#f5f5f5',
                        padding: '1rem',
                        borderRadius: '8px',
                        marginBottom: '1.5rem'
                    }}>
                        <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                            Error Details
                        </summary>
                        <pre style={{
                            fontSize: '0.85rem',
                            overflow: 'auto',
                            marginTop: '0.5rem'
                        }}>
                            {this.state.error?.toString()}
                        </pre>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#667eea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            fontWeight: 600
                        }}
                    >
                        🔄 Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

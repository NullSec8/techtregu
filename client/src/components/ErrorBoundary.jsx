import { Component } from 'react';
import { Link } from 'react-router-dom';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-not-found">
          <div className="not-found-code">Oops!</div>
          <h1>Something went wrong</h1>
          <p className="not-found-lead">
            We encountered an unexpected error. Please try again or return to the homepage.
          </p>
          <div className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Try Again
            </button>
            <Link to="/" className="btn">
              Go Home
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export class PageErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page Error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="empty-state">
          <div className="empty-icon">⚠️</div>
          <h3>Failed to load this page</h3>
          <p>Something went wrong while loading this content.</p>
          <p className="empty-actions">
            <button type="button" className="btn btn-primary" onClick={this.handleRetry}>
              Try Again
            </button>
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

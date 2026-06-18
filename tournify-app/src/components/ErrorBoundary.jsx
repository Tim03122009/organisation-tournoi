import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Erreur application:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "Roboto, sans-serif" }}>
          <h2>Une erreur est survenue</h2>
          <p style={{ color: "#666", marginBottom: 24 }}>
            Rechargez la page. Si le problème persiste, réinitialisez les données locales.
          </p>
          <button
            type="button"
            className="btn-contained"
            onClick={() => {
              localStorage.removeItem("gestion-tournoi-data");
              window.location.href = "/";
            }}
          >
            Réinitialiser et recharger
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

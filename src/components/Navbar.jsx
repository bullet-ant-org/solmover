import React from 'react';

const Navbar = ({ onGetStartedClick, connectedWallet, onDisconnect }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-black">
      <div className="container-fluid">
        {/* Logo */}
        <a className="navbar-brand fw-bold" href="#">
          ⚡ Solana Transfer
        </a>

        {/* Centered Links */}
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link" href="#">Home</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Features</a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">Docs</a>
            </li>
          </ul>
        </div>

        {/* Right Aligned Button */}
        <div className="d-flex">
          {connectedWallet ? (
            <div className="d-flex align-items-center">
              <span className="navbar-text me-3 text-white-50">
                {connectedWallet.publicKey.slice(0, 6)}...{connectedWallet.publicKey.slice(-4)}
              </span>
              <button
                className="btn btn-outline-secondary"
                onClick={onDisconnect}
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onGetStartedClick}
              style={{ backgroundColor: '#6366f1', borderColor: '#6366f1' }}
            >
              Get Started
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
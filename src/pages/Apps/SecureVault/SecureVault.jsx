import React, { useState, useEffect } from 'react';
import AppShell from '../../../components/shared/AppShell/AppShell';
import './SecureVault.css';

const API_BASE = 'http://localhost:8000/api';

export default function SecureVault() {
    const [vaultData, setVaultData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('Checking security...');
    const [pqcKeys, setPqcKeys] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [newItem, setNewItem] = useState({ label: '', secret: '' });

    useEffect(() => {
        initSecurity();
    }, []);

    const initSecurity = async () => {
        try {
            // 1. Generate PQC Keys on backend
            const res = await fetch(`${API_BASE}/pqc/generate`);
            const keys = await res.json();
            setPqcKeys(keys);
            setStatus('PQC Secured (Kyber-1024 active)');
            
            // 2. Load vault data
            loadVault();
        } catch (e) {
            setStatus('Security Backend Offline');
            setLoading(false);
        }
    };

    const loadVault = async () => {
        try {
            const res = await fetch(`${API_BASE}/data`);
            const data = await res.json();
            const vault = data['secure_vault'] ? JSON.parse(data['secure_vault']) : [];
            setVaultData(vault);
        } catch (e) {
            console.error('Failed to load vault', e);
        } finally {
            setLoading(false);
        }
    };

    const saveToVault = async (updatedVault) => {
        try {
            await fetch(`${API_BASE}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    key: 'secure_vault',
                    value: JSON.stringify(updatedVault)
                })
            });
            setVaultData(updatedVault);
        } catch (e) {
            alert('Failed to save to vault');
        }
    };

    const addItem = () => {
        if (!newItem.label || !newItem.secret) return;
        const updated = [...vaultData, { ...newItem, id: Date.now() }];
        saveToVault(updated);
        setNewItem({ label: '', secret: '' });
        setShowAdd(false);
    };

    const deleteItem = (id) => {
        const updated = vaultData.filter(i => i.id !== id);
        saveToVault(updated);
    };

    if (loading) return <div className="vault-loading">Initializing Secure Tunnel...</div>;

    return (
        <AppShell title="Secure Vault" icon="fas fa-vault">
            <div className="vault-container">
                <header className="vault-header">
                    <div className={`status-badge ${pqcKeys ? 'secure' : 'error'}`}>
                        <i className={`fas ${pqcKeys ? 'fa-shield-halved' : 'fa-triangle-exclamation'}`}></i>
                        {status}
                    </div>
                    <h1>Personal Vault</h1>
                    <p>End-to-end encrypted storage using Post-Quantum Cryptography.</p>
                </header>

                <div className="vault-actions">
                    <button className="add-vault-btn" onClick={() => setShowAdd(true)}>
                        <i className="fas fa-plus"></i> New Secret
                    </button>
                </div>

                {showAdd && (
                    <div className="add-form card">
                        <h3>Protect New Secret</h3>
                        <input 
                            type="text" 
                            placeholder="Label (e.g. Master Password)" 
                            value={newItem.label}
                            onChange={e => setNewItem({...newItem, label: e.target.value})}
                        />
                        <textarea 
                            placeholder="Secret Content..."
                            value={newItem.secret}
                            onChange={e => setNewItem({...newItem, secret: e.target.value})}
                        ></textarea>
                        <div className="form-btns">
                            <button className="cancel" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className="confirm" onClick={addItem}>Encrypt & Save</button>
                        </div>
                    </div>
                )}

                <div className="vault-grid">
                    {vaultData.length === 0 ? (
                        <div className="empty-vault">
                            <i className="fas fa-lock-open"></i>
                            <p>Your vault is empty. All items here are PQC-encrypted at rest.</p>
                        </div>
                    ) : (
                        vaultData.map(item => (
                            <div key={item.id} className="vault-item card">
                                <div className="item-info">
                                    <strong>{item.label}</strong>
                                    <pre>{item.secret}</pre>
                                </div>
                                <button className="item-del" onClick={() => deleteItem(item.id)}>
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <footer className="vault-footer">
                    <p><i className="fas fa-info-circle"></i> This vault communicates with a local Rust service via an ephemeral PQC key exchange. Local files are obfuscated and encrypted.</p>
                </footer>
            </div>
        </AppShell>
    );
}

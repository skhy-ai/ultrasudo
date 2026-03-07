use pqcrypto_kyber::kyber1024::*;
use pqcrypto_traits::kem::{PublicKey as KemPk, SecretKey as KemSk, Ciphertext as KemCt, SharedSecret as KemSs};
use base64::{Engine as _, engine::general_purpose};
use std::error::Error;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce
};
use rand::{RngCore, thread_rng};

pub struct PqcKeys {
    pub public_key: String,
    pub secret_key: String,
}

pub fn generate_pqc_keypair() -> PqcKeys {
    let (pk, sk) = keypair();
    PqcKeys {
        public_key: general_purpose::STANDARD.encode(pk.as_bytes()),
        secret_key: general_purpose::STANDARD.encode(sk.as_bytes()),
    }
}

pub fn encapsulate_pqc(pk_base64: &str) -> Result<(String, String), Box<dyn Error>> {
    let pk_bytes = general_purpose::STANDARD.decode(pk_base64)?;
    let pk = KemPk::from_bytes(&pk_bytes).map_err(|_| "Invalid Public Key")?;
    let (ss, ct) = encapsulate(&pk);
    Ok((
        general_purpose::STANDARD.encode(ss.as_bytes()),
        general_purpose::STANDARD.encode(ct.as_bytes()),
    ))
}

pub fn decapsulate_pqc(ct_base64: &str, sk_base64: &str) -> Result<String, Box<dyn Error>> {
    let ct_bytes = general_purpose::STANDARD.decode(ct_base64)?;
    let sk_bytes = general_purpose::STANDARD.decode(sk_base64)?;
    let ct = KemCt::from_bytes(&ct_bytes).map_err(|_| "Invalid Ciphertext")?;
    let sk = KemSk::from_bytes(&sk_bytes).map_err(|_| "Invalid Secret Key")?;
    let ss = decapsulate(&ct, &sk);
    Ok(general_purpose::STANDARD.encode(ss.as_bytes()))
}

pub fn encrypt_with_ss(data: &str, ss_base64: &str) -> Result<String, Box<dyn Error>> {
    let ss_bytes = general_purpose::STANDARD.decode(ss_base64)?;
    // Use first 32 bytes of SS for AES-256
    let key = Aes256Gcm::new_from_slice(&ss_bytes[..32]).map_err(|_| "Invalid Key Length")?;
    
    let mut nonce_bytes = [0u8; 12];
    thread_rng().fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = key.encrypt(nonce, data.as_bytes())
        .map_err(|_| "Encryption Failure")?;
    
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);
    
    Ok(general_purpose::STANDARD.encode(combined))
}

pub fn decrypt_with_ss(encrypted_base64: &str, ss_base64: &str) -> Result<String, Box<dyn Error>> {
    let encrypted_bytes = general_purpose::STANDARD.decode(encrypted_base64)?;
    if encrypted_bytes.len() < 12 { return Err("Invalid Ciphertext".into()); }
    
    let ss_bytes = general_purpose::STANDARD.decode(ss_base64)?;
    let key = Aes256Gcm::new_from_slice(&ss_bytes[..32]).map_err(|_| "Invalid Key Length")?;
    
    let (nonce_bytes, ciphertext) = encrypted_bytes.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let decrypted = key.decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption Failure")?;
    
    Ok(String::from_utf8(decrypted)?)
}

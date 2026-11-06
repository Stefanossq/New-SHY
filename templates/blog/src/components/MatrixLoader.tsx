
export default function MatrixLoader() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--color-accent)' }}>
            <div style={{ fontSize: '2rem', fontFamily: 'monospace', marginBottom: '10px' }}>LOADING...</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Decrypting data stream from Jikan API</div>
        </div>
    );
}

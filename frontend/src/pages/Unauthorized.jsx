import { Link, useLocation } from 'react-router-dom';
import { getDashboardPath, useAuth } from '../context/AuthContext';

const Unauthorized = () => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const dashboardPath = getDashboardPath(user?.role);
    const blockedPath = location.state?.blockedPath;
    return (
        <main style={styles.page}>
            <section style={styles.card}>
                <div style={styles.icon}>⛔</div>
                <h1 style={styles.title}>Unauthorized Access</h1>
                <p style={styles.text}>Your account role does not have permission to open this dashboard.</p>
                {blockedPath && <p style={styles.pathText}>Blocked page: <strong>{blockedPath}</strong></p>}
                {user && <p style={styles.roleText}>Signed in as <strong>{user.name}</strong> with role <strong>{user.role}</strong>.</p>}
                <div style={styles.actions}>
                    {user ? <Link style={styles.primaryLink} to={dashboardPath}>Go to My Dashboard</Link> : <Link style={styles.primaryLink} to="/login">Go to Login</Link>}
                    <button style={styles.secondaryButton} onClick={logout}>Logout</button>
                </div>
            </section>
        </main>
    );
};

const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #111827, #1e293b)', padding: '24px', fontFamily: 'Arial, sans-serif' },
    card: { width: '100%', maxWidth: '520px', padding: '36px', borderRadius: '22px', background: '#ffffff', boxShadow: '0 24px 70px rgba(15, 23, 42, 0.35)', textAlign: 'center' },
    icon: { fontSize: '48px', marginBottom: '12px' },
    title: { margin: 0, color: '#0f172a', fontSize: '30px' },
    text: { color: '#475569', lineHeight: 1.6 },
    roleText: { color: '#334155', background: '#f1f5f9', padding: '12px', borderRadius: '12px' },
    pathText: { color: '#991b1b', background: '#fef2f2', padding: '10px', borderRadius: '10px' },
    actions: { display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '22px' },
    primaryLink: { background: '#2563eb', color: '#fff', textDecoration: 'none', borderRadius: '10px', padding: '12px 18px', fontWeight: 700 },
    secondaryButton: { background: '#e2e8f0', border: 'none', color: '#0f172a', borderRadius: '10px', padding: '12px 18px', fontWeight: 700, cursor: 'pointer' },
};

export default Unauthorized;

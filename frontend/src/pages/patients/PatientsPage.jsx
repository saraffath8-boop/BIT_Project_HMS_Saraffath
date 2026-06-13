import { useCallback, useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext';

import { getPatients } from '../../services/patientService';



const PatientsPage = () => {

    const { token, user } = useAuth();

    const [patients, setPatients] = useState([]);

    const [search, setSearch] = useState('');

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState('');



    const loadPatients = useCallback(async (searchValue = search) => {

        setLoading(true);

        setError('');



        try {

            const response = await getPatients({ token, search: searchValue });

            setPatients(response.patients || []);

        } catch (err) {

            setError(err.message || 'Unable to load patients');

        } finally {

            setLoading(false);

        }

    }, [search, token]);



    useEffect(() => {

        const timeoutId = setTimeout(() => {

            loadPatients('');

        }, 0);



        return () => clearTimeout(timeoutId);

    }, [loadPatients]);



    const handleSearchSubmit = (event) => {

        event.preventDefault();

        loadPatients(search);

    };



    return (

        <main style={styles.page}>

            <section style={styles.header}>

                <div>

                    <p style={styles.kicker}>Patient Management</p>

                    <h1 style={styles.title}>Patients</h1>

                    <p style={styles.subtitle}>Search, view, and manage patient records.</p>

                </div>

                <div style={styles.actions}>

                    <Link style={styles.secondaryLink} to="/dashboard">Dashboard</Link>

                    {(user?.role === 'admin' || user?.role === 'receptionist')&& <Link style={styles.primaryLink} to="/patients/new">Add Patient</Link>}

                </div>

            </section>



            <form onSubmit={handleSearchSubmit} style={styles.searchForm}>

                <input

                    style={styles.searchInput}

                    value={search}

                    onChange={(event) => setSearch(event.target.value)}

                    placeholder="Search by name, patient ID, or phone"

                />

                <button style={styles.searchButton} type="submit">Search</button>

            </form>



            {error && <div style={styles.error}>{error}</div>}

            {loading ? (

                <div style={styles.card}>Loading patients...</div>

            ) : (

                <section style={styles.tableCard}>

                    <table style={styles.table}>

                        <thead>

                            <tr>

                                <th style={styles.th}>Patient ID</th>

                                <th style={styles.th}>Full Name</th>

                                <th style={styles.th}>Gender</th>

                                <th style={styles.th}>Phone</th>

                                {user?.role !== 'receptionist' && <th style={styles.th}>Blood Group</th>}

                                <th style={styles.th}>Status</th>

                                <th style={styles.th}>Actions</th>

                            </tr>

                        </thead>

                        <tbody>

                            {patients.map((patient) => (

                                <tr key={patient.id}>

                                    <td style={styles.td}>{patient.patientId}</td>

                                    <td style={styles.td}>{patient.fullName}</td>

                                    <td style={styles.td}>{patient.gender}</td>

                                    <td style={styles.td}>{patient.phone}</td>

                                    {user?.role !== 'receptionist' && <td style={styles.td}>{patient.bloodGroup}</td>}

                                    <td style={styles.td}>{patient.status}</td>

                                    <td style={styles.td}>

                                        <Link style={styles.inlineLink} to={`/patients/${patient.id}`}>View</Link>

                                        {(user?.role === 'admin' || user?.role === 'nurse' || user?.role === 'receptionist') && (

                                            <Link style={styles.inlineLink} to={`/patients/${patient.id}/edit`}>Edit</Link>

                                        )}

                                    </td>

                                </tr>

                            ))}

                            {patients.length === 0 && (

                                <tr>

                                    <td style={styles.emptyCell} colSpan={user?.role === 'receptionist' ? 6 : 7}>No patients found.</td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </section>

            )}

        </main>

    );

};



const styles = {

    page: { color: '#0f172a' },

    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '18px', background: '#0f172a', color: '#fff', padding: '28px', borderRadius: '24px', marginBottom: '20px' },

    kicker: { margin: 0, color: '#0e7490', fontWeight: 800, textTransform: 'uppercase' },

    title: { margin: '8px 0', fontSize: '34px' },

    subtitle: { margin: 0, color: '#64748b' },

    actions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },

    primaryLink: { background: '#2563eb', color: '#fff', textDecoration: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: 800 },

    secondaryLink: { background: '#e2e8f0', color: '#0f172a', textDecoration: 'none', padding: '12px 16px', borderRadius: '12px', fontWeight: 800 },

    searchForm: { display: 'flex', gap: '12px', marginBottom: '20px' },

    searchInput: { flex: 1, padding: '13px 14px', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '15px' },

    searchButton: { border: 'none', background: '#0891b2', color: '#fff', padding: '13px 18px', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' },

    card: { background: '#fff', borderRadius: '18px', padding: '24px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)' },

    tableCard: { background: '#fff', borderRadius: '18px', padding: '16px', boxShadow: '0 12px 30px rgba(15,23,42,0.08)', overflowX: 'auto' },

    table: { width: '100%', borderCollapse: 'collapse' },

    th: { textAlign: 'left', padding: '14px', color: '#334155', borderBottom: '1px solid #e2e8f0' },

    td: { padding: '14px', color: '#334155', borderBottom: '1px solid #f1f5f9' },

    inlineLink: { color: '#2563eb', fontWeight: 800, marginRight: '12px', textDecoration: 'none' },

    emptyCell: { padding: '24px', textAlign: 'center', color: '#64748b' },

    error: { background: '#fee2e2', color: '#991b1b', borderRadius: '12px', padding: '12px', marginBottom: '16px', fontWeight: 700 },

};



export default PatientsPage;

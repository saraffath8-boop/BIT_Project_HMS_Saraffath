import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const statCards = [
    { label:"Total Patients",  value:"1,284", icon:"🏥", color:"#38bdf8" },
    { label:"Doctors On Duty", value:"24",    icon:"👨‍⚕️", color:"#34d399" },
    { label:"Appointments",    value:"87",    icon:"📅", color:"#f59e0b" },
    { label:"Bed Occupancy",   value:"73%",   icon:"🛏️", color:"#a78bfa" },
];

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div style={styles.wrapper}>
            {/* Sidebar */}
            <aside style={styles.sidebar}>
                <div style={styles.sidebarLogo}>
                    <span style={styles.logoIcon}>✚</span>
                    <span style={styles.logoText}>MediCore</span>
                </div>
                <nav style={styles.nav}>
                    {[
                        { icon:"⬛", label:"Dashboard",   active:true  },
                        { icon:"👥", label:"Patients",    active:false },
                        { icon:"👨‍⚕️", label:"Doctors",    active:false },
                        { icon:"📅", label:"Appointments",active:false },
                        { icon:"🛏️", label:"Wards",       active:false },
                        { icon:"💊", label:"Pharmacy",    active:false },
                        { icon:"🧪", label:"Lab",         active:false },
                        { icon:"📊", label:"Reports",     active:false },
                    ].map((item) => (
                        <div key={item.label}
                            style={item.active ? {...styles.navItem, ...styles.navItemActive} : styles.navItem}>
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>
                <button onClick={handleLogout} style={styles.logoutBtn}>
                    🚪 Logout
                </button>
            </aside>

            {/* Main */}
            <main style={styles.main}>
                {/* Topbar */}
                <div style={styles.topbar}>
                    <div>
                        <h1 style={styles.pageTitle}>Dashboard</h1>
                        <p style={styles.pageDate}>{new Date().toDateString()}</p>
                    </div>
                    <div style={styles.userChip}>
                        <div style={styles.avatar}>
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p style={styles.userName}>{user?.name}</p>
                            <p style={styles.userRole}>{user?.role}</p>
                        </div>
                    </div>
                </div>

                {/* Stat Cards */}
                <div style={styles.statsGrid}>
                    {statCards.map((card) => (
                        <div key={card.label} style={styles.statCard}>
                            <div style={{...styles.statIcon, background: card.color + "22", color: card.color}}>
                                {card.icon}
                            </div>
                            <div>
                                <p style={styles.statValue}>{card.value}</p>
                                <p style={styles.statLabel}>{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Welcome Banner */}
                <div style={styles.banner}>
                    <div>
                        <h2 style={styles.bannerTitle}>Welcome back, {user?.name?.split(" ")[0]}! 👋</h2>
                        <p style={styles.bannerSub}>
                            You're logged in as <strong style={{color:"#38bdf8"}}>{user?.role}</strong>.
                            The hospital system is running smoothly today.
                        </p>
                    </div>
                    <div style={styles.bannerBadge}>✚</div>
                </div>

                {/* Quick Actions */}
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.actionsGrid}>
                    {["Add Patient","New Appointment","Admit to Ward","Generate Report"].map((action) => (
                        <button key={action} style={styles.actionBtn}>{action}</button>
                    ))}
                </div>
            </main>
        </div>
    );
}

const styles = {
    wrapper:{ display:"flex", minHeight:"100vh", background:"#060d1f", fontFamily:"'Segoe UI',sans-serif" },
    sidebar:{
        width:"240px", background:"rgba(255,255,255,0.03)",
        borderRight:"1px solid rgba(56,189,248,0.1)",
        display:"flex", flexDirection:"column", padding:"24px 0", flexShrink:0
    },
    sidebarLogo:{ display:"flex", alignItems:"center", gap:"10px", padding:"0 24px 32px" },
    logoIcon:{
        width:"36px", height:"36px", borderRadius:"10px",
        background:"linear-gradient(135deg,#38bdf8,#0ea5e9)",
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:"18px", color:"#fff", fontWeight:"bold"
    },
    logoText:{ color:"#f0f9ff", fontWeight:700, fontSize:"18px" },
    nav:{ flex:1, display:"flex", flexDirection:"column", gap:"4px", padding:"0 12px" },
    navItem:{
        display:"flex", alignItems:"center", gap:"12px",
        padding:"11px 14px", borderRadius:"10px", cursor:"pointer",
        color:"#64748b", fontSize:"14px", fontWeight:500, transition:"all 0.2s"
    },
    navItemActive:{ background:"rgba(56,189,248,0.1)", color:"#38bdf8" },
    logoutBtn:{
        margin:"0 12px", padding:"11px 14px", borderRadius:"10px",
        background:"rgba(239,68,68,0.08)", border:"1px solid rgba(239,68,68,0.2)",
        color:"#f87171", fontSize:"14px", fontWeight:600, cursor:"pointer", textAlign:"left"
    },
    main:{ flex:1, padding:"32px 36px", overflowY:"auto" },
    topbar:{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"32px" },
    pageTitle:{ color:"#f0f9ff", fontSize:"26px", fontWeight:700, margin:0 },
    pageDate:{ color:"#64748b", fontSize:"13px", margin:"4px 0 0 0" },
    userChip:{ display:"flex", alignItems:"center", gap:"12px" },
    avatar:{
        width:"42px", height:"42px", borderRadius:"50%",
        background:"linear-gradient(135deg,#38bdf8,#0ea5e9)",
        display:"flex", alignItems:"center", justifyContent:"center",
        color:"#fff", fontWeight:700, fontSize:"18px"
    },
    userName:{ color:"#f0f9ff", fontWeight:600, fontSize:"14px", margin:0 },
    userRole:{ color:"#64748b", fontSize:"12px", margin:"2px 0 0 0", textTransform:"capitalize" },
    statsGrid:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"20px", marginBottom:"28px" },
    statCard:{
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(56,189,248,0.1)",
        borderRadius:"16px", padding:"22px", display:"flex", alignItems:"center", gap:"16px"
    },
    statIcon:{ width:"52px", height:"52px", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 },
    statValue:{ color:"#f0f9ff", fontSize:"26px", fontWeight:700, margin:0 },
    statLabel:{ color:"#64748b", fontSize:"13px", margin:"3px 0 0 0" },
    banner:{
        background:"linear-gradient(135deg,rgba(56,189,248,0.1),rgba(14,165,233,0.05))",
        border:"1px solid rgba(56,189,248,0.2)", borderRadius:"16px",
        padding:"28px 32px", marginBottom:"32px",
        display:"flex", alignItems:"center", justifyContent:"space-between"
    },
    bannerTitle:{ color:"#f0f9ff", fontSize:"20px", fontWeight:700, margin:"0 0 8px 0" },
    bannerSub:{ color:"#94a3b8", fontSize:"14px", margin:0 },
    bannerBadge:{ fontSize:"48px", color:"rgba(56,189,248,0.3)" },
    sectionTitle:{ color:"#94a3b8", fontSize:"13px", fontWeight:600, textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 16px 0" },
    actionsGrid:{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px" },
    actionBtn:{
        padding:"14px", borderRadius:"12px",
        background:"rgba(255,255,255,0.04)", border:"1px solid rgba(56,189,248,0.15)",
        color:"#94a3b8", fontSize:"14px", fontWeight:600, cursor:"pointer", transition:"all 0.2s"
    }
};
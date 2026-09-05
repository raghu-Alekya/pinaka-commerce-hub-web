import {useNavigate} from "react-router-dom";
export default function Header({onMobileMenu}){
 const nav=useNavigate();
 return <header className="topbar"><div className="topbar-left"><button className="sidebar-toggle" onClick={onMobileMenu}><i className="bi bi-list"/></button>
 <select className="merchant-select" defaultValue="all"><option value="all">All Merchants</option><option>Downtown Solutions</option><option>Westside Market LLC</option><option>Sunshine Mart</option><option>Airport Express</option><option>Lakeside Retail</option></select>
 <div className="global-search"><i className="bi bi-search"/><input placeholder="Search merchants, stores, orders..." onKeyDown={e=>e.key==="Enter"&&nav("/merchants")}/><span className="search-shortcut">/</span></div></div>
 <div className="topbar-right"><button className="top-icon"><i className="bi bi-bell"/><span className="notification-count">12</span></button><button className="top-icon"><i className="bi bi-question-circle"/></button><div className="profile"><div className="profile-avatar">AD</div><div className="profile-info"><strong>Admin User</strong><small>Super Admin</small></div><i className="bi bi-chevron-down profile-arrow"/></div></div></header>
}
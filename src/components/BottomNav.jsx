import { NavLink } from 'react-router-dom';

const ITEMS = [
  { to: '/', icon: 'ti-home', label: 'Inicio', end: true },
  { to: '/asistencia', icon: 'ti-clipboard-check', label: 'Asistencia' },
  { to: '/scoring', icon: 'ti-star', label: 'Scoring' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => 'nav-item' + (isActive ? ' active' : '')}
        >
          <i className={`ti ${item.icon}`} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

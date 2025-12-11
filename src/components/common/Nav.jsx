import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Home from '../../assets/img/ic_home.svg';
import HomeActive from '../../assets/img/ic_home_selected.svg';
import People from '../../assets/img/ic_people.svg';
import PeopleActive from '../../assets/img/ic_people_selected.svg';
import Calendar from '../../assets/img/ic_calendar.svg';
import CalendarActive from '../../assets/img/ic_calendar_selected.svg';
import Mypage from '../../assets/img/ic_mypage.svg';
import MypageActive from '../../assets/img/ic_mypage_selected.svg';

const navItems = [
    {
        key: 'home',
        label: '홈',
        path: '/home',
        icon: Home,
        activeIcon: HomeActive,
    },
    {
        key: 'people',
        label: '지인 목록',
        path: '/people',
        icon: People,
        activeIcon: PeopleActive,
    },
    {
        key: 'calendar',
        label: '캘린더',
        path: '/calendar',
        icon: Calendar,
        activeIcon: CalendarActive,
    },
    {
        key: 'mypage',
        label: '마이',
        path: '/mypage',
        icon: Mypage,
        activeIcon: MypageActive,
    },
];

const Nav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    return (
        <div className="Nav_wrap">
            <div className="buttons">
                {navItems.map((item) => {
                    // 현재 경로가 이 탭의 path로 시작하면 active로 간주
                    const isActive = location.pathname.startsWith(item.path);

                    return (
                        <button
                            key={item.key}
                            type="button"
                            className={`button ${isActive ? 'button--active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <img
                                src={isActive ? item.activeIcon : item.icon}
                                alt={item.label}
                            />
                            <div className="text">{item.label}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    )
}

export default Nav

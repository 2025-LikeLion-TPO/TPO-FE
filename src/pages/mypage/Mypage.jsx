import React from 'react'
import { useNavigate } from 'react-router-dom';

const Mypage = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        navigate('/onboarding', { replace: true });
    };

    return (
        <div className="Mypage_wrap">
            마이페이지 화면입니다.
            <button onClick={handleLogout}>로그아웃</button>
        </div>
    )
}

export default Mypage
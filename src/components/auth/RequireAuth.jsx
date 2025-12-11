import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// 나중에 진짜 로직으로 교체하면 됨
const isLoggedIn = () => {
    return !!localStorage.getItem('accessToken');
};

function RequireAuth({ children }) {
    const location = useLocation();

    if (!isLoggedIn()) {
        // 로그인 안 되어 있으면 온보딩 페이지로 리다이렉트
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }

    return children;
}

export default RequireAuth;
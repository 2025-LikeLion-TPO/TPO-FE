import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/home';

    const handleLoginSuccess = () => {
        // 진짜로는 서버에서 받은 토큰 저장
        localStorage.setItem('accessToken', 'dummy-token');

        // 원래 가려던 페이지가 있으면 그쪽으로, 없으면 /home
        navigate(from, { replace: true });
    };

    return (
        <div className="Login_wrap">
            로그인 페이지입니다.
            <button onClick={handleLoginSuccess}>로그인</button>
        </div>
    )
}

export default Login

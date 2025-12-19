import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../../assets/img/ic_logo.svg';

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
            <div className="subtitle">관계의 온도를 맞추는</div>
            <div className="title">센스있는 사회생활 가이드</div>
            <div className="logo">
                <img src={Logo} alt="Logo" />
            </div>
            <div className="id_input">
                <input type="text" placeholder="아이디 입력" />
            </div>
            <div className="pw_input">
                <input type="password" placeholder="비밀번호 입력" />
            </div>
            <button onClick={handleLoginSuccess}>로그인</button>
            <div className="signup">회원가입</div>
        </div>
    )
}

export default Login

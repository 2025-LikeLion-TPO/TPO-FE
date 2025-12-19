import React from 'react'
import { useNavigate } from 'react-router-dom';
import Mascot from '../../assets/img/img_mascot.svg';
import Logo from '../../assets/img/ic_logo.svg';

const Onboarding = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate('/login');
    };

    return (
        <div className="Onboarding_wrap">
            <div className="subtitle">관계의 온도를 맞추는</div>
            <div className="title">센스있는 사회생활 가이드</div>
            <div className="logo">
                <img src={Logo} alt="Logo" />
            </div>
            <div className="mascot">
                <img src={Mascot} alt="Mascot" />
            </div>
            <button onClick={handleStart}>시작하기</button>
        </div>
    )
}

export default Onboarding

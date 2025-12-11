import React from 'react'
import { useNavigate } from 'react-router-dom';

const Onboarding = () => {
    const navigate = useNavigate();

    const handleStart = () => {
        navigate('/login');
    };

    return (
        <div className="Onboarding_wrap">
            온보딩 페이지입니다.
            <button onClick={handleStart}>시작하기</button>
        </div>
    )
}

export default Onboarding

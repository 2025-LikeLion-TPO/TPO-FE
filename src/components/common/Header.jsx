import React from 'react';
import Logo from '../../assets/img/ic_logo.svg';
import Alarm from '../../assets/img/ic_alarm.svg';
import Gift from '../../assets/img/ic_gift.svg';

const Header = () => {
    return (
        <div className="Header_wrap">
            <div className="logo">
                <img src={Logo} alt="Logo" />
            </div>
            <div className="buttons">
                <div className="alarm">
                    <img src={Alarm} alt="Alarm" />
                </div>
                <div className="gift">
                    <img src={Gift} alt="Gift" />
                </div>
            </div>
        </div>
    )
}

export default Header

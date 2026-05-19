import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => {
    return (
        <div className="splash-screen">
            <div className="splash-content">
                <div className="splash-mark" aria-label="WhatsApp Admin">
                    <span className="splash-dot" />
                    <span className="splash-dot" />
                    <span className="splash-dot" />
                </div>
            </div>
            <div className="splash-footer">
                <p className="footer-from">from</p>
                <div className="footer-brand">
                    <span className="brand-text">Sami</span>
                </div>
            </div>
        </div>
    );
};

export default SplashScreen;

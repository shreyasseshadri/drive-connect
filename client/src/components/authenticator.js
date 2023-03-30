import React from 'react';

const GoogleAuthButton = () => {
  const handleButtonClick = () => {
    window.location.href = '/auth/google';
  };

  return (
    <div>
    <h1>Welcome to my app!</h1>
    <button onClick={handleButtonClick}>
      Sign in with Google
    </button>
  </div>
  );
};

export default GoogleAuthButton;

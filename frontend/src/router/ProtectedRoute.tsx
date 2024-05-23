import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('userID');
    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;

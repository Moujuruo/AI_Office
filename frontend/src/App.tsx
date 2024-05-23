import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import  from './pages/TodoList'
import TodoList from './pages/TodoList';
import Login from './pages/Login';
import ProtectedRoute from './router/ProtectedRoute';
import MainLayout from './pages/MainLayout';
import Homepage from './pages/HomePage';
import NoteList from './pages/NotePage';

const App: React.FC = () => {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Homepage />} />
            <Route path="staff-list" element={<TodoList />} />
            <Route path="notelist-page" element={<NoteList />} />
            <Route path="another-page" element={<TodoList />} />
            <Route path="*" element={<Navigate to="/" />} /> {/* Changed this line */}
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  };
export default App;

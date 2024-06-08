import React from 'react';
import { ConfigProvider } from 'antd';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
// import  from './pages/TodoList'
import TodoList from './pages/TodoList';
import Login from './pages/Login/Login';
import Register from './pages/Login/Register';
import ProtectedRoute from './router/ProtectedRoute';
import MainLayout from './pages/MainLayout';
import Homepage from './pages/HomePage/HomePage';
import NoteList from './pages/NotePage';
import RoomBooking from './pages/Reservation/ReservationPage';
import TeamManagement from './pages/Team/TeamManagement';

const App: React.FC = () => {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route index element={<Homepage />} />
            <Route path="staff-list" element={<TodoList />} />
            <Route path="notelist-page" element={<NoteList />} />
            <Route path="reservation-page" element={<RoomBooking />} />
            <Route path="team-page" element={<TeamManagement />} />
            <Route path="*" element={<Navigate to="/" />} /> {/* Changed this line */}
          </Route>
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  };
export default App;

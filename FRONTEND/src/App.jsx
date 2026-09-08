import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import InicioPage from './pages/InicioPage.jsx'
import AgendarPage from './pages/AgendarPage.jsx'
import ContactosPage from './pages/ContactosPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<InicioPage />} />
        <Route path="/agendar" element={<AgendarPage />} />
        <Route path="/contactos" element={<ContactosPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

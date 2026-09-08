import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navigation from './components/Navigation.jsx'
import Footer from './components/Footer.jsx'
import InicioPage from './pages/InicioPage.jsx'
import AgendarPage from './pages/AgendarPage.jsx'
import ContactosPage from './pages/ContactosPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <main>
        <Routes>
          <Route path="/" element={<InicioPage />} />
          <Route path="/agendar" element={<AgendarPage />} />
          <Route path="/contactos" element={<ContactosPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  )
}

export default App

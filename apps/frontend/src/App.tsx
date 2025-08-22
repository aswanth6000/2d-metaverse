import  { Routes, Route } from 'react-router-dom'
import Loader from './pages/Loader'
import Game from './pages/Game'

const App = () => {
  return (
   <Routes>
        <Route path="/" element={<Loader />} />
        <Route path="/game" element={<Game />} />
        
      </Routes>
  )
}

export default App

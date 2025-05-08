import './App.css'
import "tailwindcss";
import Header from './sections/Header';
import Scanner from './components/Scanner';

function App() {

  return (
    <>
      <div className='w-full flex flex-col items-center justify-center'>
        <div className='container'>
          <Header />
          <Scanner />
          <div className='text-sm'>&copy; 2025 <a className="text-blue-500" href='https://github.com/Hiutaky/wp-sec' target='blank'>WpSec</a> - Powered by <a className='text-blue-500' href='https://github.com/Hiutaky' target='blank'>Hiutaky</a></div>
        </div>
      </div>
    </>
  )
}

export default App;

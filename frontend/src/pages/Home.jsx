import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function Home() {
  const navigate = useNavigate()

  const handleLoginClick = () => {
    navigate('/login')
  }

  return (
    <main className="flex min-h-screen flex-col bg-[#ececec] px-10 py-7 max-[600px]:p-6">
    

      {/* Main center content */}
      <section className="flex flex-1 flex-col items-center justify-center gap-5">
        <h2 className="mb-[10px] mt-0 text-[44px] font-bold max-[600px]:text-4xl">Leave Portal</h2>

        {/* Only two portal buttons as requested */}
        <div className="flex flex-col items-center gap-[14px]">
          <button
            className="w-[260px] cursor-pointer rounded-full bg-[#be2026] px-5 py-3 text-base font-semibold text-white transition duration-200 hover:-translate-y-[1px] hover:bg-[#a61c21] hover:shadow-[0_7px_18px_rgba(0,0,0,0.14)] max-[600px]:w-[220px]"
            type="button"
            onClick={handleLoginClick}
          >
            Login
          </button>

          {/* <Link to="/supervisor" className="portal-btn">
            Supervisor&apos;s Portal
          </Link> */}
        </div>
      </section>
    </main>
  )
}

export default Home

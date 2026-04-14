import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function Login() {
  const navigate = useNavigate();

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate("/leave-apply");
  };

  return (
    <>
      <main className="grid min-h-screen place-items-center bg-[#ececec] p-6 font-['Segoe_UI',Tahoma,Geneva,Verdana,sans-serif] text-[#1d1d1d]">
        <section className="w-full max-w-[380px] rounded-xl bg-white p-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
          <h2 className="mb-5 mt-0 text-center text-[28px] font-semibold">
            Login
          </h2>

          <form className="flex flex-col gap-[10px]" onSubmit={handleSubmit}>
            <label
              className="text-sm font-semibold text-[#333]"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="mb-2 w-full rounded-lg border border-[#cfcfcf] px-3 py-[10px] text-sm focus:border-[#be2026] focus:outline-none focus:ring-4 focus:ring-[rgba(190,32,38,0.15)]"
              id="email"
              type="email"
              placeholder="Enter your email"
            />

            <label
              className="text-sm font-semibold text-[#333]"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="mb-2 w-full rounded-lg border border-[#cfcfcf] px-3 py-[10px] text-sm focus:border-[#be2026] focus:outline-none focus:ring-4 focus:ring-[rgba(190,32,38,0.15)]"
              id="password"
              type="password"
              placeholder="Enter your password"
            />

            <button
              className="mt-2 cursor-pointer rounded-lg bg-[#be2026] px-[14px] py-[10px] text-[15px] font-semibold text-white hover:bg-[#a61c21]"
              type="submit"
            >
              Login
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

export default Login;

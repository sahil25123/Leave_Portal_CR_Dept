import logoImage from '../assets/IITD Logo.jpg'

function Navbar() {
  return (
    <header className="flex w-full items-center justify-between border-b border-[#d8d8d8] bg-[#ececec] px-[50px] py-5 max-[600px]:px-6">
      <div className="flex items-center">
        <img
          src={logoImage}
          alt="DMSE Logo"
          className="h-14 w-auto object-contain"
        />
      </div>

      <div className="flex items-center gap-3">
        <svg
          className="h-6 w-6 text-[#0a66c2]"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="LinkedIn"
        >
          <path d="M19 3A2 2 0 0 1 21 5V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V5A2 2 0 0 1 5 3H19ZM8.34 17.34V10.34H6V17.34H8.34ZM7.17 9.28A1.36 1.36 0 1 0 7.17 6.56A1.36 1.36 0 0 0 7.17 9.28ZM18 17.34V13.5C18 11.44 16.9 10.48 15.43 10.48C14.24 10.48 13.71 11.13 13.42 11.59V10.34H11.08C11.11 11.17 11.08 17.34 11.08 17.34H13.42V13.43C13.42 13.22 13.44 13.01 13.5 12.86C13.66 12.44 14.03 12.01 14.66 12.01C15.49 12.01 15.83 12.65 15.83 13.58V17.34H18Z" />
        </svg>
      </div>
    </header>
  )
}

export default Navbar

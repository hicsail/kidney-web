
"use client";

const Navbar = ({ user }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };
  return (
    <nav style={{ backgroundColor: 'rgb(204, 204, 204)', padding: '2vh'}} className="flex justify-between items-center w-full fixed top-0 left-0">
      <div className="flex items-center">
        <div className="mr-2 h-8 w-8">
          <img src="/vercel.svg" alt="Logo" className="h-full w-full" />
        </div>
        <span className="text-xl font-bold ml-4">Kidney Biopsy App</span>
      </div>
      {user && (
        <div className="relative flex items-center">
          <span className="text-black mr-4">{user.fullname ? user.fullname : user.email}</span>
          <button
            onClick={handleToggleDropdown}
            className="flex items-center focus:outline-none"
          >
            <img
              src="/dropdown-icon.svg"
              alt="Dropdown Icon"
              className={`w-4 h-4 ml-1 transition-transform transform ${isDropdownOpen ? 'rotate-180' : 'rotate-0'}`}
            />
          </button>
          {isDropdownOpen && (
            <div
                className="absolute right-0 w-48 bg-white shadow-lg py-2"
                style={{ top: '2.8rem' }}
            >
              <a href="/auth/logout">
                <button className="block w-full text-center px-5 py-2 text-sm text-black hover:bg-gray-200">
                  Log out
                </button>
              </a>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
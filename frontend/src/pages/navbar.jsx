function Navbar() {
    return (
        <nav className="flex justify-between items-center bg-blue-600 text-white p-4 shadow-md">
            <div>
                <h2>HMS Patient Portal</h2>

                <div>
                    <span>Welcome</span>
                    <button>Logout</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
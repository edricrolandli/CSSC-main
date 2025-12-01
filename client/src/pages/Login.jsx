import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const result = await login(form);

            if (result.success) {
                const from = location.state?.from?.pathname || "/Profile";
                navigate(from, { replace: true });
                return;
            }

            setError(result.error || "Nama, email, atau password salah.");
        } catch (error) {
            setError("Terjadi kesalahan. Silakan coba lagi.");
            console.error("Login error:", error);
        }
    };

    return (
        <>
            <div
                className="min-h-screen bg-cover bg-center flex items-center justify-center w-full overflow-hidden"
                style={{ backgroundImage: 'url("bukuputih.png")' }}
            >
                <div className="bg-[#243e36]/80 backdrop-blur-sm rounded-3xl text-white w-[950px] max-w-5xl h-[460px] flex shadow-xl overflow-hidden">
                    <div className="flex-1 flex flex-col justify-center px-12 gap-6">
                        <div className="flex justify-between items-center">
                            <Link to="/" className="flex gap-2 items-center text-sm">
                                <FaArrowLeft /> Kembali
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2 text-left">
                            <h1 className="text-3xl font-bold">Selamat Datang</h1>
                            <h1 className="text-lg font-light">Login untuk lanjut.</h1>
                        </div>
                        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Nama"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder="Email"
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <input
                                    className="w-full px-4 py-2 rounded-md border border-yellow-300 bg-transparent placeholder:text-gray-200 text-sm focus:outline-none"
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Password"
                                    required
                                />
                                <div className="flex justify-end">
                                    <Link
                                        to="/ResetPassword"
                                        className="text-xs font-light hover:underline"
                                    >
                                        Lupa Password?
                                    </Link>
                                </div>
                            </div>
                            {error && (
                                <p className="text-xs text-red-200 text-left mt-1">{error}</p>
                            )}
                            <div className="flex flex-col gap-2 mt-2 items-center">
                                <button
                                    type="submit"
                                    className="px-10 text-yellow-300 text-xl font-bold py-2 bg-[#1a322b] rounded-2xl"
                                >
                                    Login
                                </button>
                                <div className="flex text-xs items-center justify-center gap-1">
                                    <h1>Belum punya akun?</h1>
                                    <Link className="font-bold hover:underline" to="/Register">Daftar sekarang</Link>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="w-[40%] h-full hidden md:block">
                        <img src="loginpunya.png" alt="bglogin" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </>
    );
};

export default Login;

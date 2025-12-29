import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../../services/axios";
import { supabase } from "../../lib/supabase";
import { useDispatch } from "react-redux";
import { setSession } from "../../store/slices/userSlice";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

    if (data.session) {
      dispatch(setSession(data.session));
      const username = data.user?.user_metadata?.username;
      if (username) {
        try {
          await apiService.post("/users/profile", { username });
        } catch (err) {
          console.error("Failed to sync user profile during login:", err);
        }
      }
    }

    navigate('/');
  }
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    }
    checkSession();
  }, [navigate]);
  return (
    <section className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold text-center text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
          Welcome back! Please enter your details.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <input
              type="email"
              required
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
            <input
              type="password"
              required
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-gray-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-indigo-600 py-2.5 text-white font-medium hover:bg-indigo-700 transition focus:ring-2 focus:ring-indigo-500"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Don't have an account yet?{" "}
          <span
            onClick={() => navigate("/register")}
            className="cursor-pointer text-indigo-600 hover:underline"
          >
            Sign up
          </span>
        </p>
      </div>
    </section>
  );
}

export default Login
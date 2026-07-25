import { useNavigate, Link } from 'react-router-dom';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import { useMemo, useState } from 'react';
import Swal from 'sweetalert2';

const Login = () => {
  const videoList = useMemo(() => ['/assets/1.mp4', '/assets/2.mp4', '/assets/3.mp4', '/assets/4.mp4', '/assets/5.mp4', '/assets/6.mp4'], []);
  const randomVideo = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    return videoList[randomIndex];
  }, [videoList]);

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Save full user object to localStorage
        const userToSave = {
          ...data.user, // All backend fields
          // Fallbacks if backend structure is flat or different
          name: data.user?.name || data.name || 'User',
          email: data.user?.email || data.email || formData.email,
          avatar: data.user?.avatar || null
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        window.dispatchEvent(new Event('storage'));

        Swal.fire({
          title: 'Hoşgeldiniz!',
          text: 'Giriş başarılı.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/'); // Ana sayfaya yönlendir
        });
      } else {
        Swal.fire({
          title: 'Hata!',
          text: data.message || 'Giriş yapılamadı.',
          icon: 'error',
          confirmButtonText: 'Tamam'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        title: 'Hata!',
        text: 'Sunucu hatası.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <video
          key={randomVideo}
          src={randomVideo}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>
      <div className="max-w-md w-full space-y-8 bg-white/5 p-8 rounded-2xl border border-white/10 backdrop-blur-sm relative z-10">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link to="/create-account" className="font-medium text-accent hover:text-accent-hover">
              create a new account
            </Link>
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => window.location.href = 'http://127.0.0.1:8000/api/auth/google'}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <FaGoogle className="mr-2" /> Continue with Google
            </button>
            <button
              onClick={() => window.location.href = 'http://127.0.0.1:8000/api/auth/facebook'}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <FaFacebook className="mr-2" /> Continue with Facebook
            </button>

          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400 rounded-full">Or continue with email</span>
            </div>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <input type="hidden" name="remember" defaultValue="true" />
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-t-md"
                  placeholder="Email address"
                />
              </div>
              <div>
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-b-md"
                  placeholder="Password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-accent bg-gray-700 border-gray-600 rounded focus:ring-accent"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-accent hover:text-accent-hover">
                  Forgot your password?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-bg bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

import { useNavigate, Link } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';
import Swal from 'sweetalert2';

const CreateAccount = () => {
  const videoList = useMemo(() => ['/assets/1.mp4', '/assets/2.mp4', '/assets/3.mp4', '/assets/4.mp4', '/assets/5.mp4', '/assets/6.mp4'], []);
  const randomVideo = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    return videoList[randomIndex];
  }, [videoList]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    dob: '',
    gender: 'Gender',
    google_id: '',
    avatar: '',
    location: ''
  });

  const [isGoogleSignup, setIsGoogleSignup] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const googlePending = params.get('google_pending');

    if (googlePending === 'true') {
      setIsGoogleSignup(true);
      setFormData(prev => ({
        ...prev,
        email: params.get('email') || '',
        username: params.get('name') || '',
        google_id: params.get('google_id') || '',
        avatar: params.get('avatar') || '',
        location: params.get('location') || ''
      }));
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Auto-login logic
        // Ensure we save a consistent user object structure
        const userToSave = {
          ...data.user,
          // Fallbacks just in case backend structure varies
          name: data.user?.name || data.name || formData.username,
          email: data.user?.email || data.email || formData.email,
          avatar: data.user?.avatar || data.avatar || formData.avatar,
          location: data.user?.location || data.location || formData.location
        };
        localStorage.setItem('user', JSON.stringify(userToSave));
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        window.dispatchEvent(new Event('storage'));

        Swal.fire({
          title: 'Success!',
          text: 'Account created! Logging you in...',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/');
        });
      } else {
        // Handle errors
        console.log('Error response data:', data);

        let errorMessage = 'Something went wrong.';

        if (data) {
          if (data.errors) {
            errorMessage = Object.values(data.errors).flat().join('\n');
          } else if (data.message) {
            errorMessage = data.message;
          } else if (data.detail) {
            errorMessage = data.detail;
          } else if (data.error) {
            errorMessage = data.error;
          } else {
            // Try to handle direct validation error object (e.g. { password: ["error"] })
            const values = Object.values(data);
            // Check if all values are strings or arrays of strings, which implies validation map
            const isValidationMap = values.every(val =>
              (Array.isArray(val) && val.every(v => typeof v === 'string')) ||
              typeof val === 'string'
            );

            if (isValidationMap && values.length > 0) {
              errorMessage = values.flat().join('\n');
            } else {
              try {
                errorMessage = JSON.stringify(data);
              } catch (e) {
                errorMessage = 'Unknown error format.';
              }
            }
          }
        }

        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK'
        });
        console.error('Registration failed:', data);
      }
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        title: 'Hata!',
        text: 'Sunucu ile iletişim kurulamadı.',
        icon: 'error',
        confirmButtonText: 'Tamam'
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg text-fg flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 z-0">
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
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => window.location.href = 'http://127.0.0.1:8000/api/auth/google'}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
            >
              <FaGoogle className="mr-2" /> Sign up with Google
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <FaFacebook className="mr-2" /> Sign up with Facebook
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-800 hover:bg-gray-900">
              <FaApple className="mr-2" /> Sign up with Apple
            </button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-900 text-gray-400 rounded-full">Or create an account with email</span>
            </div>
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input id="username" name="username" type="text" required value={formData.username} onChange={handleChange} disabled={isGoogleSignup} className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-t-md ${isGoogleSignup ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Username" />
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} disabled={isGoogleSignup} className={`appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm ${isGoogleSignup ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="Email address" />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required value={formData.password} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm" placeholder="Password" />
            </div>
            <div>
              <label htmlFor="dob" className="sr-only">Date of Birth</label>
              <input id="dob" name="dob" type="date" required value={formData.dob} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="gender" className="sr-only">Gender</label>
              <select id="gender" name="gender" required value={formData.gender} onChange={handleChange} className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-b-md">
                <option>Gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Non-binary</option>
                <option>Prefer not to say</option>
              </select>
            </div>
          </div>


          <div>
            <button type="submit" className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-bg bg-accent hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-hover">
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAccount;
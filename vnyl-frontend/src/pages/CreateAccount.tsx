import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { FaGoogle, FaFacebook, FaApple } from 'react-icons/fa';

const CreateAccount = () => {
  const videoList = useMemo(() => ['/assets/1.mp4', '/assets/2.mp4', '/assets/3.mp4', '/assets/4.mp4', '/assets/5.mp4', '/assets/6.mp4'], []);
  const randomVideo = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * videoList.length);
    return videoList[randomIndex];
  }, [videoList]);

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
                <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
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

        <form className="space-y-6" action="#" method="POST">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input id="username" name="username" type="text" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-t-md" placeholder="Username"/>
            </div>
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input id="email-address" name="email" type="email" autoComplete="email" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm" placeholder="Email address"/>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input id="password" name="password" type="password" autoComplete="new-password" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm" placeholder="Password"/>
            </div>
            <div>
              <label htmlFor="dob" className="sr-only">Date of Birth</label>
              <input id="dob" name="dob" type="date" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm"/>
            </div>
            <div>
              <label htmlFor="gender" className="sr-only">Gender</label>
              <select id="gender" name="gender" required className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-accent focus:border-accent focus:z-10 sm:text-sm rounded-b-md">
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
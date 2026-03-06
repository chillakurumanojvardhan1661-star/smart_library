export default function PendingApproval() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Account Pending Approval</h1>
          <p className="text-lg text-gray-600">Your registration is under review</p>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-6 text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">What's Next?</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Your account has been successfully created but requires administrator approval before you can access the library system.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-left mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-800">Admin Review</h4>
              <p className="text-gray-600 text-sm">The library administrator will review your registration details.</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-800">Approval Notification</h4>
              <p className="text-gray-600 text-sm">You'll receive an email once your account is approved.</p>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
            </div>
            <div className="ml-4">
              <h4 className="font-semibold text-gray-800">Start Using Library</h4>
              <p className="text-gray-600 text-sm">Login again to access all library features.</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h4 className="font-semibold text-gray-800 mb-2">Need Help?</h4>
          <p className="text-gray-600 text-sm mb-3">
            If you have any questions or need immediate assistance, please contact the library administration.
          </p>
          <div className="text-sm text-gray-700">
            <p><strong>Email:</strong> library@vitap.ac.in</p>
            <p><strong>Phone:</strong> +91 (123) 456-7890</p>
            <p><strong>Office Hours:</strong> Mon-Fri, 9:00 AM - 5:00 PM</p>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
        >
          Return to Login
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Typical approval time: 24-48 hours
        </p>
      </div>
    </div>
  );
}

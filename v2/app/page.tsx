import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Swoletron v2
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your training calendar and workout tracker
        </p>
        <Link 
          href="/calendar"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors w-full sm:w-auto"
        >
          View Training Calendar
        </Link>
      </div>
    </div>
  )
}

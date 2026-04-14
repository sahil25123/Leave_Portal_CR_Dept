import React from 'react'
import Navbar from '../components/Navbar'

function LeaveApply() {
  const handleSubmit = (event) => {
    event.preventDefault()
  }

  return (
    <>
      <Navbar/>

      <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <section className="w-full max-w-4xl rounded-2xl bg-white p-6 shadow-md md:p-8">
        

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Apply for Leave
          </h1>

          <button
            type="button"
            className="rounded-full border border-red-200 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Logout
          </button>
        </div>

        <p className="mb-6 text-sm text-gray-500">
          All required fields must be completed.
        </p>

        <form className="space-y-6" onSubmit={handleSubmit}>
          
          {/* GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Full Name */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Contact */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Contact (while on leave)
              </label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Leave Type */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Leave Type
              </label>
              <select
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              >
                <option value="" disabled>
                  -- Select type --
                </option>
                <option value="casual">Casual Leave</option>
                <option value="sick">Sick Leave</option>
                <option value="earned">Earned Leave</option>
              </select>
            </div>

            {/* From */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                From
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* To */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                To
              </label>
              <input
                type="date"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Supervisor */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Choose Supervisor
              </label>
              <select
                defaultValue=""
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              >
                <option value="" disabled>
                  -- Select Supervisor --
                </option>
                <option value="supervisor-1">Supervisor 1</option>
                <option value="supervisor-2">Supervisor 2</option>
              </select>
            </div>

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Reason / Notes
              </label>
              <textarea
                rows="4"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-red-500 outline-none"
              />
            </div>

            {/* Attachment */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Attachment (optional)
              </label>
              <input
                type="file"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm file:mr-3 file:rounded-md file:border file:border-gray-300 file:bg-gray-100 file:px-3 file:py-1"
              />
            </div>

          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              className="rounded-full bg-red-700 px-6 py-2 text-sm font-semibold text-white hover:bg-red-800"
            >
              Submit
            </button>
          </div>

          {/* Link */}
          <a
            href="#"
            className="inline-block text-sm text-gray-600 underline hover:text-gray-800"
          >
            View My Leaves
          </a>
        </form>

      </section>
    </main>
    </>
  )
}

export default LeaveApply

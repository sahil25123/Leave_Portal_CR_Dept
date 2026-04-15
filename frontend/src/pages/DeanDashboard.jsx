function DeanDashboard() {
  const assignedLeaves = [
    {
      id: 1,
      studentName: 'Sahil Gupta',
      entryNo: '2021CS10123',
      fromDate: '2026-04-18',
      toDate: '2026-04-21',
      details:
        'Requesting 4 days of leave due to a family medical emergency and travel outside Delhi.',
    },
    {
      id: 2,
      studentName: 'Ananya Sharma',
      entryNo: '2022ME10451',
      fromDate: '2026-04-22',
      toDate: '2026-04-24',
      details:
        'Applying for leave to attend an inter-university research presentation in Bengaluru.',
    },
    {
      id: 3,
      studentName: 'Rohit Verma',
      entryNo: '2020EE10087',
      fromDate: '2026-04-25',
      toDate: '2026-04-27',
      details:
        'Need leave for personal reasons and to complete important documentation work at home.',
    },
  ]

  return (
    <main className="min-h-screen bg-gray-100 p-4 md:p-8">
      <section className="mx-auto w-full max-w-6xl rounded-xl bg-white p-5 shadow-md md:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">Your Assigned Leaves</h1>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              My Profile
            </button>
            <button
              type="button"
              className="rounded-full border border-gray-300 bg-white px-5 py-2 font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {assignedLeaves.map((leave) => (
            <article
              key={leave.id}
              className="flex flex-col gap-4 rounded-2xl bg-gradient-to-r from-red-700 to-red-500 p-5 text-white shadow-md md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-bold">
                  {leave.studentName.charAt(0)}
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-semibold leading-tight md:text-xl">
                    {leave.studentName} ({leave.entryNo})
                  </p>
                  <p className="text-sm font-medium text-red-50 md:text-base">
                    From: {leave.fromDate} → To: {leave.toDate}
                  </p>
                  <p className="max-w-3xl text-sm text-red-50 md:text-base">{leave.details}</p>
                </div>
              </div>

              <div className="flex flex-row gap-2 md:flex-col">
                <button
                  type="button"
                  className="rounded-full border border-white/70 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  View
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/70 bg-green-600/80 px-4 py-1.5 text-sm font-semibold text-white hover:bg-green-600"
                >
                  Approve
                </button>
                <button
                  type="button"
                  className="rounded-full border border-white/70 bg-red-900/60 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-900/80"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default DeanDashboard

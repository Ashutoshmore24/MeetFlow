import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <h1 className="text-5xl font-bold text-blue-500">
        MeetFlow
      </h1>
    </div>
  )
}

export default App

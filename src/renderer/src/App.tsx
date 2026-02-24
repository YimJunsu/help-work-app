import { useEffect } from 'react'
import { Layout } from './components/Layout'
import { Toaster, toast } from 'sonner'

function App(): React.JSX.Element {
  useEffect(() => {
    window.api.onScheduleNotify(({ title, body }) => {
      toast.warning(body, {
        description: title,
        duration: 8000,
      })
    })
  }, [])

  return (
    <>
      <Layout />
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          classNames: {
            toast: 'font-sans text-[13px]',
          },
        }}
      />
    </>
  )
}

export default App

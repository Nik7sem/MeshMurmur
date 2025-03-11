import {toaster} from "@/components/ui/toaster"

export default function useToast(duration = 6000) {
  function errorToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'error',
      duration: duration,
    })
  }

  function successToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'success',
      duration: duration,
    })
  }

  function infoToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'info',
      duration: duration,
    })
  }

  function warningToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'warning',
      duration: duration,
    })
  }

  return {errorToast, successToast, infoToast, warningToast}
}
import {toaster} from "@/components/ui/toaster"

export default function useToast(duration = 6000) {
  function errorToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'error',
      duration: duration,
      action: {
        label: "✕",
        onClick: () => {
        },
      },
    })
  }

  function successToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'success',
      duration: duration,
      action: {
        label: "✕",
        onClick: () => {
        },
      },
    })
  }

  function infoToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'info',
      duration: duration,
      action: {
        label: "✕",
        onClick: () => {
        },
      },
    })
  }

  function warningToast(title: string, description?: string) {
    toaster.create({
      title: title,
      description: description,
      type: 'warning',
      duration: duration,
      action: {
        label: "✕",
        onClick: () => {
        },
      },
    })
  }

  return {errorToast, successToast, infoToast, warningToast}
}
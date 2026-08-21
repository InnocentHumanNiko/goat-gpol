import type { SkinApi } from "@/lib/replay-types"

export type UploadProgress = {
  percent: number
  mbps: number
}

export function uploadSkin({
  name,
  file,
  onProgress,
}: {
  name: string
  file: File
  onProgress?: (progress: UploadProgress) => void
}): Promise<SkinApi> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({ name, fileName: file.name })
    const xhr = new XMLHttpRequest()
    xhr.open("POST", `/skins?${params}`)
    xhr.responseType = "json"
    const startedAt = performance.now()
    xhr.upload.onprogress = (e) => {
      if (!onProgress) {
        return
      }
      const elapsed = (performance.now() - startedAt) / 1000
      onProgress({
        percent: e.total > 0 ? Math.round((e.loaded / e.total) * 100) : 0,
        mbps: elapsed > 0 ? e.loaded / elapsed / (1024 * 1024) : 0,
      })
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response as SkinApi)
      } else {
        reject(new Error("skin-upload-failed"))
      }
    }
    xhr.onerror = () => reject(new Error("skin-upload-failed"))
    xhr.onabort = () => reject(new Error("skin-upload-failed"))
    xhr.setRequestHeader("Content-Type", "application/octet-stream")
    xhr.send(file)
  })
}

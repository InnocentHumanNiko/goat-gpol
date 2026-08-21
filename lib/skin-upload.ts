import type { SkinApi } from "@/lib/replay-types"

export const SKIN_RULESETS = ["osu", "mania", "catch", "taiko"] as const

export type SkinRuleset = (typeof SKIN_RULESETS)[number]

export const SKIN_TYPES = ["nm", "hd", "hr", "dt", "low_ar", "extra"] as const

export type SkinType = (typeof SKIN_TYPES)[number]

export type UploadProgress = {
  percent: number
  mbps: number
}

export function uploadSkin({
  name,
  file,
  rulesets,
  type,
  description,
  scrollSpeed,
  onProgress,
}: {
  name: string
  file: File
  rulesets: SkinRuleset[]
  type: SkinType
  description?: string
  scrollSpeed?: number
  onProgress?: (progress: UploadProgress) => void
}): Promise<SkinApi> {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      name,
      fileName: file.name,
      rulesets: rulesets.join(","),
      type,
      description: description ?? "",
    })
    if (scrollSpeed !== undefined) {
      params.set("scrollSpeed", String(scrollSpeed))
    }
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

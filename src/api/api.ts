// src/api/api.ts
import axios from "axios"
import { v4 } from "uuid"

import { useNotificationStore } from "@src/providers/NotificationProvider"
import { NotificationType } from "@src/stores/notificationStore"

const SOLVER_RELAY_0_URL = process.env.SOLVER_RELAY_0_URL || ""
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY || ""

export const useInterceptors = () => {
  const notification = useNotificationStore((state) => state)

  const validateNext = (responseURL: string) => {
    const urlsToCheck = [SOLVER_RELAY_0_URL, COINGECKO_API_KEY].filter(Boolean)
    return urlsToCheck.some((apiUrl) => new RegExp(apiUrl).test(responseURL))
  }

  const validateAndPushNotification = (
    requestPayload: string,
    notificationType: NotificationType
  ) => {
    let payload
    try {
      payload = JSON.parse(requestPayload)
    } catch (e) {
      console.error("Failed to parse request payload", e)
      return
    }

    const methodsToCheck = ["publish_intent"]
    const method = payload?.method
    if (methodsToCheck.includes(method)) {
      switch (method) {
        case "publish_intent":
          notification.setNotification({
            id:
              (payload?.params?.length && payload.params[0].intent_id) || v4(),
            message:
              notificationType === NotificationType.SUCCESS
                ? "Intent has been published!"
                : "Intent hasn't been published!",
            type: notificationType,
          })
          break
        default:
          break
      }
    }
  }

  axios.interceptors.response.use(
    (response) => {
      if (validateNext(response.request?.responseURL)) {
        validateAndPushNotification(
          response.config.data,
          NotificationType.SUCCESS
        )
      }
      return response
    },
    (error) => {
      if (validateNext(error.request?.responseURL)) {
        validateAndPushNotification(error.config.data, NotificationType.ERROR)
      }
      return Promise.reject(error)
    }
  )

  const open = XMLHttpRequest.prototype.open
  const send = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null
  ) {
    this._method = method
    this._url = url.toString()
    open.call(this, method, url, async, username, password)
  }

  XMLHttpRequest.prototype.send = function (body) {
    this._body = body

    this.addEventListener("load", function () {
      if (validateNext(this?.responseURL)) {
        if (this.status >= 200 && this.status < 300) {
          validateAndPushNotification(this._body, NotificationType.SUCCESS)
        } else {
          validateAndPushNotification(this._body, NotificationType.ERROR)
        }
      }
    })

    this.addEventListener("error", function () {
      if (validateNext(this?.responseURL)) {
        validateAndPushNotification(this._body, NotificationType.ERROR)
      }
    })

    send.call(this, body)
  }
}

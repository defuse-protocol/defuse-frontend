"use client"

import * as Toast from "@radix-ui/react-toast"
import { Text } from "@radix-ui/themes"
import Image from "next/image"
import React, { useEffect, useState } from "react"

import { useNotificationStore } from "@src/providers/NotificationProvider"
import type { Notification } from "@src/stores/notificationStore"

const Snackbar = () => {
  const { data, deleteNotification } = useNotificationStore((state) => state)
  const [openNotifications, setOpenNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (data.size) {
      const newOpenNotifications: Notification[] = []
      for (const value of data.values()) {
        newOpenNotifications.push(value)
      }
      setOpenNotifications(newOpenNotifications)
    }
  }, [data])

  const handleOpenChange = (id: string) => {
    setOpenNotifications((prev) =>
      prev.filter((notification) => notification.id !== id)
    )
    deleteNotification(id)
  }

  return (
    <Toast.Provider swipeDirection="right">
      {openNotifications.map(({ id, message }) => (
        <Toast.Root
          key={id}
          className="ToastRoot dark:bg-black-800"
          open={Boolean(id) || false}
          onOpenChange={() => handleOpenChange(id)}
        >
          <Toast.Title className="ToastTitle">
            <Text size="1" weight="bold" className="mb-1">
              {message}
            </Text>
          </Toast.Title>
          <Toast.Description asChild>
            <time
              className="ToastDescription"
              dateTime={new Date().toISOString()}
            >
              <Text size="1" className="text-nowrap">
                {prettyDate(new Date())}
              </Text>
            </time>
          </Toast.Description>
          <Toast.Action
            className="ToastAction"
            asChild
            altText="Close notification"
          >
            <button type={"button"}>
              <Image
                src="/static/icons/close.svg"
                width={12}
                height={12}
                alt="Close"
              />
            </button>
          </Toast.Action>
        </Toast.Root>
      ))}
      <Toast.Viewport className="ToastViewport" />
    </Toast.Provider>
  )
}

function prettyDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date)
}

export default Snackbar

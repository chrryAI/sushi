import type { app, guest, user } from "../types"
import {
  GUEST_CREDITS_PER_MONTH,
  isE2E,
  MEMBER_CREDITS_PER_MONTH,
} from "../utils"
import isOwner from "./isOwner"

export const getHourlyLimit = ({
  member,
  guest,
  app,
}: {
  app?: app | null
  member?: user | null
  guest?: guest | null
}) => {
  if (isE2E) {
    return 5000
  }

  const multiplier =
    (member?.subscription?.plan || guest?.subscription?.plan === "pro"
      ? 3
      : 2) *
    (app && isOwner(app, { userId: app?.userId, guestId: app?.guestId })
      ? 2
      : 1) *
    (isE2E ? 1 : 1)

  if (member) {
    return MEMBER_CREDITS_PER_MONTH * multiplier
  } else {
    return GUEST_CREDITS_PER_MONTH * multiplier
  }
}

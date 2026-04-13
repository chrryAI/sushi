import type { app, guest, user } from "../types"
import { isE2E } from "../utils"
import isOwner from "./isOwner"

export const getHourlyLimit = ({
  member,
  guest,
  app,
}: {
  app?: app
  member?: user
  guest?: guest
}) => {
  const subscription = member?.subscription || guest?.subscription

  if (member?.role === "admin" && !isE2E) return 500

  const appOwnerMultiplier =
    app && isOwner(app, { userId: app?.userId, guestId: app?.guestId }) ? 2 : 1
  if (subscription) {
    return subscription?.plan === "pro"
      ? 200 * appOwnerMultiplier
      : 100 * appOwnerMultiplier
  } else if (member) {
    return 30 * appOwnerMultiplier
  } else {
    return 10
  }
}

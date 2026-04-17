import { feedbackTransactions } from "@chrryai/machine/src/schema"
import { and, eq } from "drizzle-orm"
import { db } from "./index"

export const createFeedbackTransaction = async (
  data: typeof feedbackTransactions.$inferInsert,
) => {
  try {
    const [created] = await db
      .insert(feedbackTransactions)
      .values(data)
      .returning()
    return created
  } catch (error) {
    console.error("Error creating feedback transaction:", error)
    return null
  }
}

export const getFeedbackTransactions = async (userId: string) => {
  try {
    const transactions = await db
      .select()
      .from(feedbackTransactions)
      .where(and(eq(feedbackTransactions.feedbackUserId, userId)))
    return transactions
  } catch (error) {
    console.error("Error getting feedback transactions:", error)
    return []
  }
}

export const getUserPearCredits = async (userId: string) => {
  try {
    const transactions = await db
      .select()
      .from(feedbackTransactions)
      .where(eq(feedbackTransactions.feedbackUserId, userId))

    const totalCredits = transactions.reduce((sum, t) => {
      if (
        t.transactionType === "monthly_allocation" ||
        t.transactionType === "credit_purchase"
      ) {
        return sum + t.amount
      } else if (t.transactionType === "feedback_given") {
        return sum - t.amount
      }
      return sum
    }, 0)

    return totalCredits
  } catch (error) {
    console.error("Error calculating pear credits:", error)
    return 0
  }
}

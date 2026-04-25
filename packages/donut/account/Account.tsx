"use client"
import React, { lazy, useEffect, useState } from "react"
import toast from "react-hot-toast"
import { FaApple, FaGoogle } from "react-icons/fa"
import { validate } from "uuid"
import A from "../a/A"

const CharacterProfiles = lazy(() => import("../CharacterProfiles"))

import Checkbox from "../Checkbox"
import ConfirmButton from "../ConfirmButton"
import { useAppContext } from "../context/AppContext"
import { useAuth, useError, useNavigationContext } from "../context/providers"
import { useStyles } from "../context/StylesContext"
import { useRouter, useSearchParams } from "../hooks/useWindowHistory"
import Img from "../Image"
import {
  AtSign,
  CircleX,
  Copy,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  UserRound,
} from "../icons"
import Loading from "../Loading"
import { uploadUserImage } from "../lib"
import Modal from "../Modal"
import {
  Button,
  Div,
  FilePicker,
  Input,
  P,
  usePlatform,
  useTheme,
} from "../platform"
import {
  apiFetch,
  BrowserInstance,
  checkIsExtension,
  isValidUsername,
} from "../utils"
import { useAccountStyles } from "./Account.styles"

export default function Account({
  style,
  key,
  dataTestId,
}: {
  style?: React.CSSProperties
  key?: string
  dataTestId?: string
}) {
  const { push } = useRouter()

  const styles = useAccountStyles()

  const { enableSound, setEnableSound } = useTheme()
  const { utilities } = useStyles()

  const { isTauri } = usePlatform()

  const { t } = useAppContext()

  // Auth context
  const {
    user,
    signOut,
    setUser,
    token,
    signInContext,
    signOutContext,
    isExtensionRedirect,
    FRONTEND_URL,
    API_URL,
    downloadUrl,
    from,
    setEnv,
    env,
    actions,
    enableNotifications,
    setEnableNotifications,
  } = useAuth()

  const { isAccountVisible: isModalOpen, setIsAccountVisible: setIsModalOpen } =
    useNavigationContext()

  const { captureException } = useError()

  const { addHapticFeedback } = useTheme()

  const searchParams = useSearchParams()
  const isExtension = checkIsExtension()
  const isAppleAvailable = false
  const isOAuthAccountNotLinkedError =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("error") ===
      "OAuthAccountNotLinked"

  const [userName, setUserName] = React.useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)

  const [_isUserNameNotSet, setIsUserNameNotSet] =
    React.useState<boolean>(false)

  useEffect(() => {
    if (user?.userName) {
      if (validate(user.userName)) {
        setIsModalOpen(true)
        setIsUserNameNotSet(false)
      } else {
        setUserName(user.userName)
      }
    } else if (user) {
      // Only open modal if user exists but has no userName
      setIsModalOpen(true)
      setIsUserNameNotSet(true)
    }
  }, [user?.userName, user?.id, setIsModalOpen])

  const isLoggingOut = searchParams.get("logout") === "true" || undefined
  const [isSaving, setIsSaving] = useState(false)
  const [apiKey, setApiKey] = useState<string | undefined>(
    user?.apiKey || undefined,
  )
  const [isGeneratingKey, setIsGeneratingKey] = useState(false)

  const handleGenerateApiKey = async () => {
    if (!token) return
    setIsGeneratingKey(true)
    try {
      const res = await apiFetch(`${API_URL}/auth/apikey/generate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const errorText = await res.text().catch(() => "Unknown error")
        console.error("API key generation failed:", errorText)
        toast.error(t("Failed to generate API key"))
        return
      }

      const data = await res.json()
      if (data.apiKey) {
        setApiKey(data.apiKey)

        try {
          await navigator.clipboard.writeText(data.apiKey)
          toast.success(t("API key generated & copied!"))
        } catch (clipboardError) {
          console.error("Clipboard write failed:", clipboardError)
          toast.success(t("API key generated!"))
          toast(t("Could not copy to clipboard"), { icon: "⚠️" })
        }
      }
    } catch (error) {
      console.error("API key generation error:", error)
      toast.error(t("Failed to generate API key"))
    } finally {
      setIsGeneratingKey(false)
    }
  }

  const handleUsernameSubmit = async () => {
    addHapticFeedback()
    if (!user?.id) {
      toast.error("User not found")
      return
    }
    setIsSaving(true)

    const value = userName

    if (!value || !isValidUsername(value)) {
      if (value.length > 10) {
        toast.error(`${t("Oops, 20 characters max please")} 😅`)
      } else {
        toast.error(`${t("Need 3-20 letters and numbers only")} 😅`)
      }

      setIsSaving(false)
      return
    }

    try {
      const response = await apiFetch(`${API_URL}/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userName: value }),
      })
      const data = await response.json()

      if (!response.ok || data.error) {
        toast.error(data.error || t("Error updating username"))
      }

      if (response.ok) {
        setUser({
          ...user,
          userName: value,
        })

        setIsModalOpen(false)
        toast.success(t("You are all set"))
      }
    } catch (error) {
      console.error(new Error("Error updating username:"), error)
      captureException(error)
      toast.error(t("Error updating username"))
    } finally {
      setIsSaving(false)
    }
  }
  useEffect(() => {
    if (isLoggingOut) {
      setTimeout(() => {
        handleLogout()
      }, 2000)
    }
  }, [isLoggingOut])

  const handleLogout = async () => {
    addHapticFeedback()
    if (isExtension) {
      await signOut()
      BrowserInstance?.runtime?.sendMessage({
        action: "openInSameTab",
        url: `${FRONTEND_URL}?account=true&logout=true&extension=true`,
      })
    }

    await signOut()

    if (isTauri) {
      return
    }
    // setIsModalOpen(false)

    if (!isExtension) {
      signOutContext?.({
        callbackUrl: `${FRONTEND_URL}/?loggedOut=true${isExtensionRedirect ? "&extension=true" : ""}`,
      })
    }

    const searchParams = new URLSearchParams(window.location.search)
    searchParams.delete("account")
    const newUrl = searchParams.toString()
      ? `?${searchParams.toString()}`
      : window.location.pathname

    push(newUrl)
  }

  const [isUploading, setIsUploading] = useState(false)

  const triggerFileInput = () => {
    addHapticFeedback()

    // Reset the input by changing its key (forces re-render)
    setInputKey((prev) => prev + 1)

    // Small delay to ensure the input is re-rendered before clicking
    setTimeout(() => {
      fileInputRef.current?.click()
    }, 10)
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!token) return
    const target = e.target as HTMLInputElement
    if (!target.files?.[0]) return

    const file = target.files[0]

    // Add validation
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error("Image must be less than 5MB")
      return
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, and WebP images are allowed")
      return
    }

    setIsUploading(true)

    try {
      const response = await uploadUserImage({
        token,
        file: target.files[0],
      })
      if (response.error) {
        toast.error(response.error)
      } else {
        const updatedUser = await actions.getUser()
        setUser(updatedUser)
      }
    } catch (_error) {
      toast.error("Error uploading image")
    } finally {
      setIsUploading(false)
    }
  }

  const [inputKey, setInputKey] = React.useState(0) // Force re-render
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  return (
    <>
      <Button
        key={`account-button-${key}`}
        data-testid={dataTestId || "account-button"}
        className="transparent"
        style={{
          ...utilities.transparent.style,
          ...utilities.small.style,
          display: "flex",
          ...style,
        }}
        onClick={() => {
          if (isExtension) {
            BrowserInstance?.runtime?.sendMessage({
              action: "openInSameTab",
              url: `${FRONTEND_URL}?account=true`,
            })
            return
          }

          addHapticFeedback()
          setIsModalOpen(true)
        }}
      >
        <UserRound size={16} />
        {t("Account")}
      </Button>
      <Modal
        data-testid={`account-modal`}
        params={`?account=true&from=${from}`}
        hideOnClickOutside={false}
        hasCloseButton
        icon={"🎉"}
        onToggle={(open) => setIsModalOpen(open)}
        title={
          <>
            {t("Welcome")} {user?.name?.split(" ")[0]}!
          </>
        }
        isModalOpen={isModalOpen}
      >
        <Div style={styles.accountContainer.style}>
          <Div>
            {!user ? (
              <Loading />
            ) : (
              <Div>
                <Div style={styles.email.style}>
                  <Div style={styles.userImageContainer.style}>
                    <FilePicker
                      key={inputKey}
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />
                    <Button
                      disabled={isUploading}
                      title={t("Edit Image")}
                      aria-label={t("Edit Image")}
                      onClick={() => triggerFileInput()}
                      className="link"
                      style={{
                        ...utilities.link.style,
                        ...styles.userImageWrapper.style,
                      }}
                    >
                      {user?.image &&
                      !user?.image.includes("googleusercontent") ? (
                        <Img
                          style={styles.userImage.style}
                          src={user.image}
                          width={50}
                          height={50}
                          alt={user.name || ""}
                        />
                      ) : (
                        <Img
                          icon="spaceInvader"
                          showLoading={false}
                          alt="Space Invader"
                          width={40}
                          height={40}
                        />
                      )}

                      <Div
                        className="transparent"
                        style={{
                          ...utilities.button.style,
                          ...utilities.transparent.style,
                          ...styles.editImageButton.style,
                        }}
                      >
                        {isUploading ? (
                          <Loading width={12} height={12} />
                        ) : (
                          <Pencil size={12} />
                        )}
                      </Div>
                    </Button>

                    {user.image && (
                      <Button
                        title={t("Remove Image")}
                        style={utilities.link.style}
                        onClick={async () => {
                          if (!token) return
                          try {
                            setIsUploading(true)
                            const response = await uploadUserImage({
                              token,
                              file: null,
                            })
                            if (response.error) {
                              toast.error(response.error)
                            } else {
                              const updatedUser = await actions.getUser()
                              setUser(updatedUser)
                            }
                          } catch (_error) {
                            toast.error("Error removing image")
                          } finally {
                            setIsUploading(false)
                          }
                        }}
                      >
                        <CircleX size={16} />
                      </Button>
                    )}
                  </Div>
                  {user?.email} <CharacterProfiles />
                </Div>
                <Div style={styles.userNameContainer.style}>
                  <AtSign size={24} />
                  <Input
                    onChange={(e) => setUserName(e.target.value)}
                    value={userName}
                    placeholder={t("Let's set a username")}
                    type="text"
                    style={styles.userNameContainerInput.style}
                  />
                  <Button onClick={handleUsernameSubmit} disabled={isSaving}>
                    {isSaving ? <Loading width={20} height={20} /> : t("Save")}
                  </Button>
                </Div>
              </Div>
            )}
          </Div>

          <Div data-testid="account-email" style={styles.deleteAccount.style}>
            {!isExtension && (
              <ConfirmButton
                className="transparent"
                style={{
                  ...styles.deleteAccountButton.style,
                  ...utilities.transparent.style,
                }}
                confirm={
                  <>
                    <Trash2 size={16} /> {t("Are you sure?")}
                  </>
                }
                onConfirm={async () => {
                  if (!token) return

                  setIsDeleting(true)
                  try {
                    // Finally delete the user account
                    await actions.removeUser()

                    setIsModalOpen(false)
                  } catch (error) {
                    captureException(error)
                    console.error("Error during account deletion:", error)
                    toast.error(t("Failed to delete account"))
                  } finally {
                    signOut()
                    setIsDeleting(false)
                  }
                }}
              >
                {isDeleting ? (
                  <Loading width={16} height={16} color={"var(--accent-0)"} />
                ) : (
                  <Trash2 size={16} color={"var(--accent-0)"} />
                )}{" "}
                {t("Delete account")}
              </ConfirmButton>
            )}
          </Div>

          {/* API Key Section */}
          <Div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "8px 0",
            }}
          >
            <Div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "0.8rem",
              }}
            >
              <Img slug="coder" /> {t("API Key")}*
            </Div>
            <Div
              style={{ display: "flex", alignItems: "center", gap: ".75rem" }}
            >
              <code
                style={{
                  flex: 1,
                  fontSize: "0.85rem",
                  fontFamily: "monospace",
                  color: "var(--shade-7)",
                  borderRadius: "6px",
                  padding: "4px 8px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {apiKey
                  ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
                  : t("No key yet")}
              </code>
              {apiKey && (
                <Button
                  className="link"
                  style={utilities.link.style}
                  title={t("Copy")}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(apiKey)
                      toast.success(t("Copied!"))
                    } catch (error) {
                      console.error("Clipboard copy failed:", error)
                      toast.error(t("Copy failed"))
                    }
                  }}
                >
                  <Copy size={18} />
                </Button>
              )}
              <Button
                className="link"
                style={utilities.link.style}
                title={apiKey ? t("Rotate key") : t("Generate key")}
                disabled={isGeneratingKey}
                onClick={handleGenerateApiKey}
              >
                {isGeneratingKey ? (
                  <Loading size={18} />
                ) : (
                  <RefreshCw size={18} />
                )}
              </Button>
            </Div>
            <P
              style={{
                fontSize: "0.825rem",
                color: "var(--shade-6)",
              }}
            >
              {t("You can use this key while building with")}{" "}
              <A openInNewTab href="https://github.com/chrryai/donut">
                {t("Chrry")}
              </A>{" "}
              {t("from")}{" "}
              <A openInNewTab href="https://github.com/chrryai/donut">
                {t("Github")}
              </A>{" "}
              {t("and using")}{" "}
              <Button
                className="link"
                style={{
                  ...utilities.link.style,
                }}
                onClick={() => {
                  const a = document.createElement("a")
                  a.href = downloadUrl
                  a.download = ""
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                }}
              >
                {t("macOS")}
              </Button>{" "}
              {t("app")}
            </P>
          </Div>

          <Div style={styles.accounts.style}>
            {user?.isLinkedToGoogle ? (
              <Div style={styles.accountLinked.style}>
                <FaGoogle /> {t("Google account linked")}
              </Div>
            ) : (
              <>
                {isOAuthAccountNotLinkedError && (
                  <Div>
                    {t("Failed to link Google account, please try again")}
                  </Div>
                )}
                <Button
                  className="inverted"
                  style={{
                    ...styles.linkAccount.style,
                    ...utilities.inverted.style,
                  }}
                  onClick={() => {
                    addHapticFeedback()
                    signInContext?.("google", {
                      callbackUrl: window.location.href,
                      errorUrl: `${window.location.origin}/account?googleLinkError=true`,
                    })
                  }}
                >
                  <FaGoogle /> {t("Link Google account")}
                </Button>
              </>
            )}
            {isExtension ? null : user?.isLinkedToApple ? (
              <Div style={styles.accountLinked.style}>
                <FaApple /> {t("Apple account linked")}
              </Div>
            ) : isAppleAvailable ? (
              <>
                {isOAuthAccountNotLinkedError && (
                  <Div>
                    {t("Failed to link Apple account, please try again")}
                  </Div>
                )}
                <Button
                  style={styles.linkAccount.style}
                  onClick={() =>
                    signInContext?.("apple", {
                      callbackUrl: window.location.href,
                      errorUrl: `${window.location.origin}/account?googleLinkError=true`,
                    })
                  }
                >
                  <FaApple style={{ position: "relative", bottom: 1 }} />{" "}
                  {t("Link Apple account")}
                </Button>
              </>
            ) : null}
          </Div>
          <Div
            style={{
              ...utilities.row.style,
              marginTop: ".3rem",
            }}
          >
            <Checkbox
              checked={enableNotifications}
              onChange={(e) => setEnableNotifications(e)}
            >
              {t("Notifications")}
            </Checkbox>
            <Checkbox checked={enableSound} onChange={(e) => setEnableSound(e)}>
              {t("Sound")}
            </Checkbox>
            {/* <GitHubConnectButton
                        variant="small"
                        size={14}
                        buttonText="Connect GitHub"
                      /> */}
          </Div>
          <Div style={styles.actions.style}>
            {user?.role === "admin" && (
              <Checkbox
                checked={env === "production"}
                onChange={(e) => {
                  const newEnv = e ? "production" : "development"
                  setEnv(newEnv)
                  toast.success(
                    `Switched to ${newEnv === "production" ? "Production" : "Development"} environment`,
                  )
                }}
              >
                {t("Prod")}
              </Checkbox>
            )}

            <Button
              className="link"
              data-testid="account-logout-button"
              style={{ ...styles.logoutButton.style, ...utilities.link.style }}
              onClick={handleLogout}
            >
              {isLoggingOut ? (
                <Loading width={18} height={18} />
              ) : (
                <>
                  <LogOut size={16} />
                </>
              )}
              {t("Logout")}
            </Button>
          </Div>
        </Div>
      </Modal>
    </>
  )
}

"use client";

import { type ComponentType, lazy, memo, Suspense, useCallback, useEffect, useState } from "react";
import "./sentry";

import AddToHomeScreen from "./addToHomeScreen/AddToHomeScreen";
import { useApp } from "./context/providers";
import { useAuth } from "./context/providers/AuthProvider";
import { useNavigationContext } from "./context/providers/NavigationProvider";
import { useTribe } from "./context/providers/TribeProvider";
import { useStyles } from "./context/StylesContext";
import { ErrorBoundary } from "./ErrorBoundary";
import Home from "./Home";
import Img from "./Image";
import Loading from "./Loading";
import Modal from "./Modal";
import { Button, Div, useLocalStorage, usePlatform, VexToast } from "./platform";
import { useSidebarStyles } from "./Sidebar.styles";
import Thread from "./Thread";
import { getAppAndStoreSlugs } from "./utils/url";

const Store = lazy(() => import("./Store"));
const Calendar = lazy(() => import("./Calendar"));
const Why = lazy(() => import("./Why"));
const Privacy = lazy(() => import("./Privacy"));
const Terms = lazy(() => import("./Terms"));
const About = lazy(() => import("./about"));
const Threads = lazy(() => import("./Threads"));
const Users = lazy(() => import("./Users"));

const Programme = lazy(() => import("./Store"));

import Grape from "./Grape";
import Watermelon from "./Watermelon";

// Maybe later
// const Affiliate = lazy(() => import("./affiliate"))
// const AffiliateDashboard = lazy(() => import("./affiliateDashboard"))

// Route map with conditional lazy loading
const ROUTES: Record<string, ComponentType<any>> = {
  calendar: Calendar,
  why: Why,
  privacy: Privacy,
  terms: Terms,
  about: About,
  threads: Threads,
  watermelon: Watermelon,
  home: Home,
  // affiliate: Affiliate,
  // "affiliate/dashboard": AffiliateDashboard,
  u: Users,
};

export const Hey = memo(
  function Hey({
    children,
  }: {
    className?: string;
    children?: React.ReactNode;
    useExtensionIcon?: (slug?: string) => void;
  }) {
    const { pathname } = useNavigationContext();

    const { isExtension, isCapacitor, os } = usePlatform();

    const styles = useSidebarStyles();

    const [_pathnameLocal, setPathnameLocal] = useLocalStorage<string | undefined>(
      "pathname",
      isExtension ? pathname : undefined,
    );

    useEffect(() => {
      if (isExtension) {
        setPathnameLocal(pathname);
      }
    }, [pathname, isExtension]);

    const {
      app,
      isSplash,
      setIsSplash,
      storeApps,
      threadId,
      baseApp,
      siteConfig,
      postId,
      canShowAllTribe,
      showTribe,
      showWatermelon,
      showGrapeInitial,
      showGrape,
      FRONTEND_URL,
      showWatermelonInitial,
      hasHydrated: isHydrated,
      donut,
      // guest,
      // user,
      isDonutOpen,
      token,
    } = useAuth();

    const { utilities } = useStyles();

    const { tribeSlug, isLoadingTribes } = useTribe();

    const { appSlug } = getAppAndStoreSlugs(pathname, {
      defaultAppSlug: baseApp?.slug || siteConfig.slug,
      defaultStoreSlug: baseApp?.store?.slug || siteConfig.storeSlug,
    });

    const { currentStore } = useApp();

    const lastPathSegment = pathname.split("/").pop()?.split("?")[0];

    const ssrRoutes = ["blog"];
    const ssrPrefixes = ["/blog"];
    const isSSRRoute =
      (lastPathSegment && ssrRoutes.includes(lastPathSegment)) ||
      ssrPrefixes.some((prefix) => pathname.startsWith(prefix));

    const pathWithoutLocale = pathname
      .replace(/^\/[a-z]{2}\//, "/")
      .slice(1)
      .split("?")[0];

    const isStorePage = storeApps?.find((app) => app.store?.slug === pathWithoutLocale);

    const RouteComponent = isStorePage
      ? Store
      : pathWithoutLocale && ROUTES[pathWithoutLocale]
        ? ROUTES[pathWithoutLocale]
        : lastPathSegment && ROUTES[lastPathSegment]
          ? ROUTES[lastPathSegment]
          : null;

    const isClientRoute =
      isExtension ||
      (!isSSRRoute &&
        (!!RouteComponent ||
          threadId ||
          postId ||
          pathname === "/" ||
          pathname === "/api" ||
          app ||
          currentStore));

    const showTribeLogo = showTribe ? canShowAllTribe || tribeSlug || postId : false;

    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [minSplashTimeElapsed] = useState(true);

    // useEffect(() => {
    //   if (!isImageLoaded) return

    //   const timer = setTimeout(() => {
    //     setMinSplashTimeElapsed(true)
    //   }, 1500)
    //   return () => clearTimeout(timer)
    // }, [isImageLoaded])

    const getSplash = useCallback(
      (isSplash: boolean) => {
        const splashStyle = styles.splash;
        const hiddenStyle = styles.splashHidden;

        return (
          <Div
            style={{
              ...splashStyle.style,
              ...(!isSplash ? hiddenStyle.style : {}),
            }}
          >
            <Img
              key={app?.slug || appSlug}
              onLoad={(_src) => {
                setIsImageLoaded(true);
              }}
              slug={
                showWatermelon || showWatermelonInitial
                  ? "watermelon"
                  : showGrape || showGrapeInitial
                    ? "grape"
                    : showTribeLogo
                      ? "tribe"
                      : app
                        ? undefined
                        : appSlug
              }
              app={
                showTribeLogo ||
                showWatermelon ||
                showWatermelonInitial ||
                showGrapeInitial ||
                showGrape
                  ? undefined
                  : app
              }
              showLoading={false}
              size={
                showTribeLogo ||
                showWatermelon ||
                showWatermelonInitial ||
                showGrapeInitial ||
                showGrape
                  ? 70
                  : 64
              }
            />
          </Div>
        );
      },
      [app, isSplash, appSlug, showTribeLogo],
    );
    const splash = getSplash(isSplash);

    useEffect(() => {
      // Preload toast icons
      const preloadImages = [`${FRONTEND_URL}/frog.png`, `${FRONTEND_URL}/hamster.png`];

      if (typeof Image !== "undefined") {
        preloadImages.forEach((src) => {
          const img = new Image();
          img.src = src;
        });
      }

      // Enable body scroll on Capacitor
      if (isCapacitor && os === "ios") {
        document.body.style.overflow = "auto";
        (document.body.style as any).WebkitOverflowScrolling = "touch";
      }
    }, [FRONTEND_URL, isCapacitor, os]);

    useEffect(() => {
      isSplash &&
        // isImageLoaded &&
        isHydrated &&
        minSplashTimeElapsed &&
        app?.store?.apps?.length &&
        token &&
        setIsSplash(false);
    }, [isImageLoaded, isHydrated, isLoadingTribes, isSplash, minSplashTimeElapsed, token, app]);

    const Wrapper = ({ children }: { children: React.ReactNode }) =>
      donut ? (
        <Div>
          <Modal isModalOpen={isDonutOpen} title="donut">
            {children}
          </Modal>
          <Button className="link" style={{ ...utilities.link.style }}>
            <Img logo="donut" />
          </Button>
        </Div>
      ) : (
        <Div
          style={{
            width: donut ? undefined : "100dvw",
            height: donut ? undefined : "100dvh",
          }}
        >
          {children}
        </Div>
      );

    return (
      <Div
        style={{
          width: donut ? undefined : "100dvw",
          height: donut ? undefined : "100dvh",
        }}
      >
        <ErrorBoundary>
          {splash}
          <Suspense fallback={<Loading fullScreen />}>
            {isHydrated && (
              <>
                <Div>
                  {showWatermelon ? (
                    <Watermelon />
                  ) : showGrape ? (
                    <Grape />
                  ) : isClientRoute ? (
                    postId || tribeSlug ? (
                      <Home />
                    ) : threadId ? (
                      <Thread key={threadId} />
                    ) : RouteComponent ? (
                      <RouteComponent />
                    ) : (
                      <Home />
                    )
                  ) : (
                    children
                  )}
                </Div>
                <>
                  <VexToast />
                  <AddToHomeScreen />
                </>
              </>
            )}
          </Suspense>
        </ErrorBoundary>
      </Div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.className === nextProps.className && prevProps.children === nextProps.children;
  },
);

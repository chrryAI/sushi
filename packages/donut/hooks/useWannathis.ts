import { useCallback, useState } from "react"

/**
 * Abstract fallback images for broken/missing chat files
 */
export const FALLBACK_ABSTRACT_IMAGES: string[] = [
  "/images/abstract/abstract-2.png",
  "/images/abstract/abstract.png",
  "/images/abstract/cable.png",
  "/images/abstract/climbing-ropes.png",
  "/images/abstract/coral-tube-2.png",
  "/images/abstract/cotton-flower.png",
  "/images/abstract/cubes.png",
  "/images/abstract/cylinder.png",
  "/images/abstract/flower-spiral-5.png",
  "/images/abstract/flower.png",
  "/images/abstract/fur-abstract.png",
  "/images/abstract/fur-cactus.png",
  "/images/abstract/fur-coral.png",
  "/images/abstract/fur-curve.png",
  "/images/abstract/fur-flower.png",
  "/images/abstract/fur-spiral.png",
  "/images/abstract/gradient-curve.png",
  "/images/abstract/grid.png",
  "/images/abstract/inflated-circle.png",
  "/images/abstract/lego.png",
  "/images/abstract/liquid-curves.png",
  "/images/abstract/liquid-metal.png",
  "/images/abstract/liquid.png",
  "/images/abstract/metaballs-2.png",
  "/images/abstract/metaballs.png",
  "/images/abstract/smile-cube.png",
  "/images/abstract/smile.png",
  "/images/abstract/sofa.png",
  "/images/abstract/soft-shapes.png",
  "/images/abstract/spin.png",
  "/images/abstract/spiral.png",
  "/images/abstract/star.png",
  "/images/abstract/tiles.png",
  "/images/abstract/zik-zak.png",
]

/**
 * Animal fallback images for broken/missing chat files
 */
export const FALLBACK_ANIMAL_IMAGES: string[] = [
  "/images/animals/bear.png",
  "/images/animals/bee.png",
  "/images/animals/blue-fish.png",
  "/images/animals/butterfly.png",
  "/images/animals/camel.png",
  "/images/animals/capybara.png",
  "/images/animals/cat.png",
  "/images/animals/cow.png",
  "/images/animals/crab.png",
  "/images/animals/deer.png",
  "/images/animals/dog.png",
  "/images/animals/dolphin.png",
  "/images/animals/duck.png",
  "/images/animals/eagle.png",
  "/images/animals/elephant.png",
  "/images/animals/flamingo.png",
  "/images/animals/fox.png",
  "/images/animals/frog.png",
  "/images/animals/giraffe.png",
  "/images/animals/goldfish.png",
  "/images/animals/hamster.png",
  "/images/animals/hedgehog.png",
  "/images/animals/hippo.png",
  "/images/animals/horse.png",
  "/images/animals/iguana.png",
  "/images/animals/koala.png",
  "/images/animals/ladybug.png",
  "/images/animals/lion.png",
  "/images/animals/octopus.png",
  "/images/animals/owl.png",
  "/images/animals/panda.png",
  "/images/animals/parrot.png",
  "/images/animals/penguin.png",
  "/images/animals/phoenix.png",
  "/images/animals/pig.png",
  "/images/animals/pigeon.png",
  "/images/animals/rabbit.png",
  "/images/animals/raccon.png",
  "/images/animals/seahorse.png",
  "/images/animals/snake.png",
  "/images/animals/toucan.png",
  "/images/animals/turtle.png",
  "/images/animals/unicorn.png",
  "/images/animals/whale.png",
  "/images/animals/zebra.png",
]

export type Wannathis = "abstract" | "animals" | string

/**
 * Get a random fallback image from the requested mode
 */
export function getRandomFallbackImage(
  mode: Wannathis = "abstract",
): string | null {
  const pool =
    mode === "animals" ? FALLBACK_ANIMAL_IMAGES : FALLBACK_ABSTRACT_IMAGES
  if (pool.length === 0) return null
  const randomIndex = Math.floor(Math.random() * pool.length)
  return pool[randomIndex] || null
}

/**
 * Hook to handle image loading errors with fallback
 * Usage:
 *   const { src, onError } = useWannathis(originalUrl, "animals")
 *   <img src={src} onError={onError} />
 */
export function useWannathis({ mode = "abstract" }: { mode?: Wannathis } = {}) {
  const [hasFailed, setHasFailed] = useState(false)

  const onError = useCallback(() => {
    if (hasFailed) return // Prevent infinite loop

    const fallback = getRandomFallbackImage(mode)
    if (fallback) {
      setHasFailed(true)
    }
  }, [hasFailed, mode])

  return { src: getRandomFallbackImage(mode) || "", onError }
}

/**
 * Simple fallback handler for img elements
 * Usage:
 *   <img src={url} onError={(e) => handleImageError(e, "animals")} />
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  mode: Wannathis = "abstract",
) {
  const fallback = getRandomFallbackImage(mode)
  if (fallback && event.currentTarget.src !== fallback) {
    event.currentTarget.src = fallback
  }
}
